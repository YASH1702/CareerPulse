// LinkedIn Easy Apply & Sourcing Content Script
console.log("[JobPilot AI] LinkedIn Co-Pilot injected.");

// Message listener from popup
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.action === "SCRAPE_JOBS") {
    const jobElements = document.querySelectorAll(".job-card-container, .jobs-search-results__list-item");
    const foundJobs = [];

    jobElements.forEach((el) => {
      const titleEl = el.querySelector(".job-card-list__title, .artdeco-entity-lockup__title");
      const companyEl = el.querySelector(".job-card-container__primary-description, .artdeco-entity-lockup__subtitle");
      if (titleEl && companyEl) {
        foundJobs.push({
          title: titleEl.innerText.trim(),
          company: companyEl.innerText.trim(),
        });
      }
    });

    sendResponse({ count: foundJobs.length, jobs: foundJobs });
  }
});

// Auto-fill observer for LinkedIn Easy Apply modal
function observeEasyApplyModal() {
  const modal = document.querySelector(".jobs-easy-apply-modal, .artdeco-modal");
  if (!modal) return;

  chrome.storage.local.get(["autoFillEnabled"], (res) => {
    if (res.autoFillEnabled === false) return;

    // 1. Fill Text Inputs with standard defaults if empty
    modal.querySelectorAll("input[type='text'], input[type='tel']").forEach((input) => {
      const label = (input.getAttribute("aria-label") || input.name || "").toLowerCase();
      if (!input.value) {
        if (label.includes("phone")) input.value = "+91 9876543210";
        if (label.includes("experience") || label.includes("years")) input.value = "4";
        if (label.includes("ctc") || label.includes("salary")) input.value = "2400000";
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });

    // 2. Select Yes on common radios
    modal.querySelectorAll("fieldset").forEach((fieldset) => {
      const legend = (fieldset.querySelector("legend")?.innerText || "").toLowerCase();
      if (legend.includes("authorized") || legend.includes("sponsorship") === false) {
        const yesRadio = fieldset.querySelector("input[value='Yes'], input[value='yes'], input[id*='yes']");
        if (yesRadio && !yesRadio.checked) {
          yesRadio.click();
        }
      }
    });
  });
}

// Observe DOM mutations
const observer = new MutationObserver(() => {
  observeEasyApplyModal();
});
observer.observe(document.body, { childList: true, subtree: true });