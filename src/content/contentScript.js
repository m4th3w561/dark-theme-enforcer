(function () {
  if (!window.DarkColorUtils) {
    console.error("DarkColorUtils not found. Make sure colorUtils.js is loaded first.");
    return;
  }

  if (window.__DMX_DARK_MODE_INSTANCE__) {
    return;
  }
  window.__DMX_DARK_MODE_INSTANCE__ = true;

  let processedElements = new WeakSet();
  let mutationObserver = null;
  let debounceTimer = null;
  const DEBOUNCE_DELAY = 150;

  document.documentElement.classList.add("dmx-dark-mode");

  // Constants
  const DARK_BG = { r: 18, g: 18, b: 18 };
  const DARK_BG_CSS = "#121212";
  const LIGHT_TEXT_DEFAULT = { r: 227, g: 227, b: 227 };
  const MIN_TEXT_CONTRAST = 4.5;
  const BRIGHT_THRESHOLD = 200;
  const MAX_ELEMENTS_TO_PROCESS = 3000;

  // Tags to skip (non-visual or media elements)
  const SKIP_TAGS = new Set([
    "script", "style", "meta", "head", "link", "title", "noscript",
    "img", "video", "picture", "canvas", "svg", "iframe", "embed", "object"
  ]);

  /**
   * Check if element is visible
   */
  function isElementVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return style.display !== "none" && style.visibility !== "hidden";
  }

  function processElement(el) {
    if (processedElements.has(el)) {
      return;
    }

    try {
      const computedStyle = window.getComputedStyle(el);
      const tagName = el.tagName?.toLowerCase();

      if (SKIP_TAGS.has(tagName)) {
        return;
      }

      processedElements.add(el);

      // Process background color
      const bgColorStr = computedStyle.backgroundColor;
      if (bgColorStr && bgColorStr !== "rgba(0, 0, 0, 0)" && bgColorStr !== "transparent") {
        const bgRgb = window.DarkColorUtils.colorStringToRgb(bgColorStr);
        if (bgRgb) {
          const brightness = window.DarkColorUtils.getBrightness(bgRgb);
          if (brightness > BRIGHT_THRESHOLD) {
            // Light background detected - transform to dark
            const darkBg = window.DarkColorUtils.calculateOppositeForLightColor(bgRgb, {
              darkBackgroundRgb: DARK_BG,
              mode: "background"
            });
            el.style.backgroundColor = window.DarkColorUtils.rgbToCss(darkBg);
          }
        }
      }

      // Process text color
      const textColorStr = computedStyle.color;
      if (textColorStr) {
        const textRgb = window.DarkColorUtils.colorStringToRgb(textColorStr);
        if (textRgb) {
          // Get current background (after potential transformation)
          const currentBgStr = el.style.backgroundColor || computedStyle.backgroundColor;
          const currentBgRgb = window.DarkColorUtils.colorStringToRgb(currentBgStr) || DARK_BG;

          // Check if text needs adjustment for dark background
          const textBrightness = window.DarkColorUtils.getBrightness(textRgb);
          const bgBrightness = window.DarkColorUtils.getBrightness(currentBgRgb);

          // If background is dark and text is also dark, or contrast is too low
          const contrast = window.DarkColorUtils.contrastRatio(textRgb, currentBgRgb);
          if (bgBrightness < 100 && (textBrightness < 150 || contrast < MIN_TEXT_CONTRAST)) {
            // Transform text to be light and high contrast
            let lightText = window.DarkColorUtils.calculateOppositeForLightColor(textRgb, {
              darkBackgroundRgb: currentBgRgb,
              mode: "text"
            });

            // Ensure minimum contrast
            lightText = window.DarkColorUtils.ensureContrast(lightText, currentBgRgb, MIN_TEXT_CONTRAST);

            // Fallback to default if still too dark
            const finalBrightness = window.DarkColorUtils.getBrightness(lightText);
            if (finalBrightness < 180) {
              lightText = LIGHT_TEXT_DEFAULT;
            }

            el.style.color = window.DarkColorUtils.rgbToCss(lightText);
          }
        }
      }
    } catch (error) {
      // Silently skip elements that cause errors
      console.debug("Error processing element:", error);
    }
  }

  function processElementsBatch(elements) {
    const elementsToProcess = elements
      .filter(el => !processedElements.has(el) && isElementVisible(el))
      .slice(0, MAX_ELEMENTS_TO_PROCESS);

    if (elementsToProcess.length === 0) return;

    let index = 0;
    const chunkSize = 50;

    function processChunk() {
      const end = Math.min(index + chunkSize, elementsToProcess.length);
      for (let i = index; i < end; i++) {
        processElement(elementsToProcess[i]);
      }
      index = end;

      if (index < elementsToProcess.length) {
        if (window.requestIdleCallback) {
          requestIdleCallback(processChunk, { timeout: 100 });
        } else {
          setTimeout(processChunk, 10);
        }
      }
    }

    if (window.requestIdleCallback) {
      requestIdleCallback(processChunk, { timeout: 100 });
    } else {
      processChunk();
    }
  }

  function applyDarkMode() {
    try {
      const allElements = document.querySelectorAll("body, body *");
      const elements = Array.from(allElements).filter(el => {
        const tagName = el.tagName?.toLowerCase();
        return !SKIP_TAGS.has(tagName);
      });
      processElementsBatch(elements);
    } catch (error) {
      console.error("Error while applying dark mode:", error);
    }
  }

  function handleMutations(mutations) {
    const newElements = [];

    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName?.toLowerCase();
            if (!SKIP_TAGS.has(tagName)) {
              newElements.push(node);
              const descendants = node.querySelectorAll("*");
              for (const desc of descendants) {
                const descTagName = desc.tagName?.toLowerCase();
                if (!SKIP_TAGS.has(descTagName)) {
                  newElements.push(desc);
                }
              }
            }
          }
        }
      }
    }

    if (newElements.length > 0) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        processElementsBatch(newElements);
      }, DEBOUNCE_DELAY);
    }
  }

  function startObserver() {
    if (mutationObserver || !document.body) {
      return;
    }

    mutationObserver = new MutationObserver(handleMutations);
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function stopObserver() {
    if (mutationObserver) {
      mutationObserver.disconnect();
      mutationObserver = null;
    }
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  }

  function disableDarkMode() {
    document.documentElement.classList.remove("dmx-dark-mode");
    stopObserver();
    processedElements = new WeakSet();
    const allElements = document.querySelectorAll("body, body *");
    for (const el of allElements) {
      if (el.style.backgroundColor) {
        el.style.backgroundColor = "";
      }
      if (el.style.color) {
        el.style.color = "";
      }
    }
    window.__DMX_DARK_MODE_INSTANCE__ = false;
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "disable") {
      disableDarkMode();
      sendResponse({ success: true });
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(() => {
        applyDarkMode();
        startObserver();
      }, 100);
    });
  } else {
    setTimeout(() => {
      applyDarkMode();
      startObserver();
    }, 100);
  }
})();

