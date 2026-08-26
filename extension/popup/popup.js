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
        candidateResume.textContent = candidateData.activeResume ? `📄 ${candidateData.activeResume.name.slice(0, 18)}...` : "📄 Master Profile";
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

      // Send message to content script
      chrome.tabs.sendMessage(
        tab.id,
        { action: "AUTOFILL_JOB_FORM", candidate: candidateData },
        (response) => {
          autofillBtn.disabled = false;
          autofillBtn.innerHTML = "<span class=\"btn-icon\">⚡</span><span>Auto-Fill This Application</span>";

          if (chrome.runtime.lastError || !response) {
            showResult("Could not access page form. Please refresh the page.", "error");
          } else if (response.filledCount > 0) {
            showResult(`🎉 Successfully filled ${response.filledCount} fields (${response.platform || "Job Form"})!`, "success");
          } else {
            showResult("No unfilled application fields detected on this page.", "error");
          }
        }
      );
    } catch (err) {
      autofillBtn.disabled = false;
      autofillBtn.innerHTML = "<span class=\"btn-icon\">⚡</span><span>Auto-Fill This Application</span>";
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