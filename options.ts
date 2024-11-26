const thresholdInput = document.getElementById("inactivity-threshold") as HTMLInputElement;
const ignoredUrlInput = document.getElementById("ignored-url") as HTMLInputElement;
const addUrlButton = document.getElementById("add-url") as HTMLButtonElement;
const ignoredList = document.getElementById("ignored-list") as HTMLUListElement;
const saveButton = document.getElementById("save-settings") as HTMLButtonElement;
const statusMessage = document.getElementById("status-message") as HTMLParagraphElement;

// Load settings on page load
chrome.storage.sync.get(["inactivityThreshold", "ignoredUrls"], (result) => {
    if (result.inactivityThreshold) {
        thresholdInput.value = result.inactivityThreshold.toString();
    }

    if (result.ignoredUrls) {
        result.ignoredUrls.forEach((url: string) => addIgnoredUrlToList(url));
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
    const urls = Array.from(ignoredList.children).map((li) => li.firstChild?.textContent || "");
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
function addIgnoredUrlToList(url: string) {
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
