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
    });
  
    compareBtn.addEventListener('click', async () => {
      updateStatus('Searching for closest snapshot...', 'blue');
      toggleUI(true);
  
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const currentUrl = encodeURIComponent(tab.url);
        const baseDate = datePicker.value || today;
        chrome.storage.local.set({ lastPickedDate: baseDate });
  
        const closestSnapshot = await findClosestSnapshot(currentUrl, baseDate, MAX_LOOKBACK_DAYS);
  
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
  
    // Fallback engine
    async function findClosestSnapshot(url, startDate, maxDays) {
      for (let i = 0; i <= maxDays; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() - i);
        const yyyymmdd = date.toISOString().split('T')[0].replace(/-/g, '') + '000000';
        const api = `https://archive.org/wayback/available?url=${url}&timestamp=${yyyymmdd}`;
  
        try {
          const res = await fetch(api);
          const json = await res.json();
          if (json?.archived_snapshots?.closest?.available) {
            return json.archived_snapshots.closest;
          }
        } catch (_) {}
      }
      return null;
    }
  
    function updateStatus(message, color) {
      status.textContent = message;
      status.className = `text-sm text-${color}-600 text-center`;
    }
  
    function toggleUI(isLoading) {
      compareBtn.disabled = isLoading;
      loading.classList.toggle('hidden', !isLoading);
    }
  });
  