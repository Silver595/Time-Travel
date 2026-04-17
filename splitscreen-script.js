document.addEventListener('DOMContentLoaded', async () => {
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

    // --- Strip iframe-blocking headers for this tab only ---
    const RULE_ID = 1;

    async function enableIframeLoading() {
      try {
        const tab = await chrome.tabs.getCurrent();
        if (!tab?.id) return;

        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: [RULE_ID],
          addRules: [
            {
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
            }
          ]
        });
        console.log('Iframe header rules enabled for tab', tab.id);
      } catch (err) {
        console.warn('Could not set up iframe header rules:', err);
      }
    }

    async function disableIframeLoading() {
      try {
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: [RULE_ID]
        });
      } catch (_) {}
    }

    // Enable header stripping BEFORE loading iframes
    await enableIframeLoading();

    // Clean up rules when the page closes
    window.addEventListener('beforeunload', () => {
      disableIframeLoading();
    });

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
  
    // --- Set iframe sources (after header rules are active) ---
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

    // --- Detect blocked iframes (fallback for JS-based frame busting) ---
    const detectBlockedIframe = (frame, panel, url) => {
      // Check multiple times — some sites take a moment to bust out
      const checks = [2000, 5000];
      checks.forEach(delay => {
        setTimeout(() => {
          try {
            // Cross-origin frames throw on contentDocument access
            void frame.contentDocument;
          } catch {
            // Cross-origin is expected and fine — means it loaded
            return;
          }
          // If we CAN access contentDocument, check if it's empty (failed to load)
          if (frame.contentDocument && frame.contentDocument.body) {
            const bodyText = frame.contentDocument.body.innerText?.trim() || '';
            if (bodyText === '' && frame.contentDocument.title === '') {
              panel.classList.remove('hidden');
            }
          }
        }, delay);
      });

      // Also listen for load errors
      frame.addEventListener('error', () => {
        panel.classList.remove('hidden');
      });
    };

    detectBlockedIframe(liveFrame, liveBlocked, liveUrl);
    detectBlockedIframe(archiveFrame, archiveBlocked, archiveUrl);

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
  
    // Feature: Keyboard shortcuts for layout and toggling
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key === 'h') setLayout('horizontal');
      if (e.altKey && e.key === 'v') setLayout('vertical');
      if (e.altKey && e.key === 'l') hideLiveBtn?.click();
      if (e.altKey && e.key === 'a') hideArchiveBtn?.click();
    });
  });
