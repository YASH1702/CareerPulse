/**
 * JobPilot AI - Universal Form Auto-Filler Engine
 * Form-Header Docked Banner + Top-Right Floating Copilot for LinkedIn, Greenhouse, Lever, Workday, etc.
 */

(function () {
  console.log("[JobPilot AI] Universal Auto-Apply Copilot Initialized.");

  let cachedCandidate = null;

  // Listen for messages from popup or background service worker
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "AUTOFILL_JOB_FORM") {
      const candidate = request.candidate;
      if (!candidate) {
        sendResponse({ success: false, error: "No candidate data provided" });
        return;
      }
      cachedCandidate = candidate;
      const result = executeUniversalAutofill(candidate);
      sendResponse(result);
    }
    return true;
  });

  // Get candidate data from storage or background
  async function getCandidateData() {
    if (cachedCandidate) return cachedCandidate;
    try {
      const data = await chrome.storage.local.get("jobpilot_candidate");
      if (data.jobpilot_candidate) {
        cachedCandidate = data.jobpilot_candidate;
        return cachedCandidate;
      }
    } catch (e) {
      console.warn("[JobPilot Storage Read Error]:", e);
    }
    return null;
  }

  // 1. Inject Inline Banner directly ABOVE the form / inside modal header
  function injectFormHeaderBanner() {
    // Look for form or modal containers
    const targets = [
      document.querySelector(".jobs-easy-apply-modal .artdeco-modal__header"),
      document.querySelector(".jobs-easy-apply-modal form"),
      document.querySelector(".jobs-easy-apply-content"),
      document.querySelector("[data-test-modal] form"),
      document.querySelector("[role='dialog'] form"),
      document.querySelector("form#application_form"),
      document.querySelector("form#application-form"),
      document.querySelector("form.application-form"),
      document.querySelector("#app_form"),
      document.querySelector("form[action*='apply']"),
      document.querySelector("[data-automation-id='workday-application']"),
      document.querySelector("form"),
    ].filter(Boolean);

    if (targets.length === 0) return;

    // Pick the most relevant container (prioritize modal headers & active application forms)
    const container = targets[0];

    // Avoid duplicate injection
    if (container.querySelector(".jobpilot-inline-banner") || document.getElementById("jobpilot-inline-banner")) {
      return;
    }

    const banner = document.createElement("div");
    banner.id = "jobpilot-inline-banner";
    banner.className = "jobpilot-inline-banner";
    banner.innerHTML = `
      <div class="jp-banner-left">
        <span class="jp-banner-logo">⚡</span>
        <div class="jp-banner-text">
          <strong class="jp-banner-title">JobPilot AI Copilot</strong>
          <span class="jp-banner-desc">Ready to 1-Click Auto-Fill with your profile</span>
        </div>
      </div>
      <button type="button" class="jp-banner-btn" id="jp-banner-autofill-btn">
        <span>⚡ 1-Click Auto-Fill Form</span>
      </button>
    `;

    // Add click handler
    const btn = banner.querySelector("#jp-banner-autofill-btn");
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.disabled = true;
      btn.innerHTML = "<span>⏳ Filling Fields...</span>";

      const candidate = await getCandidateData();
      if (candidate) {
        const res = executeUniversalAutofill(candidate);
        showToast(`🎉 JobPilot filled ${res.filledCount} fields on this step!`);
        btn.innerHTML = `<span>✅ Filled (${res.filledCount} Fields)</span>`;
      } else {
        showToast("⚠️ Please open JobPilot extension popup to connect your profile.");
        btn.innerHTML = "<span>⚡ 1-Click Auto-Fill Form</span>";
      }

      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = "<span>⚡ 1-Click Auto-Fill Form</span>";
      }, 2500);
    });

    // Insert at the top of the container
    if (container.firstChild) {
      container.insertBefore(banner, container.firstChild);
    } else {
      container.appendChild(banner);
    }
  }

  // 2. Inject Top-Right Floating Copilot Button
  function injectFloatingWidget() {
    if (document.getElementById("jobpilot-floating-copilot")) return;

    const isJobPage =
      window.location.hostname.includes("linkedin.com") ||
      window.location.hostname.includes("greenhouse.io") ||
      window.location.hostname.includes("lever.co") ||
      window.location.hostname.includes("workday") ||
      window.location.hostname.includes("indeed.com") ||
      window.location.hostname.includes("wellfound.com") ||
      window.location.hostname.includes("ashbyhq.com") ||
      window.location.hostname.includes("smartrecruiters.com") ||
      document.querySelector("form, [role='dialog'], .jobs-easy-apply-modal, input[type='file']");

    if (!isJobPage) return;

    const widget = document.createElement("div");
    widget.id = "jobpilot-floating-copilot";
    widget.innerHTML = `
      <div class="jp-pill-btn" title="Click to 1-Click Auto-Fill with JobPilot AI">
        <span class="jp-pill-icon">⚡</span>
        <span class="jp-pill-text">Auto-Fill (JobPilot)</span>
      </div>
    `;

    widget.addEventListener("click", async () => {
      const candidate = await getCandidateData();
      if (candidate) {
        const res = executeUniversalAutofill(candidate);
        showToast(`🎉 JobPilot filled ${res.filledCount} fields!`);
      } else {
        showToast("⚠️ Please open JobPilot extension popup to connect your profile.");
      }
    });

    document.body.appendChild(widget);
  }

  // Set Value with Full React / Framework Dispatch Events
  function setNativeValue(element, value) {
    if (!element || value === undefined || value === null) return false;

    try {
      const tagName = element.tagName.toLowerCase();

      if (tagName === "select") {
        const valStr = String(value).toLowerCase();
        let matched = false;

        for (let i = 0; i < element.options.length; i++) {
          const opt = element.options[i];
          const optText = opt.text.toLowerCase();
          const optVal = opt.value.toLowerCase();

          if (
            optText === valStr ||
            optVal === valStr ||
            optText.includes(valStr) ||
            (valStr === "yes" && (optText === "yes" || optVal === "true" || optText.includes("authorized"))) ||
            (valStr === "no" && (optText === "no" || optVal === "false" || optText.includes("not required")))
          ) {
            element.selectedIndex = i;
            matched = true;
            break;
          }
        }
        if (matched) {
          element.dispatchEvent(new Event("change", { bubbles: true }));
          highlightElement(element);
          return true;
        }
        return false;
      }

      if (element.type === "radio" || element.type === "checkbox") {
        if (!element.checked) {
          element.checked = true;
          element.dispatchEvent(new Event("change", { bubbles: true }));
          element.dispatchEvent(new Event("click", { bubbles: true }));
          highlightElement(element);
          return true;
        }
        return false;
      }

      // Input / Textarea
      const prototype = Object.getPrototypeOf(element);
      const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;

      if (prototypeValueSetter) {
        prototypeValueSetter.call(element, value);
      } else {
        element.value = value;
      }

      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
      element.dispatchEvent(new Event("blur", { bubbles: true }));

      highlightElement(element);
      return true;
    } catch (e) {
      console.warn("[JobPilot AutoFill Field Warning]:", e);
      return false;
    }
  }

  function highlightElement(el) {
    el.classList.add("jobpilot-highlighted-field");
    setTimeout(() => el.classList.remove("jobpilot-highlighted-field"), 3000);
  }

  function showToast(msg) {
    let toast = document.getElementById("jobpilot-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "jobpilot-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className = "jobpilot-toast-show";
    setTimeout(() => {
      toast.className = "";
    }, 4000);
  }

  // Universal Autofill Engine
  function executeUniversalAutofill(candidate) {
    let filledCount = 0;
    const hostname = window.location.hostname;
    let platform = "Standard Job Form";

    if (hostname.includes("linkedin.com")) platform = "LinkedIn Easy Apply";
    else if (hostname.includes("greenhouse.io")) platform = "Greenhouse ATS";
    else if (hostname.includes("lever.co")) platform = "Lever ATS";
    else if (hostname.includes("workday")) platform = "Workday";
    else if (hostname.includes("indeed.com")) platform = "Indeed";

    // 1. Scan all input, select, and textarea elements
    const inputs = Array.from(document.querySelectorAll("input:not([type='hidden']):not([type='submit']), select, textarea"));

    inputs.forEach((input) => {
      // Skip if already filled
      if (input.type !== "radio" && input.type !== "checkbox" && input.value && input.value.trim().length > 0) {
        return;
      }

      // Gather contextual labels and descriptors
      const id = (input.id || "").toLowerCase();
      const name = (input.name || "").toLowerCase();
      const placeholder = (input.placeholder || "").toLowerCase();
      const ariaLabel = (input.getAttribute("aria-label") || "").toLowerCase();
      const autocomplete = (input.autocomplete || "").toLowerCase();

      // Find nearest label or legend text
      let labelText = "";
      if (input.labels && input.labels.length > 0) {
        labelText = Array.from(input.labels).map((l) => l.innerText).join(" ").toLowerCase();
      }
      if (!labelText) {
        const parentLabel = input.closest("label, .fb-dash-form-element, .jobs-easy-apply-form-section__grouping, .application-question, .field, [class*='form-group']");
        if (parentLabel) {
          labelText = parentLabel.innerText.toLowerCase();
        }
      }

      const descriptor = `${id} ${name} ${placeholder} ${ariaLabel} ${autocomplete} ${labelText}`.trim();

      // ─── First Name ──────────────────────────────────────────
      if (
        (descriptor.includes("first") && (descriptor.includes("name") || descriptor.includes("given"))) ||
        descriptor.includes("fname") ||
        autocomplete === "given-name"
      ) {
        if (setNativeValue(input, candidate.firstName)) filledCount++;
        return;
      }

      // ─── Last Name ───────────────────────────────────────────
      if (
        (descriptor.includes("last") && (descriptor.includes("name") || descriptor.includes("family") || descriptor.includes("surname"))) ||
        descriptor.includes("lname") ||
        autocomplete === "family-name"
      ) {
        if (setNativeValue(input, candidate.lastName)) filledCount++;
        return;
      }

      // ─── Full Name ───────────────────────────────────────────
      if (
        (descriptor.includes("full") && descriptor.includes("name")) ||
        (descriptor.includes("name") && !descriptor.includes("company") && !descriptor.includes("user") && !descriptor.includes("file") && !descriptor.includes("first") && !descriptor.includes("last")) ||
        autocomplete === "name"
      ) {
        if (setNativeValue(input, candidate.fullName)) filledCount++;
        return;
      }

      // ─── Email ───────────────────────────────────────────────
      if (
        descriptor.includes("email") ||
        input.type === "email" ||
        autocomplete === "email"
      ) {
        if (setNativeValue(input, candidate.email)) filledCount++;
        return;
      }

      // ─── Phone / Mobile ──────────────────────────────────────
      if (
        descriptor.includes("phone") ||
        descriptor.includes("mobile") ||
        descriptor.includes("contact number") ||
        descriptor.includes("tel") ||
        input.type === "tel" ||
        autocomplete === "tel"
      ) {
        if (descriptor.includes("country code") || descriptor.includes("dial code")) {
          if (setNativeValue(input, "India (+91)")) filledCount++;
        } else {
          const val = descriptor.includes("+") ? candidate.phoneFormatted : candidate.phone;
          if (setNativeValue(input, val)) filledCount++;
        }
        return;
      }

      // ─── LinkedIn URL ────────────────────────────────────────
      if (
        descriptor.includes("linkedin") ||
        descriptor.includes("linkedin url") ||
        descriptor.includes("linkedin profile")
      ) {
        if (setNativeValue(input, candidate.links.linkedin)) filledCount++;
        return;
      }

      // ─── GitHub URL ──────────────────────────────────────────
      if (
        descriptor.includes("github") ||
        descriptor.includes("git") ||
        descriptor.includes("github url") ||
        descriptor.includes("github profile")
      ) {
        if (setNativeValue(input, candidate.links.github)) filledCount++;
        return;
      }

      // ─── Portfolio / Website URL ─────────────────────────────
      if (
        descriptor.includes("portfolio") ||
        descriptor.includes("website") ||
        descriptor.includes("personal site") ||
        descriptor.includes("blog")
      ) {
        if (setNativeValue(input, candidate.links.portfolio)) filledCount++;
        return;
      }

      // ─── City ────────────────────────────────────────────────
      if (
        descriptor.includes("city") ||
        descriptor.includes("current city") ||
        autocomplete === "address-level2"
      ) {
        if (setNativeValue(input, candidate.address.city)) filledCount++;
        return;
      }

      // ─── State / Province ────────────────────────────────────
      if (
        descriptor.includes("state") ||
        descriptor.includes("province") ||
        autocomplete === "address-level1"
      ) {
        if (setNativeValue(input, candidate.address.state)) filledCount++;
        return;
      }

      // ─── Country ─────────────────────────────────────────────
      if (
        descriptor.includes("country") ||
        autocomplete === "country-name"
      ) {
        if (setNativeValue(input, "India")) filledCount++;
        return;
      }

      // ─── Location / Address Line ─────────────────────────────
      if (
        (descriptor.includes("location") || descriptor.includes("address")) &&
        !descriptor.includes("email")
      ) {
        if (setNativeValue(input, candidate.location)) filledCount++;
        return;
      }

      // ─── Current Job Title / Role ────────────────────────────
      if (
        descriptor.includes("headline") ||
        descriptor.includes("current role") ||
        descriptor.includes("current title") ||
        descriptor.includes("job title")
      ) {
        if (setNativeValue(input, candidate.currentRole)) filledCount++;
        return;
      }

      // ─── Notice Period / Availability ────────────────────────
      if (
        descriptor.includes("notice period") ||
        descriptor.includes("how soon can you join") ||
        descriptor.includes("availability") ||
        descriptor.includes("earliest start date")
      ) {
        if (input.tagName.toLowerCase() === "select") {
          if (setNativeValue(input, "30 days") || setNativeValue(input, "Immediate")) filledCount++;
        } else if (input.type === "number") {
          if (setNativeValue(input, candidate.screeningAnswers.noticePeriodDays)) filledCount++;
        } else {
          if (setNativeValue(input, candidate.screeningAnswers.noticePeriod)) filledCount++;
        }
        return;
      }

      // ─── Expected Salary / CTC ───────────────────────────────
      if (
        descriptor.includes("expected salary") ||
        descriptor.includes("desired salary") ||
        descriptor.includes("expected ctc") ||
        descriptor.includes("compensation")
      ) {
        const val = descriptor.includes("lpa")
          ? candidate.screeningAnswers.expectedSalaryLPA
          : candidate.screeningAnswers.expectedSalaryAnnual;
        if (setNativeValue(input, val)) filledCount++;
        return;
      }

      // ─── Total Years of Experience ───────────────────────────
      if (
        (descriptor.includes("years") && descriptor.includes("experience") && !descriptor.includes("react") && !descriptor.includes("node") && !descriptor.includes("typescript")) ||
        descriptor.includes("total experience")
      ) {
        if (setNativeValue(input, candidate.yearsExperience)) filledCount++;
        return;
      }

      // ─── Skill-Specific Years of Experience (LinkedIn Easy Apply Questions) ────
      if (candidate.skillsMap) {
        for (const [skillName, years] of Object.entries(candidate.skillsMap)) {
          if (descriptor.includes(skillName) && (descriptor.includes("years") || descriptor.includes("experience") || input.type === "number")) {
            if (setNativeValue(input, years)) {
              filledCount++;
              return;
            }
          }
        }
      }

      // ─── Legal / Work Authorization (Yes/No Radios & Dropdowns) ────────────────
      if (
        descriptor.includes("authorized to work") ||
        descriptor.includes("legally authorized") ||
        descriptor.includes("work permit") ||
        descriptor.includes("eligible to work")
      ) {
        if (input.type === "radio") {
          if (labelText.includes("yes") || descriptor.includes("yes")) {
            if (setNativeValue(input, true)) filledCount++;
          }
        } else if (input.tagName.toLowerCase() === "select") {
          if (setNativeValue(input, "Yes")) filledCount++;
        }
        return;
      }

      // ─── Visa Sponsorship (Yes/No Radios & Dropdowns) ──────────────────────────
      if (
        descriptor.includes("sponsorship") ||
        descriptor.includes("visa sponsorship") ||
        descriptor.includes("require sponsorship")
      ) {
        if (input.type === "radio") {
          if (labelText.includes("no") || descriptor.includes("no") || descriptor.includes("not require")) {
            if (setNativeValue(input, true)) filledCount++;
          }
        } else if (input.tagName.toLowerCase() === "select") {
          if (setNativeValue(input, "No")) filledCount++;
        }
        return;
      }

      // ─── Willing to Relocate ──────────────────────────────────────────────────
      if (descriptor.includes("relocate") || descriptor.includes("willing to relocate")) {
        if (input.type === "radio" && (labelText.includes("yes") || descriptor.includes("yes"))) {
          if (setNativeValue(input, true)) filledCount++;
        } else if (input.tagName.toLowerCase() === "select") {
          if (setNativeValue(input, "Yes")) filledCount++;
        }
        return;
      }

      // ─── Degree / Education ───────────────────────────────────────────────────
      if (descriptor.includes("degree") || descriptor.includes("education level")) {
        const degreeVal = candidate.education[0]?.degree || "Master of Science (M.Sc IT)";
        if (setNativeValue(input, degreeVal)) filledCount++;
        return;
      }

      if (descriptor.includes("college") || descriptor.includes("university") || descriptor.includes("school")) {
        const schoolVal = candidate.education[0]?.institution || "Master of Science in IT";
        if (setNativeValue(input, schoolVal)) filledCount++;
        return;
      }

      if (descriptor.includes("graduation year") || descriptor.includes("year of completion")) {
        const gradYear = candidate.education[0]?.endYear || 2024;
        if (setNativeValue(input, gradYear)) filledCount++;
        return;
      }
    });

    return {
      success: true,
      filledCount,
      platform,
    };
  }

  // Auto-Runner
  function setupObservers() {
    injectFormHeaderBanner();
    injectFloatingWidget();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupObservers);
  } else {
    setupObservers();
  }

  // Observe dynamic form/modal appearance (LinkedIn Easy Apply modal opening, next step clicks)
  const observer = new MutationObserver(() => {
    injectFormHeaderBanner();
    injectFloatingWidget();
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();