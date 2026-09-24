/**
 * JobPilot AI - Universal Form Auto-Filler Engine
 * Form-Header Docked Banner + Top-Right Floating Copilot strictly restricted to Job Platforms and Career Portals.
 * Inactive / Hidden when JobPilot server is offline.
 */

(function () {
  let cachedCandidate = null;
  let isServerOnline = false;
  let lastServerCheck = 0;

  // 1. Check if JobPilot backend (localhost:3000) is online and reachable
  async function checkServerStatus() {
    const now = Date.now();
    // Cache liveness check for 10 seconds to avoid excessive network calls
    if (now - lastServerCheck < 10000 && isServerOnline && cachedCandidate) {
      return true;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);

      const res = await fetch("http://localhost:3000/api/extension/profile", {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.candidate) {
          cachedCandidate = data.candidate;
          isServerOnline = true;
          lastServerCheck = now;
          await chrome.storage.local.set({ jobpilot_candidate: data.candidate });
          return true;
        }
      }
    } catch (e) {
      // Server is offline / stopped
      isServerOnline = false;
      cachedCandidate = null;
    }

    isServerOnline = false;
    return false;
  }

  // 2. Strict Domain and Context Detector for Job Platforms
  function isJobApplicationContext() {
    const hostname = window.location.hostname.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();
    const fullUrl = window.location.href.toLowerCase();

    // Blacklist non-job sites completely
    const nonJobSites = [
      "youtube.com", "google.com", "facebook.com", "instagram.com",
      "twitter.com", "x.com", "reddit.com", "amazon.", "flipkart.com",
      "netflix.com", "github.com", "stackoverflow.com", "wikipedia.org",
      "medium.com", "gmail.com", "mail.google.com", "chatgpt.com",
      "openai.com", "claude.ai", "anthropic.com", "twitch.tv", "yahoo.com"
    ];
    if (nonJobSites.some((domain) => hostname.includes(domain))) {
      if (!pathname.includes("/careers") && !pathname.includes("/jobs")) {
        return false;
      }
    }

    // Specific Job Boards and ATS Platforms
    const jobDomains = [
      "linkedin.com",
      "greenhouse.io",
      "lever.co",
      "workday.com",
      "myworkdayjobs.com",
      "ashbyhq.com",
      "smartrecruiters.com",
      "indeed.com",
      "wellfound.com",
      "angel.co",
      "naukri.com",
      "foundit.in",
      "glassdoor.com",
      "glassdoor.co.in",
      "bamboohr.com",
      "icims.com",
      "workable.com",
      "jobvite.com",
      "rippling.com",
      "breezy.hr",
      "recruitee.com",
      "polymer.co",
      "pinpointhq.com",
      "join.com",
      "talent.com",
      "ziprecruiter.com",
      "cutshort.io",
      "instahyre.com",
      "hiring.cafe",
      "ycombinator.com/jobs",
      "remoteok.com",
      "weworkremotely.com"
    ];

    const matchesJobDomain = jobDomains.some((d) => hostname.includes(d) || fullUrl.includes(d));

    // For LinkedIn: Only activate on /jobs/ pages or when Easy Apply modal is present
    if (hostname.includes("linkedin.com")) {
      const isLinkedInJob =
        pathname.includes("/jobs") ||
        document.querySelector(".jobs-easy-apply-modal, [data-test-modal], .jobs-apply-button, [data-job-id]");
      return Boolean(isLinkedInJob);
    }

    // If on known ATS domain
    if (matchesJobDomain) {
      return true;
    }

    // Generic Company Career Portals
    const isCareerSubdomain =
      hostname.startsWith("careers.") ||
      hostname.startsWith("jobs.") ||
      hostname.startsWith("join.");
    const isCareerPath =
      pathname.includes("/careers") ||
      pathname.includes("/career") ||
      pathname.includes("/jobs") ||
      pathname.includes("/job/") ||
      pathname.includes("/apply") ||
      pathname.includes("/openings") ||
      pathname.includes("/positions");

    if (isCareerSubdomain || isCareerPath) {
      const hasJobForm = document.querySelector(
        "input[type='file'], form[action*='apply'], [class*='apply'], [class*='job'], [id*='apply'], [id*='job'], form[name*='apply']"
      );
      if (hasJobForm) return true;
    }

    return false;
  }

  // Helper to find tailored custom resume matching current web page
  function findMatchingCustomResume(candidate) {
    if (!candidate) return null;
    const customResumes = candidate.customResumes || [];
    const fullText = `${window.location.href} ${document.title}`.toLowerCase();

    for (const cr of customResumes) {
      const comp = (cr.companyName || "").toLowerCase().trim();
      const role = (cr.jobTitle || "").toLowerCase().trim();
      if (comp.length > 2 && fullText.includes(comp)) return cr;
      if (cr.jobUrl && window.location.href.includes(cr.jobUrl)) return cr;
      if (role.length > 4 && fullText.includes(role)) return cr;
    }
    return candidate.activeResume || candidate.masterResume || null;
  }

  // Listen for messages from popup or background service worker
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "AUTOFILL_JOB_FORM") {
      const candidate = request.candidate;
      if (!candidate) {
        sendResponse({ success: false, error: "No candidate data provided" });
        return;
      }
      cachedCandidate = candidate;
      const selectedResume = request.selectedResume || findMatchingCustomResume(candidate);
      const result = executeUniversalAutofill(candidate, selectedResume);
      sendResponse(result);
    }
    return true;
  });

  // 1. Inject Inline Banner directly ABOVE the form / inside modal header
  async function injectFormHeaderBanner() {
    if (!isJobApplicationContext()) {
      removeInjectedElements();
      return;
    }

    // Check if backend server is online
    const online = await checkServerStatus();
    if (!online) {
      removeInjectedElements();
      return;
    }

    // Look for form or modal containers
    const targets = [
      document.querySelector(".jobs-easy-apply-modal .artdeco-modal__header"),
      document.querySelector(".jobs-easy-apply-modal form"),
      document.querySelector(".jobs-easy-apply-content"),
      document.querySelector("[data-test-modal] form"),
      document.querySelector("form#application_form"),
      document.querySelector("form#application-form"),
      document.querySelector("form.application-form"),
      document.querySelector("#app_form"),
      document.querySelector("[data-automation-id='workday-application']"),
      document.querySelector("form[action*='apply']"),
      document.querySelector("form[class*='apply']"),
      document.querySelector("form[id*='apply']"),
      document.querySelector("form:has(input[type='file'])"),
    ].filter(Boolean);

    if (targets.length === 0) return;

    const container = targets[0];

    if (container.querySelector(".jobpilot-inline-banner") || document.getElementById("jobpilot-inline-banner")) {
      return;
    }

    const targetResume = findMatchingCustomResume(cachedCandidate);
    const isTailored = targetResume && (targetResume.resumeType === "TAILORED" || targetResume.id !== cachedCandidate?.masterResume?.id);
    const resumeLabel = targetResume
      ? (isTailored ? `✨ Tailored: ${targetResume.companyName || targetResume.jobTitle}` : `📄 ${targetResume.name.slice(0, 22)}`)
      : "Master Profile";

    const banner = document.createElement("div");
    banner.id = "jobpilot-inline-banner";
    banner.className = "jobpilot-inline-banner";
    banner.innerHTML = `
      <div class="jp-banner-left">
        <span class="jp-banner-logo">⚡</span>
        <div class="jp-banner-text">
          <strong class="jp-banner-title">JobPilot AI Copilot</strong>
          <span class="jp-banner-desc">Ready with ${resumeLabel}</span>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        ${targetResume?.id ? `<a href="http://localhost:3000/resumes/${targetResume.id}" target="_blank" class="jp-banner-pdf-link" title="Download and save 1-page ATS PDF for this resume">📄 Save ATS PDF ↗</a>` : ""}
        <button type="button" class="jp-banner-btn" id="jp-banner-autofill-btn">
          <span>⚡ 1-Click Auto-Fill</span>
        </button>
      </div>
    `;

    const btn = banner.querySelector("#jp-banner-autofill-btn");
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.disabled = true;
      btn.innerHTML = "<span>⏳ Filling Fields...</span>";

      if (cachedCandidate) {
        const resumeToUse = findMatchingCustomResume(cachedCandidate);
        const res = executeUniversalAutofill(cachedCandidate, resumeToUse);
        showToast(`🎉 JobPilot filled ${res.filledCount} fields using ${resumeToUse ? resumeToUse.name.slice(0, 22) : 'profile'}!`);
        btn.innerHTML = `<span>✅ Filled (${res.filledCount} Fields)</span>`;
      } else {
        showToast("⚠️ JobPilot server is offline. Please start localhost:3000.");
        btn.innerHTML = "<span>⚡ 1-Click Auto-Fill</span>";
      }

      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = "<span>⚡ 1-Click Auto-Fill</span>";
      }, 2500);
    });

    if (container.firstChild) {
      container.insertBefore(banner, container.firstChild);
    } else {
      container.appendChild(banner);
    }
  }

  // 2. Inject Top-Right Floating Copilot Button on Job Pages Only When Online
  async function injectFloatingWidget() {
    if (!isJobApplicationContext()) {
      removeInjectedElements();
      return;
    }

    const online = await checkServerStatus();
    if (!online) {
      removeInjectedElements();
      return;
    }

    if (document.getElementById("jobpilot-floating-copilot")) return;

    const widget = document.createElement("div");
    widget.id = "jobpilot-floating-copilot";
    widget.innerHTML = `
      <div class="jp-pill-btn" title="Click to 1-Click Auto-Fill with JobPilot AI">
        <span class="jp-pill-icon">⚡</span>
        <span class="jp-pill-text">Auto-Fill (JobPilot)</span>
      </div>
    `;

    widget.addEventListener("click", async () => {
      if (cachedCandidate) {
        const resumeToUse = findMatchingCustomResume(cachedCandidate);
        const res = executeUniversalAutofill(cachedCandidate, resumeToUse);
        const label = resumeToUse ? (resumeToUse.companyName || resumeToUse.name.slice(0, 20)) : "profile";
        showToast(`🎉 JobPilot filled ${res.filledCount} fields using ${label}!`);
      } else {
        showToast("⚠️ JobPilot server is offline. Please start localhost:3000.");
      }
    });

    document.body.appendChild(widget);
  }

  function removeInjectedElements() {
    const banner = document.getElementById("jobpilot-inline-banner");
    if (banner) banner.remove();
    const widget = document.getElementById("jobpilot-floating-copilot");
    if (widget) widget.remove();
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
  function executeUniversalAutofill(candidate, customResume) {
    let filledCount = 0;
    const hostname = window.location.hostname;
    let platform = "Standard Job Form";

    if (hostname.includes("linkedin.com")) platform = "LinkedIn Easy Apply";
    else if (hostname.includes("greenhouse.io")) platform = "Greenhouse ATS";
    else if (hostname.includes("lever.co")) platform = "Lever ATS";
    else if (hostname.includes("workday")) platform = "Workday";
    else if (hostname.includes("indeed.com")) platform = "Indeed";

    const activeResume = customResume || findMatchingCustomResume(candidate);
    const resumeSummary = activeResume?.summary || candidate.summary || candidate.bio || "";
    const resumeSkills = (activeResume?.skills && activeResume.skills.length > 0)
      ? activeResume.skills.join(", ")
      : (candidate.skills || []).join(", ");
    const resumeRole = activeResume?.jobTitle || activeResume?.targetRole || candidate.currentRole || candidate.headline;

    const inputs = Array.from(
      document.querySelectorAll("input:not([type='hidden']):not([type='submit']), select, textarea")
    );

    inputs.forEach((input) => {
      if (input.type !== "radio" && input.type !== "checkbox" && input.value && input.value.trim().length > 0) {
        return;
      }

      const id = (input.id || "").toLowerCase();
      const name = (input.name || "").toLowerCase();
      const placeholder = (input.placeholder || "").toLowerCase();
      const ariaLabel = (input.getAttribute("aria-label") || "").toLowerCase();
      const autocomplete = (input.autocomplete || "").toLowerCase();

      let labelText = "";
      if (input.labels && input.labels.length > 0) {
        labelText = Array.from(input.labels).map((l) => l.innerText).join(" ").toLowerCase();
      }
      if (!labelText) {
        const parentLabel = input.closest(
          "label, .fb-dash-form-element, .jobs-easy-apply-form-section__grouping, .application-question, .field, [class*='form-group']"
        );
        if (parentLabel) {
          labelText = parentLabel.innerText.toLowerCase();
        }
      }

      const descriptor = `${id} ${name} ${placeholder} ${ariaLabel} ${autocomplete} ${labelText}`.trim();

      // First Name
      if (
        (descriptor.includes("first") && (descriptor.includes("name") || descriptor.includes("given"))) ||
        descriptor.includes("fname") ||
        autocomplete === "given-name"
      ) {
        if (setNativeValue(input, candidate.firstName)) filledCount++;
        return;
      }

      // Last Name
      if (
        (descriptor.includes("last") && (descriptor.includes("name") || descriptor.includes("family") || descriptor.includes("surname"))) ||
        descriptor.includes("lname") ||
        autocomplete === "family-name"
      ) {
        if (setNativeValue(input, candidate.lastName)) filledCount++;
        return;
      }

      // Full Name
      if (
        (descriptor.includes("full") && descriptor.includes("name")) ||
        (descriptor.includes("name") && !descriptor.includes("company") && !descriptor.includes("user") && !descriptor.includes("file") && !descriptor.includes("first") && !descriptor.includes("last")) ||
        autocomplete === "name"
      ) {
        if (setNativeValue(input, candidate.fullName)) filledCount++;
        return;
      }

      // Email
      if (
        descriptor.includes("email") ||
        input.type === "email" ||
        autocomplete === "email"
      ) {
        if (setNativeValue(input, candidate.email)) filledCount++;
        return;
      }

      // Phone / Mobile
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

      // LinkedIn URL
      if (
        descriptor.includes("linkedin") ||
        descriptor.includes("linkedin url") ||
        descriptor.includes("linkedin profile")
      ) {
        if (setNativeValue(input, candidate.links.linkedin)) filledCount++;
        return;
      }

      // GitHub URL
      if (
        descriptor.includes("github") ||
        descriptor.includes("git") ||
        descriptor.includes("github url") ||
        descriptor.includes("github profile")
      ) {
        if (setNativeValue(input, candidate.links.github)) filledCount++;
        return;
      }

      // Portfolio / Website URL
      if (
        descriptor.includes("portfolio") ||
        descriptor.includes("website") ||
        descriptor.includes("personal site") ||
        descriptor.includes("blog")
      ) {
        if (setNativeValue(input, candidate.links.portfolio)) filledCount++;
        return;
      }

      // City
      if (
        descriptor.includes("city") ||
        descriptor.includes("current city") ||
        autocomplete === "address-level2"
      ) {
        if (setNativeValue(input, candidate.address.city)) filledCount++;
        return;
      }

      // State / Province
      if (
        descriptor.includes("state") ||
        descriptor.includes("province") ||
        autocomplete === "address-level1"
      ) {
        if (setNativeValue(input, candidate.address.state)) filledCount++;
        return;
      }

      // Country
      if (
        descriptor.includes("country") ||
        autocomplete === "country-name"
      ) {
        if (setNativeValue(input, "India")) filledCount++;
        return;
      }

      // Location / Address Line
      if (
        (descriptor.includes("location") || descriptor.includes("address")) &&
        !descriptor.includes("email")
      ) {
        if (setNativeValue(input, candidate.location)) filledCount++;
        return;
      }

      // Current Job Title / Role
      if (
        descriptor.includes("headline") ||
        descriptor.includes("current role") ||
        descriptor.includes("current title") ||
        descriptor.includes("job title")
      ) {
        if (setNativeValue(input, resumeRole || candidate.currentRole)) filledCount++;
        return;
      }

      // Tailored Summary / Cover Letter / Bio / Personal Statement
      if (
        (input.tagName.toLowerCase() === "textarea" || descriptor.includes("summary") || descriptor.includes("cover letter") || descriptor.includes("about yourself") || descriptor.includes("bio") || descriptor.includes("tell us about") || descriptor.includes("pitch")) &&
        !descriptor.includes("email") &&
        !descriptor.includes("phone")
      ) {
        if (resumeSummary && setNativeValue(input, resumeSummary)) {
          filledCount++;
          return;
        }
      }

      // Technical Skills / Competencies / Keywords
      if (
        descriptor.includes("skills") ||
        descriptor.includes("key skills") ||
        descriptor.includes("technical skills") ||
        descriptor.includes("technologies") ||
        descriptor.includes("competencies")
      ) {
        if (resumeSkills && setNativeValue(input, resumeSkills)) {
          filledCount++;
          return;
        }
      }

      // Notice Period / Availability
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

      // Expected Salary / CTC
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

      // Total Years of Experience
      if (
        (descriptor.includes("years") && descriptor.includes("experience") && !descriptor.includes("react") && !descriptor.includes("node") && !descriptor.includes("typescript")) ||
        descriptor.includes("total experience")
      ) {
        if (setNativeValue(input, candidate.yearsExperience)) filledCount++;
        return;
      }

      // Skill-Specific Years of Experience
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

      // Work Authorization
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

      // Visa Sponsorship
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

      // Willing to Relocate
      if (descriptor.includes("relocate") || descriptor.includes("willing to relocate")) {
        if (input.type === "radio" && (labelText.includes("yes") || descriptor.includes("yes"))) {
          if (setNativeValue(input, true)) filledCount++;
        } else if (input.tagName.toLowerCase() === "select") {
          if (setNativeValue(input, "Yes")) filledCount++;
        }
        return;
      }

      // Degree / Education
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
 
    // Highlight File Upload inputs and inject 1-click ATS PDF helper badge
    const fileInputs = Array.from(document.querySelectorAll("input[type='file']"));
    fileInputs.forEach((fileInput) => {
      fileInput.classList.add("jobpilot-file-highlight");
      const parent = fileInput.parentElement;
      if (parent && !parent.querySelector(".jp-file-helper-badge")) {
        const helper = document.createElement("div");
        helper.className = "jp-file-helper-badge";
        const pdfUrl = activeResume?.id
          ? `http://localhost:3000/resumes/${activeResume.id}`
          : "http://localhost:3000/resumes";
        const resumeTitle = activeResume?.companyName
          ? `Tailored for ${activeResume.companyName}`
          : (activeResume?.name ? activeResume.name.slice(0, 24) : "1-Page ATS Resume");

        helper.innerHTML = `
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-size:14px;">📎</span>
            <span>Attach ATS PDF: <strong>${resumeTitle}</strong></span>
          </div>
          <a href="${pdfUrl}" target="_blank" class="jp-file-helper-link" title="Open and save 1-page ATS PDF">📥 Save ATS PDF ↗</a>
        `;
        parent.insertBefore(helper, fileInput);
      }
    });

    return {
      success: true,
      filledCount,
      platform,
    };
  }

  // Auto-Runner with Server Liveness Detection
  function runCheck() {
    injectFormHeaderBanner();
    injectFloatingWidget();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runCheck);
  } else {
    runCheck();
  }

  const observer = new MutationObserver(() => {
    runCheck();
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();