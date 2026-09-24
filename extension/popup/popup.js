const API_BASE = "http://localhost:3000/api/extension";

let candidateData = null;

document.addEventListener("DOMContentLoaded", async () => {
  const statusBadge = document.getElementById("connection-status");
  const statusText = document.getElementById("status-text");
  const candidateName = document.getElementById("candidate-name");
  const candidateHeadline = document.getElementById("candidate-headline");
  const candidateLocation = document.getElementById("candidate-location");
  const candidateResume = document.getElementById("candidate-resume");
  const candidateSkills = document.getElementById("candidate-skills");
  const candidateAvatar = document.getElementById("candidate-avatar");
  const autofillBtn = document.getElementById("autofill-btn");
  const autofillResult = document.getElementById("autofill-result");
  const trackBtn = document.getElementById("track-btn");
  const syncBtn = document.getElementById("sync-btn");
  const aiGenerateBtn = document.getElementById("ai-generate-btn");
  const aiQuestionInput = document.getElementById("ai-question-input");
  const aiAnswerBox = document.getElementById("ai-answer-box");
  const aiAnswerText = document.getElementById("ai-answer-text");
  const aiCopyBtn = document.getElementById("ai-copy-btn");
  const aiToggle = document.getElementById("ai-toggle");
  const aiSection = document.getElementById("ai-section");

  // Resume Selector Elements
  const resumeSelect = document.getElementById("resume-select");
  const detectedJobBadge = document.getElementById("detected-job-badge");
  const selectedResumeRole = document.getElementById("selected-resume-role");
  const selectedResumeType = document.getElementById("selected-resume-type");
  const selectedResumeSummary = document.getElementById("selected-resume-summary");
  const downloadPdfBtn = document.getElementById("download-pdf-btn");
  const copySummaryBtn = document.getElementById("copy-summary-btn");
  const autofillBtnText = document.getElementById("autofill-btn-text");

  let selectedResume = null;
  let customResumes = [];
  let currentTabInfo = { url: "", title: "" };

  // Query active tab information for smart job matching
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab) {
      currentTabInfo = { url: activeTab.url || "", title: activeTab.title || "" };
    }
  } catch (e) {
    console.warn("[JobPilot Extension Tab Query Error]:", e);
  }

  function setupResumeSelector() {
    if (!candidateData) return;

    customResumes = candidateData.customResumes || [];
    const masterResume = candidateData.masterResume || candidateData.activeResume;

    // Clear existing options
    resumeSelect.innerHTML = "";

    // 1. Master Resume option
    const masterOpt = document.createElement("option");
    masterOpt.value = "master";
    masterOpt.textContent = `📄 Master Resume (${masterResume?.name ? masterResume.name.slice(0, 26) : "Baseline"})`;
    resumeSelect.appendChild(masterOpt);

    // 2. Custom tailored resumes
    if (customResumes.length > 0) {
      const optGroup = document.createElement("optgroup");
      optGroup.label = `✨ Custom Job Resumes (${customResumes.length})`;

      customResumes.forEach((cr) => {
        const opt = document.createElement("option");
        opt.value = cr.id;
        opt.textContent = `✨ ${cr.jobTitle} @ ${cr.companyName}`;
        optGroup.appendChild(opt);
      });

      resumeSelect.appendChild(optGroup);
    }

    // 3. Smart Matching: Match current tab to custom resume
    let matchedResume = null;
    const tabCombined = `${currentTabInfo.url} ${currentTabInfo.title}`.toLowerCase();

    for (const cr of customResumes) {
      const comp = (cr.companyName || "").toLowerCase().trim();
      const role = (cr.jobTitle || "").toLowerCase().trim();
      if (comp.length > 2 && tabCombined.includes(comp)) {
        matchedResume = cr;
        break;
      }
      if (cr.jobUrl && currentTabInfo.url && currentTabInfo.url.includes(cr.jobUrl)) {
        matchedResume = cr;
        break;
      }
      if (role.length > 4 && tabCombined.includes(role)) {
        matchedResume = cr;
        break;
      }
    }

    if (matchedResume) {
      resumeSelect.value = matchedResume.id;
      selectedResume = matchedResume;
      detectedJobBadge.textContent = `🎯 Matched: ${matchedResume.companyName}`;
      detectedJobBadge.classList.remove("hidden");
    } else {
      detectedJobBadge.classList.add("hidden");
      selectedResume = masterResume;
      resumeSelect.value = "master";
    }

    updateSelectedResumeUI();
  }

  function updateSelectedResumeUI() {
    if (!selectedResume) {
      selectedResume = candidateData?.masterResume || candidateData?.activeResume;
    }
    if (!selectedResume) return;

    const isTailored = selectedResume.resumeType === "TAILORED" || selectedResume.id !== candidateData?.masterResume?.id;

    selectedResumeRole.textContent = selectedResume.jobTitle || selectedResume.targetRole || candidateData.headline || "Full Stack Developer";
    selectedResumeRole.title = selectedResume.name;

    if (isTailored) {
      selectedResumeType.textContent = "✨ Tailored";
      selectedResumeType.className = "detail-badge tailored";
      autofillBtnText.textContent = `Auto-Fill (${selectedResume.companyName || "Tailored"})`;
    } else {
      selectedResumeType.textContent = "Master";
      selectedResumeType.className = "detail-badge master";
      autofillBtnText.textContent = "Auto-Fill with Master Profile";
    }

    selectedResumeSummary.textContent = selectedResume.summary || candidateData.bio || "Authentic professional summary with verified achievements.";

    // Download ATS PDF button
    downloadPdfBtn.onclick = () => {
      const resumeId = selectedResume.id || candidateData?.activeResume?.id;
      const url = resumeId ? `http://localhost:3000/resumes/${resumeId}` : "http://localhost:3000/resumes";
      chrome.tabs.create({ url });
    };

    // Copy summary button
    copySummaryBtn.onclick = () => {
      const textToCopy = selectedResume.summary || candidateData.bio || "";
      navigator.clipboard.writeText(textToCopy);
      copySummaryBtn.innerHTML = "<span>✅ Copied!</span>";
      setTimeout(() => {
        copySummaryBtn.innerHTML = "<span>📋 Copy Summary</span>";
      }, 2000);
    };
  }

  // Handle dropdown selection change
  resumeSelect.addEventListener("change", () => {
    const val = resumeSelect.value;
    if (val === "master") {
      selectedResume = candidateData.masterResume || candidateData.activeResume;
      detectedJobBadge.classList.add("hidden");
    } else {
      const found = customResumes.find((r) => r.id === val);
      if (found) {
        selectedResume = found;
        detectedJobBadge.textContent = `✨ Custom: ${found.companyName}`;
        detectedJobBadge.classList.remove("hidden");
      }
    }
    updateSelectedResumeUI();
  });

  // 1. Fetch Profile from Backend
  async function loadProfile() {
    statusBadge.className = "status-badge connecting";
    statusText.textContent = "Connecting...";

    try {
      const res = await fetch(`${API_BASE}/profile`, { method: "GET" });
      if (!res.ok) throw new Error("Failed to load profile");

      const data = await res.json();
      if (data.success && data.candidate) {
        candidateData = data.candidate;
        chrome.storage.local.set({ jobpilot_candidate: candidateData });

        // Update UI
        candidateName.textContent = candidateData.fullName;
        candidateHeadline.textContent = candidateData.headline || candidateData.currentRole;
        candidateLocation.textContent = `📍 ${candidateData.location || "India"}`;
        candidateResume.textContent = candidateData.activeResume ? `📄 ${candidateData.activeResume.name.slice(0, 18)}... ↗` : "📄 Master Profile ↗";
        candidateResume.classList.add("clickable");
        candidateResume.title = "Click to view / print 1-page ATS PDF in JobPilot";
        candidateResume.onclick = () => {
          const url = candidateData.activeResume?.id
            ? `http://localhost:3000/resumes/${candidateData.activeResume.id}`
            : "http://localhost:3000/resumes";
          chrome.tabs.create({ url });
        };
        candidateSkills.textContent = `🛠️ ${candidateData.skills?.length || 15} Skills`;

        const initials = candidateData.fullName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();
        candidateAvatar.textContent = initials || "YK";

        statusBadge.className = "status-badge connected";
        statusText.textContent = "Connected";

        // Setup custom resume selector with smart matching
        setupResumeSelector();
      }
    } catch (err) {
      console.warn("[JobPilot Extension Connect Error]:", err);
      // Try loading from local storage
      const cached = await chrome.storage.local.get("jobpilot_candidate");
      if (cached.jobpilot_candidate) {
        candidateData = cached.jobpilot_candidate;
        candidateName.textContent = candidateData.fullName;
        candidateHeadline.textContent = candidateData.headline;
        statusBadge.className = "status-badge connected";
        statusText.textContent = "Offline (Cached)";
        setupResumeSelector();
      } else {
        statusBadge.className = "status-badge disconnected";
        statusText.textContent = "Offline";
        candidateName.textContent = "JobPilot AI Server Offline";
        candidateHeadline.textContent = "Make sure localhost:3000 is running";
      }
    }
  }

  await loadProfile();

  // 2. Auto-Fill Click Handler
  autofillBtn.addEventListener("click", async () => {
    if (!candidateData) {
      showResult("Please connect to JobPilot backend first.", "error");
      return;
    }

    autofillBtn.disabled = true;
    autofillBtn.innerHTML = "<span>⏳ Scanning & Filling Form...</span>";

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error("No active tab found");

      // Send message to content script with selected custom resume
      chrome.tabs.sendMessage(
        tab.id,
        {
          action: "AUTOFILL_JOB_FORM",
          candidate: candidateData,
          selectedResume: selectedResume,
        },
        (response) => {
          autofillBtn.disabled = false;
          autofillBtn.innerHTML = `<span class="btn-icon">⚡</span><span id="autofill-btn-text">${autofillBtnText.textContent}</span>`;

          if (chrome.runtime.lastError || !response) {
            showResult("Could not access page form. Please refresh the page.", "error");
          } else if (response.filledCount > 0) {
            const resumeLabel = selectedResume?.name ? `"${selectedResume.name.slice(0, 25)}..."` : "Your Profile";
            showResult(`🎉 Successfully filled ${response.filledCount} fields using ${resumeLabel}! Remember to attach your 1-page PDF.`, "success");
          } else {
            showResult("No unfilled application fields detected on this page.", "error");
          }
        }
      );
    } catch (err) {
      autofillBtn.disabled = false;
      autofillBtn.innerHTML = `<span class="btn-icon">⚡</span><span id="autofill-btn-text">${autofillBtnText.textContent}</span>`;
      showResult(err.message || "Failed to autofill", "error");
    }
  });

  // 3. Mark as Applied Button
  trackBtn.addEventListener("click", async () => {
    trackBtn.disabled = true;
    trackBtn.textContent = "Saving...";

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const tabTitle = tab?.title || "Job Application";
      const tabUrl = tab?.url || "";

      // Extract company and role heuristics from title
      let company = "External Employer";
      let role = tabTitle;

      if (tabTitle.includes(" at ")) {
        const parts = tabTitle.split(" at ");
        role = parts[0].trim();
        company = parts[1].split("|")[0].split("-")[0].trim();
      } else if (tabTitle.includes(" - ")) {
        const parts = tabTitle.split(" - ");
        role = parts[0].trim();
        company = parts[1].trim();
      }

      let platform = "Web Portal";
      if (tabUrl.includes("linkedin.com")) platform = "LinkedIn";
      else if (tabUrl.includes("greenhouse.io")) platform = "Greenhouse";
      else if (tabUrl.includes("lever.co")) platform = "Lever";
      else if (tabUrl.includes("workday.com")) platform = "Workday";
      else if (tabUrl.includes("indeed.com")) platform = "Indeed";

      const res = await fetch(`${API_BASE}/track-application`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: role,
          companyName: company,
          jobUrl: tabUrl,
          platform,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showResult(`📌 Tracked as APPLIED in JobPilot Dashboard!`, "success");
      } else {
        showResult(data.error || "Failed to track", "error");
      }
    } catch (err) {
      showResult("Could not track application", "error");
    } finally {
      trackBtn.disabled = false;
      trackBtn.textContent = "📌 Mark as Applied";
    }
  });

  // 4. Sync Profile Button
  syncBtn.addEventListener("click", async () => {
    syncBtn.disabled = true;
    syncBtn.textContent = "Syncing...";
    await loadProfile();
    syncBtn.disabled = false;
    syncBtn.textContent = "🔄 Sync Profile";
  });

  // 5. AI Question Generator
  aiGenerateBtn.addEventListener("click", async () => {
    const question = aiQuestionInput.value.trim();
    if (!question) return;

    aiGenerateBtn.disabled = true;
    aiGenerateBtn.textContent = "✨ Generating Answer...";

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const tabTitle = tab?.title || "";

      const res = await fetch(`${API_BASE}/generate-answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, jobTitle: tabTitle }),
      });

      const data = await res.json();
      if (data.success && data.answer) {
        aiAnswerText.textContent = data.answer;
        aiAnswerBox.classList.remove("hidden");
      }
    } catch {
      aiAnswerText.textContent = "Could not connect to AI service. Please ensure JobPilot server is running.";
      aiAnswerBox.classList.remove("hidden");
    } finally {
      aiGenerateBtn.disabled = false;
      aiGenerateBtn.textContent = "✨ Generate Answer";
    }
  });

  // Copy Answer
  aiCopyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(aiAnswerText.textContent);
    aiCopyBtn.textContent = "✅ Copied!";
    setTimeout(() => (aiCopyBtn.textContent = "📋 Copy Answer"), 2000);
  });

  // Toggle AI section
  aiToggle.addEventListener("click", () => {
    aiSection.classList.toggle("hidden");
  });

  function showResult(msg, type) {
    autofillResult.textContent = msg;
    autofillResult.className = `alert-box ${type}`;
    autofillResult.classList.remove("hidden");
    setTimeout(() => {
      autofillResult.classList.add("hidden");
    }, 4500);
  }
});