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
      splitScreen.innerHTML = '<div class="w-full text-center text-red-600 p-8">Missing URL parameters.</div>';
      return;
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
  
    // Set iframe sources
    archiveFrame.src = archiveUrl;
    liveFrame.src = liveUrl;
  
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
  
    document.getElementById('openLive')?.addEventListener('click', () => window.open(liveUrl, '_blank'));
    document.getElementById('openArchive')?.addEventListener('click', () => window.open(archiveUrl, '_blank'));
  
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
