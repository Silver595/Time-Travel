document.addEventListener('DOMContentLoaded', () => {
    const compareBtn = document.getElementById('compareBtn');
    const status = document.getElementById('status');
    const datePicker = document.getElementById('datePicker');
    const loading = document.getElementById('loading');
    const clearDateBtn = document.getElementById('clearDate');

    const MAX_LOOKBACK_DAYS = 30;

    // Init date input
    const today = new Date().toISOString().split('T')[0];
    datePicker.max = today;
    chrome.storage.local.get('lastPickedDate', ({ lastPickedDate }) => {
      if (lastPickedDate) datePicker.value = lastPickedDate;
    });

    clearDateBtn.addEventListener('click', () => {
      datePicker.value = '';
      chrome.storage.local.remove('lastPickedDate');
      updateStatus('', 'gray');
    });

    compareBtn.addEventListener('click', async () => {
      updateStatus('Searching for closest snapshot...', 'blue');
      toggleUI(true);

      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.url) {
          updateStatus('❌ Could not get current tab URL.', 'red');
          toggleUI(false);
          return;
        }
        const currentUrl = encodeURIComponent(tab.url);
        const baseDate = datePicker.value || today;
        chrome.storage.local.set({ lastPickedDate: baseDate });

        const closestSnapshot = await findClosestSnapshot(tab.url, baseDate, MAX_LOOKBACK_DAYS);

        if (closestSnapshot) {
          const snapshotUrl = closestSnapshot.url;
          const snapshotDate = closestSnapshot.timestamp.substring(0, 8).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');

          chrome.tabs.create({
            url: chrome.runtime.getURL(`splitscreen.html?live=${currentUrl}&archive=${encodeURIComponent(snapshotUrl)}`)
          });

          updateStatus(`✅ Found snapshot from ${snapshotDate}. Opening...`, 'green');
        } else {
          updateStatus(`❌ No archive found in last ${MAX_LOOKBACK_DAYS} days.`, 'red');
        }
      } catch (err) {
        console.error(err);
        updateStatus('❌ Error while fetching snapshot.', 'red');
      } finally {
        toggleUI(false);
      }
    });

    // Validate that a snapshot URL actually points to archive.org
    function isValidSnapshotUrl(url) {
      try {
        const host = new URL(url).hostname;
        return host === 'web.archive.org' || host === 'archive.org';
      } catch {
        return false;
      }
    }

    // Primary: Single call to Wayback Availability API (returns closest snapshot automatically)
    async function findViaAvailabilityAPI(url, timestamp) {
      const api = `https://archive.org/wayback/available?url=${encodeURIComponent(url)}&timestamp=${timestamp}`;
      const res = await fetch(api);
      if (!res.ok) return null;

      const json = await res.json();
      const snapshot = json?.archived_snapshots?.closest;

      if (snapshot?.available && snapshot.url && isValidSnapshotUrl(snapshot.url)) {
        return snapshot;
      }
      return null;
    }

    // Fallback: CDX API — searches an entire date range in one request
    async function findViaCDX(url, startDate, maxDays) {
      const from = new Date(startDate);
      from.setDate(from.getDate() - maxDays);
      const fromStr = from.toISOString().split('T')[0].replace(/-/g, '');
      const toStr = new Date(startDate).toISOString().split('T')[0].replace(/-/g, '');

      const api = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}&from=${fromStr}&to=${toStr}&output=json&limit=-1&fl=timestamp,statuscode`;
      const res = await fetch(api);
      if (!res.ok) return null;

      const rows = await res.json();
      // First row is headers ["timestamp","statuscode"], rest are data
      if (!rows || rows.length < 2) return null;

      // Find the most recent successful snapshot (status 200)
      for (let i = rows.length - 1; i >= 1; i--) {
        const [timestamp, statuscode] = rows[i];
        if (statuscode === '200') {
          const snapshotUrl = `https://web.archive.org/web/${timestamp}/${url}`;
          return { url: snapshotUrl, timestamp, available: true };
        }
      }
      return null;
    }

    // Combined: fast primary → fallback
    async function findClosestSnapshot(url, startDate, maxDays) {
      const timestamp = new Date(startDate).toISOString().split('T')[0].replace(/-/g, '') + '000000';

      // Try the fast availability API first (single request)
      try {
        const result = await findViaAvailabilityAPI(url, timestamp);
        if (result) return result;
      } catch (err) {
        console.warn('Availability API failed, trying CDX fallback:', err.message);
      }

      // Fallback: CDX API searches the full date range in one request
      try {
        return await findViaCDX(url, startDate, maxDays);
      } catch (err) {
        console.warn('CDX API fallback also failed:', err.message);
        return null;
      }
    }

    function updateStatus(message, color) {
      status.textContent = message;
      status.className = `text-base text-${color}-600 text-center`;
    }

    function toggleUI(isLoading) {
      compareBtn.disabled = isLoading;
      loading.classList.toggle('hidden', !isLoading);
    }
  });
