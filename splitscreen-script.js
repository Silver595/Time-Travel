document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const liveUrl = params.get('live');
    const archiveUrl = params.get('archive');
  
    const liveFrame = document.getElementById('liveFrame');
    const archiveFrame = document.getElementById('archiveFrame');
    const splitScreen = document.getElementById('splitScreen');
    const archiveBlocked = document.getElementById('archiveBlocked');
    const liveBlocked = document.getElementById('liveBlocked');
  
    // Null checks for critical DOM elements
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

    // --- URL Validation Helpers ---
    function isValidHttpUrl(urlString) {
      try {
        const url = new URL(urlString);
        return url.protocol === 'https:' || url.protocol === 'http:';
      } catch {
        return false;
      }
    }

    function isArchiveUrl(urlString) {
      try {
        const url = new URL(urlString);
        return url.hostname === 'web.archive.org' || url.hostname === 'archive.org';
      } catch {
        return false;
      }
    }

    // Feature: Toggle button text for better UX
    const hideLiveBtn = document.getElementById('hideLive');
    const hideArchiveBtn = document.getElementById('hideArchive');
    let liveVisible = true;
    let archiveVisible = true;
  
    const setLayout = (layout) => {
      const isHorizontal = layout === 'horizontal';
      splitScreen.style.flexDirection = isHorizontal ? 'row' : 'column';
      splitScreen.querySelectorAll('iframe').forEach((iframe) => {
        iframe.style.borderRight = isHorizontal ? '1px solid #ddd' : 'none';
        iframe.style.borderBottom = !isHorizontal ? '1px solid #ddd' : 'none';
      });
      chrome.storage.local.set({ layoutPreference: layout });
    };
  
    const detectBlockedIframe = (frame, panel) => {
      setTimeout(() => {
        try {
          void frame.contentDocument;
        } catch {
          panel.classList.remove('hidden');
        }
      }, 1000);
    };
  
    // Set iframe sources — with validation
    if (isArchiveUrl(archiveUrl)) {
      archiveFrame.src = archiveUrl;
    } else {
      archiveBlocked.classList.remove('hidden');
      archiveBlocked.querySelector('p').textContent = 'Invalid archive URL — must be from archive.org.';
    }

    if (isValidHttpUrl(liveUrl)) {
      liveFrame.src = liveUrl;
    } else {
      liveBlocked.classList.remove('hidden');
      liveBlocked.querySelector('p').textContent = 'Invalid live URL — only http/https allowed.';
    }
  
    // Layout preference
    chrome.storage.local.get('layoutPreference', ({ layoutPreference }) => {
      setLayout(layoutPreference || 'horizontal');
    });
  
    // Buttons
    document.getElementById('horizontalBtn')?.addEventListener('click', () => setLayout('horizontal'));
    document.getElementById('verticalBtn')?.addEventListener('click', () => setLayout('vertical'));
  
    // Toggle live frame
    hideLiveBtn?.addEventListener('click', () => {
      liveVisible = !liveVisible;
      liveFrame.style.display = liveVisible ? 'block' : 'none';
      hideLiveBtn.textContent = liveVisible ? 'Toggle Live' : 'Show Live';
    });
    // Toggle archive frame
    hideArchiveBtn?.addEventListener('click', () => {
      archiveVisible = !archiveVisible;
      archiveFrame.style.display = archiveVisible ? 'block' : 'none';
      hideArchiveBtn.textContent = archiveVisible ? 'Toggle Archive' : 'Show Archive';
    });
  
    // Open in new tab — with validation + noopener
    document.getElementById('openLive')?.addEventListener('click', () => {
      if (isValidHttpUrl(liveUrl)) {
        window.open(liveUrl, '_blank', 'noopener,noreferrer');
      }
    });
    document.getElementById('openArchive')?.addEventListener('click', () => {
      if (isArchiveUrl(archiveUrl)) {
        window.open(archiveUrl, '_blank', 'noopener,noreferrer');
      }
    });
  
    // Detect iframe blocking
    detectBlockedIframe(liveFrame, liveBlocked);
    detectBlockedIframe(archiveFrame, archiveBlocked);
  
    // Feature: Keyboard shortcuts for layout and toggling
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key === 'h') setLayout('horizontal');
      if (e.altKey && e.key === 'v') setLayout('vertical');
      if (e.altKey && e.key === 'l') hideLiveBtn?.click();
      if (e.altKey && e.key === 'a') hideArchiveBtn?.click();
    });
  });
