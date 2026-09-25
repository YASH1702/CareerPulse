/**
 * CareerPulse - Background Service Worker (Manifest V3)
 */

const BACKEND_URL = "http://localhost:3000/api/extension";

// Sync Candidate Profile into Chrome Storage
async function syncProfile() {
  try {
    const res = await fetch(`${BACKEND_URL}/profile`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.candidate) {
        await chrome.storage.local.set({ careerpulse_candidate: data.candidate, jobpilot_candidate: data.candidate });
        console.log("[CareerPulse Background] Candidate profile synced successfully:", data.candidate.fullName);
      }
    }
  } catch (err) {
    console.warn("[CareerPulse Background] Could not reach backend server:", err);
  }
}

// Initial Setup
chrome.runtime.onInstalled.addListener(() => {
  console.log("[CareerPulse Background] Extension Installed.");
  syncProfile();
});

// Periodic profile refresh when browser starts
chrome.runtime.onStartup.addListener(() => {
  syncProfile();
});