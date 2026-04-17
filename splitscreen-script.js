document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const liveUrl = params.get('live');
    const archiveUrl = params.get('archive');
  
    const liveFrame = document.getElementById('liveFrame');
    const archiveFrame = document.getElementById('archiveFrame');
    const splitScreen = document.getElementById('splitScreen');
    const archiveBlocked = document.getElementById('archiveBlocked');
    const liveBlocked = document.getElementById('liveBlocked');
  
    if (!liveFrame || !archiveFrame || !splitScreen) {
      console.error('Critical DOM elements missing.');
      return;
    }

    if (!liveUrl || !archiveUrl) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'w-full text-center text-red-600 p-8';
      errorDiv.textContent = 'Missing URL parameters.';
      splitScreen.replaceChildren(errorDiv);
      return;
    }

    // --- URL Validation ---
    function isValidHttpUrl(urlString) {
      try {
        const url = new URL(urlString);
        return url.protocol === 'https:' || url.protocol === 'http:';
      } catch { return false; }
    }

    function isArchiveUrl(urlString) {
      try {
        const url = new URL(urlString);
        return url.hostname === 'web.archive.org' || url.hostname === 'archive.org';
      } catch { return false; }
    }

    // --- Strip iframe-blocking headers (fire-and-forget) ---
    const RULE_ID = 1;

    function setupHeaderRules() {
      if (!chrome?.declarativeNetRequest?.updateDynamicRules) {
        console.warn('declarativeNetRequest not available');
        return Promise.resolve();
      }

      return chrome.tabs.getCurrent().then(tab => {
        if (!tab?.id) return;
        return chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: [RULE_ID],
          addRules: [{
            id: RULE_ID,
            priority: 1,
            action: {
              type: 'modifyHeaders',
              responseHeaders: [
                { header: 'x-frame-options', operation: 'remove' },
                { header: 'content-security-policy', operation: 'remove' },
              ]
            },
            condition: {
              tabIds: [tab.id],
              resourceTypes: ['sub_frame']
            }
          }]
        });
      }).catch(err => console.warn('Header rule setup failed:', err));
    }

    function cleanupRules() {
      if (!chrome?.declarativeNetRequest?.updateDynamicRules) return;
      chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [RULE_ID] }).catch(() => {});
    }

    // --- Load iframes ---
    function loadIframes() {
      if (isArchiveUrl(archiveUrl)) {
        archiveFrame.src = archiveUrl;
      } else {
        archiveBlocked.classList.remove('hidden');
        archiveBlocked.querySelector('p').textContent = 'Invalid archive URL.';
      }

      if (isValidHttpUrl(liveUrl)) {
        liveFrame.src = liveUrl;
      } else {
        liveBlocked.classList.remove('hidden');
        liveBlocked.querySelector('p').textContent = 'Invalid live URL.';
      }
    }

    // Set up rules first, then load iframes (with timeout fallback)
    let iframesLoaded = false;
    setupHeaderRules().then(() => {
      if (!iframesLoaded) {
        iframesLoaded = true;
        loadIframes();
      }
    });
    // Fallback: load iframes after 300ms even if rule setup hangs
    setTimeout(() => {
      if (!iframesLoaded) {
        iframesLoaded = true;
        loadIframes();
      }
    }, 300);

    window.addEventListener('beforeunload', cleanupRules);

    // --- Detect blocked iframes ---
    function detectBlockedIframe(frame, panel) {
      setTimeout(() => {
        try { void frame.contentDocument; } catch { return; }
        if (frame.contentDocument?.body?.innerText?.trim() === '' && !frame.contentDocument.title) {
          panel.classList.remove('hidden');
        }
      }, 3000);
    }
    detectBlockedIframe(liveFrame, liveBlocked);
    detectBlockedIframe(archiveFrame, archiveBlocked);

    // --- UI Controls ---
    const hideLiveBtn = document.getElementById('hideLive');
    const hideArchiveBtn = document.getElementById('hideArchive');
    let liveVisible = true, archiveVisible = true;
  
    const setLayout = (layout) => {
      const isHorizontal = layout === 'horizontal';
      splitScreen.style.flexDirection = isHorizontal ? 'row' : 'column';
      splitScreen.querySelectorAll('iframe').forEach(iframe => {
        iframe.style.borderRight = isHorizontal ? '1px solid #ddd' : 'none';
        iframe.style.borderBottom = !isHorizontal ? '1px solid #ddd' : 'none';
      });
      chrome.storage.local.set({ layoutPreference: layout });
    };

    chrome.storage.local.get('layoutPreference', ({ layoutPreference }) => {
      setLayout(layoutPreference || 'horizontal');
    });

    document.getElementById('horizontalBtn')?.addEventListener('click', () => setLayout('horizontal'));
    document.getElementById('verticalBtn')?.addEventListener('click', () => setLayout('vertical'));

    hideLiveBtn?.addEventListener('click', () => {
      liveVisible = !liveVisible;
      liveFrame.style.display = liveVisible ? 'block' : 'none';
      hideLiveBtn.textContent = liveVisible ? 'Toggle Live' : 'Show Live';
    });
    hideArchiveBtn?.addEventListener('click', () => {
      archiveVisible = !archiveVisible;
      archiveFrame.style.display = archiveVisible ? 'block' : 'none';
      hideArchiveBtn.textContent = archiveVisible ? 'Toggle Archive' : 'Show Archive';
    });

    document.getElementById('openLive')?.addEventListener('click', () => {
      if (isValidHttpUrl(liveUrl)) window.open(liveUrl, '_blank', 'noopener,noreferrer');
    });
    document.getElementById('openArchive')?.addEventListener('click', () => {
      if (isArchiveUrl(archiveUrl)) window.open(archiveUrl, '_blank', 'noopener,noreferrer');
    });

    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key === 'h') setLayout('horizontal');
      if (e.altKey && e.key === 'v') setLayout('vertical');
      if (e.altKey && e.key === 'l') hideLiveBtn?.click();
      if (e.altKey && e.key === 'a') hideArchiveBtn?.click();
    });
  });
