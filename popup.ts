interface TabData {
  id: number;
  title: string;
  url: string | undefined;
  lastActive: number;
  isIgnored: boolean;
}

const tabsContainer = document.getElementById("tabs-container") as HTMLDivElement;

chrome.runtime.sendMessage({ type: "GET_TAB_DATA" }, (response) => {
  if (chrome.runtime.lastError) {
    console.error("Error:", chrome.runtime.lastError.message);
  } else {
    // console.log("Received tab data:", response);
  }
});


chrome.runtime.sendMessage({ type: "GET_TAB_DATA" }, (response: { tabs: TabData[]; threshold: number }) => {
  if (chrome.runtime.lastError) {
    console.error("Error:", chrome.runtime.lastError.message);
    return;
  }

  if (response && response.tabs) {
    const { tabs, threshold } = response;
    const tabsContainer = document.getElementById("tabs-container") as HTMLDivElement;
    tabsContainer.innerHTML = ""; // Clear existing content

    tabs.forEach((tab) => {
      if (!tab.id || !tab.lastActive) return; // Skip invalid tabs

      // Calculate remaining time
      const timeLeft = Math.max(0, threshold - (Date.now() - tab.lastActive));
      const minutesLeft = Math.floor(timeLeft / 60000);
      const secondsLeft = Math.floor((timeLeft % 60000) / 1000);

      // Create a tab element
      const tabElement = document.createElement("div");
      tabElement.className = "tab";
      tabElement.innerHTML = `
        <div class="tab-title">${tab.title}</div>
        <div class="time-left" style="color: red;">Time left: ${isNaN(minutesLeft) || isNaN(secondsLeft)
          ? "Unknown"
          : `${minutesLeft}m ${secondsLeft}s ${tab.isIgnored ? "(Ignored)" : ""}`
        }</div>
      `;
      tabsContainer.appendChild(tabElement);
    });
  }
});

