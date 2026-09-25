// Naukri.com 1-Click Apply & Sourcing Content Script
console.log("[CareerPulse] Naukri Co-Pilot injected.");

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.action === "SCRAPE_JOBS") {
    const jobElements = document.querySelectorAll(".srp-jobtuple-wrapper, .cust-job-tuple");
    sendResponse({ count: jobElements.length });
  }
});