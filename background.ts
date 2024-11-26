let INACTIVITY_THRESHOLD = 5 * 60 * 1000; // Default to 5 minutes in milliseconds
let ignoredUrls: string[] = []; // List of ignored URLs


// On start
chrome.runtime.onInstalled.addListener(() => {
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
            tabActivity[tab.id!] = Date.now();
        });
    })
});

// Load settings on startup
chrome.storage.sync.get(["inactivityThreshold", "ignoredUrls"], (result) => {
    if (result.inactivityThreshold) {
        INACTIVITY_THRESHOLD = result.inactivityThreshold * 60 * 1000;
    }
    if (result.ignoredUrls) {
        ignoredUrls = result.ignoredUrls;
    }
});

// Listen for changes to settings
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync") {
        if (changes.inactivityThreshold) {
            INACTIVITY_THRESHOLD = changes.inactivityThreshold.newValue * 60 * 1000;
        }
        if (changes.ignoredUrls) {
            ignoredUrls = changes.ignoredUrls.newValue || [];
        }
    }
});

const tabActivity: Record<number, number> = {};

// Track when a tab is activated
chrome.tabs.onActivated.addListener((activeInfo: chrome.tabs.TabActiveInfo) => {
    const tabId = activeInfo.tabId;
    tabActivity[tabId] = Date.now(); // Save the timestamp when the tab is activated
});

// Track when a tab is updated
chrome.tabs.onUpdated.addListener((tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
    if (changeInfo.status === "complete") {
        tabActivity[tabId] = Date.now(); // Update the timestamp when the tab is updated
    }
});

// Send data to popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "GET_TAB_DATA") {
        chrome.tabs.query({}, (tabs) => {
            const tabData = tabs.map((tab) => ({
                id: tab.id!,
                title: tab.title || "Untitled Tab",
                url: tab.url || "No URL",
                lastActive: tabActivity[tab.id!] || Date.now(), // Use current time if no activity is tracked
                isIgnored: ignoredUrls.some((ignoredUrl) => tab.url!.startsWith(ignoredUrl)),
            }));
            sendResponse({ tabs: tabData, threshold: INACTIVITY_THRESHOLD });
        });
        return true;
    }
});

// Periodically check for inactive tabs and close them
setInterval(() => {
    const now = Date.now();

    chrome.tabs.query({}, (tabs: chrome.tabs.Tab[]) => {
        tabs.forEach((tab) => {
            if (!tab.id || !tab.url) return;

            const lastActive = tabActivity[tab.id] || now;
            const inactiveTime = now - lastActive;

            // Skip ignored URLs
            if (ignoredUrls.some((ignoredUrl) => tab.url!.startsWith(ignoredUrl))) {
                console.log(`Tab ${tab.id} is ignored: ${tab.url}`);
                // Update the last active time to prevent closing the tab
                tabActivity[tab.id] = now;
                return;
            }


            if (
                inactiveTime > INACTIVITY_THRESHOLD &&
                !tab.pinned &&
                !tab.active
            ) {
                console.log(`Closing tab ${tab.id} due to inactivity.`);
                chrome.tabs.remove(tab.id, () => {
                    if (chrome.runtime.lastError) {
                        console.error(`Error closing tab ${tab.id}:`, chrome.runtime.lastError);
                    }
                });
                delete tabActivity[tab.id];
            }
            if (tab.active) {
                tabActivity[tab.id] = now;
            }
        });
    });
}, 1000); // Check every minute
