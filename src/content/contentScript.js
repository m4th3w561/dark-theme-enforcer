// Main content script for dark theme transformation
// Analyzes page colors and applies dark mode transformations

(function () {
  // Guard against double-application
  if (window.__DMX_DARK_MODE_APPLIED__) {
    return;
  }
  window.__DMX_DARK_MODE_APPLIED__ = true;

  // Ensure color utilities are available
  if (!window.DarkColorUtils) {
    console.error("DarkColorUtils not found. Make sure colorUtils.js is loaded first.");
    return;
  }

  // Add dark mode class to html element
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

  /**
   * Process a single element's colors
   */
  function processElement(el) {
    try {
      const computedStyle = window.getComputedStyle(el);
      const tagName = el.tagName?.toLowerCase();

      // Skip media elements
      if (SKIP_TAGS.has(tagName)) {
        return;
      }

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

  /**
   * Main processing function
   */
  function applyDarkMode() {
    try {
      // Collect all elements starting from body
      const allElements = document.querySelectorAll("body, body *");
      const elements = Array.from(allElements).filter(el => {
        const tagName = el.tagName?.toLowerCase();
        return !SKIP_TAGS.has(tagName) && isElementVisible(el);
      });

      // Limit processing for performance
      const elementsToProcess = elements.slice(0, MAX_ELEMENTS_TO_PROCESS);

      // Process elements in chunks to keep page responsive
      let index = 0;
      const chunkSize = 50;

      function processChunk() {
        const end = Math.min(index + chunkSize, elementsToProcess.length);
        for (let i = index; i < end; i++) {
          processElement(elementsToProcess[i]);
        }
        index = end;

        if (index < elementsToProcess.length) {
          // Use requestIdleCallback if available, otherwise setTimeout
          if (window.requestIdleCallback) {
            requestIdleCallback(processChunk, { timeout: 100 });
          } else {
            setTimeout(processChunk, 10);
          }
        }
      }

      // Start processing
      if (elementsToProcess.length > 0) {
        if (window.requestIdleCallback) {
          requestIdleCallback(processChunk, { timeout: 100 });
        } else {
          processChunk();
        }
      }
    } catch (error) {
      console.error("Error while applying dark mode:", error);
    }
  }

  // Start processing after a short delay to ensure DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyDarkMode);
  } else {
    // Use setTimeout to allow CSS injection to complete first
    setTimeout(applyDarkMode, 100);
  }
})();

