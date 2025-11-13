// Color utility functions for dark theme transformation
// Exposed as window.DarkColorUtils namespace

(function () {
  // Prevent re-initialization if already loaded
  if (window.DarkColorUtils) return;

  const DarkColorUtils = {};

  /**
   * Parse RGB/RGBA color string to RGB object
   * @param {string} colorStr - CSS color string like "rgb(255, 128, 64)" or "rgba(255, 128, 64, 0.5)"
   * @returns {{r: number, g: number, b: number}|null}
   */
  DarkColorUtils.parseRgbString = function (colorStr) {
    if (!colorStr || typeof colorStr !== "string") return null;

    const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return null;

    return {
      r: parseInt(match[1], 10),
      g: parseInt(match[2], 10),
      b: parseInt(match[3], 10)
    };
  };

  /**
   * Convert hex color to RGB object
   * @param {string} colorStr - Hex color like "#fff" or "#ffffff"
   * @returns {{r: number, g: number, b: number}|null}
   */
  DarkColorUtils.hexToRgb = function (colorStr) {
    if (!colorStr || typeof colorStr !== "string") return null;

    let hex = colorStr.trim().replace("#", "");
    if (hex.length === 3) {
      hex = hex.split("").map(c => c + c).join("");
    }
    if (hex.length !== 6) return null;

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;

    return { r, g, b };
  };

  /**
   * Convert any CSS color string to RGB object
   * @param {string} colorStr - CSS color string
   * @returns {{r: number, g: number, b: number}|null}
   */
  DarkColorUtils.colorStringToRgb = function (colorStr) {
    if (!colorStr || typeof colorStr !== "string") return null;

    const trimmed = colorStr.trim().toLowerCase();

    if (trimmed.startsWith("rgb")) {
      return DarkColorUtils.parseRgbString(trimmed);
    }
    if (trimmed.startsWith("#")) {
      return DarkColorUtils.hexToRgb(trimmed);
    }

    // Handle named colors (basic set)
    const namedColors = {
      white: { r: 255, g: 255, b: 255 },
      black: { r: 0, g: 0, b: 0 },
      red: { r: 255, g: 0, b: 0 },
      green: { r: 0, g: 128, b: 0 },
      blue: { r: 0, g: 0, b: 255 },
      yellow: { r: 255, g: 255, b: 0 },
      cyan: { r: 0, g: 255, b: 255 },
      magenta: { r: 255, g: 0, b: 255 },
      gray: { r: 128, g: 128, b: 128 },
      grey: { r: 128, g: 128, b: 128 }
    };

    if (namedColors[trimmed]) {
      return namedColors[trimmed];
    }

    return null;
  };

  /**
   * Calculate perceived brightness of an RGB color
   * @param {{r: number, g: number, b: number}} rgb - RGB color object
   * @returns {number} Brightness value (0-255)
   */
  DarkColorUtils.getBrightness = function (rgb) {
    if (!rgb || typeof rgb.r !== "number" || typeof rgb.g !== "number" || typeof rgb.b !== "number") {
      return 0;
    }
    return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  };

  /**
   * Check if a color is considered "light"
   * @param {{r: number, g: number, b: number}} rgb - RGB color object
   * @param {number} threshold - Brightness threshold (default: 200)
   * @returns {boolean}
   */
  DarkColorUtils.isLightColor = function (rgb, threshold) {
    if (!rgb) return false;
    const brightness = DarkColorUtils.getBrightness(rgb);
    return brightness > (threshold || 200);
  };

  /**
   * Invert an RGB color
   * @param {{r: number, g: number, b: number}} rgb - RGB color object
   * @returns {{r: number, g: number, b: number}}
   */
  DarkColorUtils.invertRgb = function (rgb) {
    if (!rgb) return { r: 0, g: 0, b: 0 };
    return {
      r: 255 - rgb.r,
      g: 255 - rgb.g,
      b: 255 - rgb.b
    };
  };

  /**
   * Convert RGB object to CSS color string
   * @param {{r: number, g: number, b: number}} rgb - RGB color object
   * @returns {string} CSS color string like "rgb(255, 128, 64)"
   */
  DarkColorUtils.rgbToCss = function (rgb) {
    if (!rgb) return "rgb(0, 0, 0)";
    return `rgb(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)})`;
  };

  /**
   * Calculate relative luminance per WCAG
   * @param {{r: number, g: number, b: number}} rgb - RGB color object
   * @returns {number} Relative luminance (0-1)
   */
  DarkColorUtils.getRelativeLuminance = function (rgb) {
    if (!rgb) return 0;

    const normalize = (val) => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    };

    const rLin = normalize(rgb.r);
    const gLin = normalize(rgb.g);
    const bLin = normalize(rgb.b);

    return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
  };

  /**
   * Calculate contrast ratio between two colors per WCAG
   * @param {{r: number, g: number, b: number}} fg - Foreground RGB color
   * @param {{r: number, g: number, b: number}} bg - Background RGB color
   * @returns {number} Contrast ratio (1.0-21.0)
   */
  DarkColorUtils.contrastRatio = function (fg, bg) {
    if (!fg || !bg) return 1;

    const lum1 = DarkColorUtils.getRelativeLuminance(fg);
    const lum2 = DarkColorUtils.getRelativeLuminance(bg);

    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);

    return (lighter + 0.05) / (darker + 0.05);
  };

  /**
   * Ensure minimum contrast ratio by adjusting foreground color
   * @param {{r: number, g: number, b: number}} fg - Foreground RGB color
   * @param {{r: number, g: number, b: number}} bg - Background RGB color
   * @param {number} minRatio - Minimum desired contrast ratio
   * @returns {{r: number, g: number, b: number}} Adjusted foreground color
   */
  DarkColorUtils.ensureContrast = function (fg, bg, minRatio) {
    if (!fg || !bg) return fg || { r: 255, g: 255, b: 255 };

    let currentRatio = DarkColorUtils.contrastRatio(fg, bg);
    if (currentRatio >= minRatio) return fg;

    // Adjust brightness to improve contrast
    const fgLum = DarkColorUtils.getRelativeLuminance(fg);
    const bgLum = DarkColorUtils.getRelativeLuminance(bg);

    // If foreground is lighter than background, darken it; otherwise lighten it
    const shouldDarken = fgLum > bgLum;

    let adjusted = { ...fg };
    const maxIterations = 20;
    let iterations = 0;

    while (currentRatio < minRatio && iterations < maxIterations) {
      if (shouldDarken) {
        adjusted.r = Math.max(0, adjusted.r - 10);
        adjusted.g = Math.max(0, adjusted.g - 10);
        adjusted.b = Math.max(0, adjusted.b - 10);
      } else {
        adjusted.r = Math.min(255, adjusted.r + 10);
        adjusted.g = Math.min(255, adjusted.g + 10);
        adjusted.b = Math.min(255, adjusted.b + 10);
      }

      currentRatio = DarkColorUtils.contrastRatio(adjusted, bg);
      iterations++;
    }

    return adjusted;
  };

  /**
   * Calculate an "opposite" dark-appropriate color for a light color
   * @param {{r: number, g: number, b: number}} rgb - Light RGB color
   * @param {Object} options - Configuration options
   * @param {{r: number, g: number, b: number}} options.darkBackgroundRgb - Target dark background
   * @param {string} options.mode - "background" or "text"
   * @returns {{r: number, g: number, b: number}} Transformed color
   */
  DarkColorUtils.calculateOppositeForLightColor = function (rgb, options) {
    if (!rgb) return { r: 18, g: 18, b: 18 };

    const darkBg = options?.darkBackgroundRgb || { r: 18, g: 18, b: 18 };
    const mode = options?.mode || "background";

    // Start with inverted color
    let opposite = DarkColorUtils.invertRgb(rgb);

    if (mode === "background") {
      // For backgrounds, clamp to dark range (brightness 10-80)
      const brightness = DarkColorUtils.getBrightness(opposite);
      if (brightness > 80) {
        // Scale down to dark range
        const scale = 80 / brightness;
        opposite = {
          r: Math.max(0, Math.min(80, opposite.r * scale)),
          g: Math.max(0, Math.min(80, opposite.g * scale)),
          b: Math.max(0, Math.min(80, opposite.b * scale))
        };
      } else if (brightness < 10) {
        // Ensure minimum visibility
        opposite = {
          r: Math.max(10, opposite.r),
          g: Math.max(10, opposite.g),
          b: Math.max(10, opposite.b)
        };
      }
    } else if (mode === "text") {
      // For text, ensure it's light enough (brightness 200-255) and has good contrast
      const brightness = DarkColorUtils.getBrightness(opposite);
      if (brightness < 200) {
        // Scale up to light range
        const scale = brightness > 0 ? 200 / brightness : 1;
        opposite = {
          r: Math.min(255, Math.max(200, opposite.r * scale)),
          g: Math.min(255, Math.max(200, opposite.g * scale)),
          b: Math.min(255, Math.max(200, opposite.b * scale))
        };
      }

      // Ensure contrast with dark background
      opposite = DarkColorUtils.ensureContrast(opposite, darkBg, 4.5);
    }

    return opposite;
  };

  // Expose to global scope
  window.DarkColorUtils = DarkColorUtils;
})();

