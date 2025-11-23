const STORAGE_KEY = "darkModeTabs";

async function getTabState(tabId) {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const tabs = result[STORAGE_KEY] || {};
  return tabs[tabId] || false;
}

async function setTabState(tabId, enabled) {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const tabs = result[STORAGE_KEY] || {};
  if (enabled) {
    tabs[tabId] = true;
  } else {
    delete tabs[tabId];
  }
  await chrome.storage.local.set({ [STORAGE_KEY]: tabs });
}

async function injectDarkMode(tabId) {
  try {
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ["src/content/darkTheme.css"]
    });

    await chrome.scripting.executeScript({
      target: { tabId },
      files: [
        "src/content/colorUtils.js",
        "src/content/contentScript.js"
      ]
    });
  } catch (error) {
    console.error("Failed to inject dark mode scripts:", error);
  }
}

async function disableDarkMode(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, { action: "disable" });
  } catch (error) {
    console.debug("Failed to send disable message:", error);
  }
}

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !tab.url) {
    return;
  }

  const isEnabled = await getTabState(tab.id);

  if (isEnabled) {
    await setTabState(tab.id, false);
    await disableDarkMode(tab.id);
  } else {
    await setTabState(tab.id, true);
    await injectDarkMode(tab.id);
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    const isEnabled = await getTabState(tabId);
    if (isEnabled) {
      await injectDarkMode(tabId);
    }
  }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  await setTabState(tabId, false);
});

