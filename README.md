# Dark Theme Enforcer

A Chrome Manifest V3 browser extension that transforms light-themed web pages into dark mode with a single click. The extension intelligently analyzes page colors and applies dark-appropriate transformations while maintaining readability and visual hierarchy.

## Features

- 🎨 **One-Click Activation** - Transform any webpage to dark mode instantly via toolbar icon
- 🧠 **Intelligent Color Analysis** - Automatically detects light backgrounds and text colors
- 📊 **WCAG Compliant** - Ensures proper contrast ratios for accessibility
- 🖼️ **Media Safe** - Preserves images, videos, and media content (no inversion)
- ⚡ **Performance Optimized** - Processes elements in chunks to keep pages responsive
- 🌐 **Universal Compatibility** - Works across diverse websites without breaking layouts
- 🚀 **Zero Dependencies** - Pure JavaScript implementation, no build tools required

## Installation

### From Source (Unpacked Extension)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked**
5. Select the `dark-theme-enforcer` directory
6. The extension icon should now appear in your toolbar

## Usage

1. Navigate to any website with a light theme
2. Click the extension icon in your Chrome toolbar
3. The page will automatically transform to dark mode
4. The transformation is applied once per page load (prevents double-application)

## How It Works

### Architecture

The extension consists of four main components:

1. **Background Service Worker** (`src/background.js`)
   - Listens for toolbar icon clicks
   - Injects CSS and scripts into the active tab

2. **Color Utilities** (`src/content/colorUtils.js`)
   - Parses and converts color formats (RGB, hex, named colors)
   - Calculates brightness, luminance, and contrast ratios
   - Transforms light colors to dark-appropriate alternatives

3. **Content Script** (`src/content/contentScript.js`)
   - Analyzes DOM elements for color properties
   - Identifies light-themed elements
   - Applies dark mode transformations
   - Ensures WCAG contrast compliance

4. **Base Dark Theme CSS** (`src/content/darkTheme.css`)
   - Provides foundational dark theme styles
   - Sets default dark backgrounds and light text
   - Styles common elements (links, forms, tables, etc.)

### Color Transformation Logic

The extension uses advanced color algorithms:

- **Perceived Brightness**: Calculates using the formula `(r * 299 + g * 587 + b * 114) / 1000`
- **Relative Luminance**: WCAG-compliant calculation for contrast ratios
- **Contrast Ratio**: Ensures text meets WCAG 2.1 AA standards (minimum 4.5:1)
- **Smart Inversion**: Transforms light colors to dark-appropriate alternatives while maintaining visual relationships

### Performance

- Processes up to 3,000 elements per page
- Uses chunked processing (50 elements per chunk)
- Leverages `requestIdleCallback` when available for non-blocking execution
- Skips non-visual and media elements for efficiency

## Project Structure

```plaintext
dark-theme-enforcer/
├── manifest.json              # Extension manifest (Manifest V3)
├── src/
│   ├── background.js          # Service worker for icon click handling
│   └── content/
│       ├── colorUtils.js      # Color parsing and transformation utilities
│       ├── contentScript.js   # Main dark mode transformation logic
│       └── darkTheme.css      # Base dark theme stylesheet
├── icons/
│   ├── icon16.png            # Extension icon (16x16)
│   ├── icon48.png            # Extension icon (48x48)
│   └── icon128.png           # Extension icon (128x128)
└── README.md                  # This file
```

## Browser Compatibility

- ✅ Chrome (Manifest V3)
- ✅ Edge (Chromium-based)
- ✅ Other Chromium-based browsers

**Note**: This extension uses Manifest V3 APIs and is not compatible with Firefox or Safari without modifications.

## Technical Details

### Permissions

- `scripting` - Inject CSS and JavaScript into pages
- `activeTab` - Access the currently active tab
- `tabs` - Query tab information
- `host_permissions` - Access all HTTP/HTTPS websites

### Color Processing

The extension identifies "light" colors using a brightness threshold of 200 (out of 255). Elements with brightness above this threshold are considered part of a light theme and are transformed accordingly.

### Contrast Enforcement

Text colors are automatically adjusted to ensure:

- Minimum contrast ratio of 4.5:1 (WCAG AA standard)
- Readable brightness levels (200-255 for text on dark backgrounds)
- Visual consistency with the original design

## Limitations

- Transformation is applied once per page load (no toggle mechanism)
- Some dynamically loaded content may not be transformed
- Complex CSS frameworks may require additional styling
- Pages with heavy use of inline styles may need manual adjustments

## Development

### Requirements

- Chrome browser (for testing)
- No build tools or dependencies required

### Testing

1. Load the extension as an unpacked extension
2. Test on various websites with light themes
3. Verify contrast and readability
4. Check that images and media are not inverted

## License

This project is open source and available for use and modification.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Acknowledgments

Built with Chrome Extension APIs and WCAG accessibility guidelines.
# dark-theme-enforcer
