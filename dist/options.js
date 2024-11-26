"use strict";
const thresholdInput = document.getElementById("inactivity-threshold");
const ignoredUrlInput = document.getElementById("ignored-url");
const addUrlButton = document.getElementById("add-url");
const ignoredList = document.getElementById("ignored-list");
const saveButton = document.getElementById("save-settings");
const statusMessage = document.getElementById("status-message");
// Load settings on page load
chrome.storage.sync.get(["inactivityThreshold", "ignoredUrls"], (result) => {
    if (result.inactivityThreshold) {
        thresholdInput.value = result.inactivityThreshold.toString();
    }
    if (result.ignoredUrls) {
        result.ignoredUrls.forEach((url) => addIgnoredUrlToList(url));
    }
});
// Save settings
saveButton.addEventListener("click", () => {
    const threshold = parseInt(thresholdInput.value, 10);
    if (isNaN(threshold) || threshold <= 0) {
        statusMessage.textContent = "Please enter a valid threshold.";
        return;
    }
    // Save threshold and ignored URLs
    const urls = Array.from(ignoredList.children).map((li) => { var _a; return ((_a = li.firstChild) === null || _a === void 0 ? void 0 : _a.textContent) || ""; });
    chrome.storage.sync.set({ inactivityThreshold: threshold, ignoredUrls: urls }, () => {
        statusMessage.textContent = "Settings saved!";
        setTimeout(() => (statusMessage.textContent = ""), 2000);
    });
});
// Add URL to ignore list
addUrlButton.addEventListener("click", () => {
    const url = ignoredUrlInput.value.trim();
    if (url && !Array.from(ignoredList.children).some((li) => li.textContent === url)) {
        addIgnoredUrlToList(url);
        ignoredUrlInput.value = "";
    }
});
// Add a URL to the displayed list
function addIgnoredUrlToList(url) {
    const li = document.createElement("li");
    li.textContent = url;
    // Add a remove button
    const removeButton = document.createElement("button");
    removeButton.textContent = "Remove";
    removeButton.style.marginLeft = "10px";
    removeButton.addEventListener("click", () => {
        ignoredList.removeChild(li);
    });
    li.appendChild(removeButton);
    ignoredList.appendChild(li);
}
