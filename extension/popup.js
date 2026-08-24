document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("auto-fill-toggle");
  const scrapeBtn = document.getElementById("scrape-page-btn");
  const dashboardBtn = document.getElementById("open-dashboard-btn");

  // Load toggle state
  chrome.storage.local.get(["autoFillEnabled"], (res) => {
    if (res.autoFillEnabled !== undefined) {
      toggle.checked = res.autoFillEnabled;
    }
  });

  toggle.addEventListener("change", () => {
    chrome.storage.local.set({ autoFillEnabled: toggle.checked });
  });

  dashboardBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: "http://localhost:3000/auto-apply" });
  });

  scrapeBtn.addEventListener("click", async () => {
    scrapeBtn.innerText = "⏳ Scraping Page...";
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, { action: "SCRAPE_JOBS" }, (response) => {
        if (response && response.count) {
          scrapeBtn.innerText = `✅ Found ${response.count} Jobs!`;
        } else {
          scrapeBtn.innerText = "No job cards detected on page";
        }
        setTimeout(() => { scrapeBtn.innerText = "📥 Scrape Jobs on Current Page"; }, 2500);
      });
    }
  });
});