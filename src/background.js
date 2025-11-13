// Background service worker for dark theme extension
// Listens for toolbar icon clicks and injects CSS and scripts into the active tab

chrome.action.onClicked.addListener(async (tab) => {
  // Early return if tab is invalid
  if (!tab.id || !tab.url) {
    return;
  }

  try {
    // Inject base dark theme CSS
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ["src/content/darkTheme.css"]
    });

    // Inject color utilities first, then content script
    // Files execute in order, ensuring colorUtils is available before contentScript runs
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: [
        "src/content/colorUtils.js",
        "src/content/contentScript.js"
      ]
    });
  } catch (error) {
    console.error("Failed to inject dark mode scripts:", error);
  }
});

