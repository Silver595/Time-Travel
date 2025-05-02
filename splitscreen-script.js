document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const liveUrl = params.get('live');
    const archiveUrl = params.get('archive');
  
    const liveFrame = document.getElementById('liveFrame');
    const archiveFrame = document.getElementById('archiveFrame');
    const splitScreen = document.getElementById('splitScreen');
  
    const archiveBlocked = document.getElementById('archiveBlocked');
    const liveBlocked = document.getElementById('liveBlocked');
  
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
    document.getElementById('horizontalBtn').addEventListener('click', () => setLayout('horizontal'));
    document.getElementById('verticalBtn').addEventListener('click', () => setLayout('vertical'));
    document.getElementById('hideLive').addEventListener('click', () => {
      liveFrame.style.display = liveFrame.style.display === 'none' ? 'block' : 'none';
    });
    document.getElementById('hideArchive').addEventListener('click', () => {
      archiveFrame.style.display = archiveFrame.style.display === 'none' ? 'block' : 'none';
    });
    document.getElementById('openLive').addEventListener('click', () => window.open(liveUrl, '_blank'));
    document.getElementById('openArchive').addEventListener('click', () => window.open(archiveUrl, '_blank'));
  
    // Detect iframe blocking
    detectBlockedIframe(liveFrame, liveBlocked);
    detectBlockedIframe(archiveFrame, archiveBlocked);
  });
  