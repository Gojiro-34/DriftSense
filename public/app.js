// ─── Config ──────────────────────────────────────────────────────────────────
const API_BASE = ""; // Same origin — update to full URL if frontend is hosted separately

// ─── State ───────────────────────────────────────────────────────────────────
let allCommitments = [];
let activeFounderFilter = "all";
let activeSection = "mission-control";

// ─── Toast System ────────────────────────────────────────────────────────────
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  const icons = { success: "check_circle", error: "error", info: "info" };
  toast.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px">${icons[type] || "info"}</span>${message}`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.animation = "slideOut 0.3s ease-in forwards"; setTimeout(() => toast.remove(), 300); }, 3000);
}

// ─── Skeleton Helpers ────────────────────────────────────────────────────────
function skeletonCards(count, container) {
  container.innerHTML = Array(count).fill("").map(() =>
    `<div class="skeleton-card"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text" style="width:60%"></div></div>`
  ).join("");
}

function skeletonRows(count, container) {
  container.innerHTML = Array(count).fill("").map(() =>
    `<div class="bg-inset border border-level-1 rounded p-md flex items-center justify-between" style="min-height:56px"><div class="flex items-center gap-4 flex-1"><div class="skeleton" style="width:32px;height:32px;border-radius:50%"></div><div class="flex-1"><div class="skeleton skeleton-text" style="width:70%"></div><div class="skeleton" style="width:50px;height:12px"></div></div></div></div>`
  ).join("");
}

// ─── API Calls ───────────────────────────────────────────────────────────────
let lastConflicts = [];
async function fetchConflicts() {
  const container = document.getElementById("conflicts-list");
  const containerFull = document.getElementById("conflicts-list-full");
  skeletonCards(2, container);
  if (containerFull) skeletonCards(2, containerFull);
  try {
    const res = await fetch(`${API_BASE}/api/conflicts`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const conflicts = data.conflicts || data;
    lastConflicts = Array.isArray(conflicts) ? conflicts : [];
    renderConflicts(lastConflicts, container);
    if (containerFull) renderConflicts(lastConflicts, containerFull);
    if (typeof buildRiskFeed === "function") buildRiskFeed(allCommitments, lastConflicts);
  } catch (err) {
    console.error("fetchConflicts:", err);
    const errHtml = `<div class="empty-state"><span class="material-symbols-outlined">cloud_off</span><p>Failed to load conflicts</p></div>`;
    container.innerHTML = errHtml;
    if (containerFull) containerFull.innerHTML = errHtml;
  }
}

async function fetchCommitments() {
  const container = document.getElementById("commitments-list");
  const containerFull = document.getElementById("commitments-list-full");
  skeletonRows(3, container);
  if (containerFull) skeletonRows(3, containerFull);
  try {
    const res = await fetch(`${API_BASE}/api/commitments`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    allCommitments = data.commitments || data;
    if (!Array.isArray(allCommitments)) allCommitments = [];
    renderCommitments();
  } catch (err) {
    console.error("fetchCommitments:", err);
    const errHtml = `<div class="empty-state"><span class="material-symbols-outlined">cloud_off</span><p>Failed to load commitments</p></div>`;
    container.innerHTML = errHtml;
    if (containerFull) containerFull.innerHTML = errHtml;
  }
}

async function fetchBriefings() {
  const paulEl = document.getElementById("briefing-paul");
  const samEl = document.getElementById("briefing-sam");
  const paulElFull = document.getElementById("briefing-paul-full");
  const samElFull = document.getElementById("briefing-sam-full");
  const skelHtml = `<div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text" style="width:60%"></div>`;
  paulEl.innerHTML = skelHtml; samEl.innerHTML = skelHtml;
  if (paulElFull) paulElFull.innerHTML = skelHtml;
  if (samElFull) samElFull.innerHTML = skelHtml;
  try {
    const [paulRes, samRes] = await Promise.all([
      fetch(`${API_BASE}/api/briefing/paul`),
      fetch(`${API_BASE}/api/briefing/sam`)
    ]);
    const paulData = paulRes.ok ? await paulRes.json() : null;
    const samData = samRes.ok ? await samRes.json() : null;
    renderBriefing("paul", paulData, paulEl);
    renderBriefing("sam", samData, samEl);
    if (paulElFull) renderBriefing("paul", paulData, paulElFull);
    if (samElFull) renderBriefing("sam", samData, samElFull);
  } catch (err) {
    console.error("fetchBriefings:", err);
    const errHtml = `<div class="empty-state"><span class="material-symbols-outlined">cloud_off</span><p>Failed to load</p></div>`;
    paulEl.innerHTML = errHtml; samEl.innerHTML = errHtml;
    if (paulElFull) paulElFull.innerHTML = errHtml;
    if (samElFull) samElFull.innerHTML = errHtml;
  }
}

async function captureMessage() {
  const btn = document.getElementById("capture-btn");
  const sourceEl = document.getElementById("capture-source");
  const senderEl = document.getElementById("capture-sender");
  const textEl = document.getElementById("capture-text");
  const text = textEl.value.trim();
  if (!text) { showToast("Please enter a message to analyze.", "error"); return; }
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Analyzing Alignment...`;
  btn.style.opacity = "0.7";
  clearAnalysisResult();
  showAnalysisProgress();
  try {
    const res = await fetch(`${API_BASE}/api/capture`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: sourceEl.value.toLowerCase(),
        message: text,
        sender: senderEl.value.toLowerCase(),
        timestamp: new Date().toISOString()
      })
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `HTTP ${res.status}`); }
    const result = await res.json();
    clearAnalysisProgress();
    showAnalysisResult(result);
    showToast("Message captured and analyzed!", "success");
    textEl.value = "";
    fetchConflicts();
    fetchCommitments();
  } catch (err) {
    console.error("captureMessage:", err);
    clearAnalysisProgress();
    showToast(err.message || "Failed to capture message", "error");
  } finally {
    btn.disabled = false;
    btn.style.opacity = "1";
    btn.innerHTML = `<span class="material-symbols-outlined">auto_awesome</span> Analyze with AI`;
  }
}

// ─── Renderers ───────────────────────────────────────────────────────────────
function renderConflicts(conflicts, container) {
  if (!conflicts.length) {
    container.innerHTML = `<div class="empty-state lg:col-span-2"><span class="material-symbols-outlined">verified</span><p class="text-lg font-semibold text-on-surface-variant">No active conflicts</p><p class="text-sm text-outline mt-1">Your founding team is aligned!</p></div>`;
    return;
  }
  container.innerHTML = conflicts.map(c => {
    const sev = (c.severity || "medium").toUpperCase();
    const borderClass = sev === "HIGH" ? "border-error/50" : sev === "MEDIUM" ? "border-[#f59e0b]/50" : "border-outline-variant";
    const badgeBorder = sev === "HIGH" ? "border-error bg-error/10 text-error" : sev === "MEDIUM" ? "border-[#f59e0b] bg-[#f59e0b]/10 text-[#f59e0b]" : "border-outline bg-outline/10 text-outline";
    const icon = sev === "HIGH" ? "priority_high" : sev === "MEDIUM" ? "warning" : "info";
    const title = c.title || c.description || "Conflict Detected";
    const paulSaid = c.paulSaid || c.commitmentA || "";
    const samSaid = c.samSaid || c.commitmentB || "";
    return `<div class="bg-level-1 border ${borderClass} rounded-lg p-md relative overflow-hidden group">
      <div class="flex justify-between items-start mb-sm"><div>
        <div class="inline-flex items-center gap-1 border ${badgeBorder} font-label-caps text-[10px] px-1.5 py-0.5 rounded mb-1"><span class="material-symbols-outlined text-[12px]">${icon}</span> ${sev}</div>
        <h3 class="font-data-mono text-[15px] font-semibold text-on-surface mt-1">${title}</h3>
      </div></div>
      <div class="space-y-3">
        ${paulSaid ? `<div class="bg-inset border border-level-1 rounded p-sm"><p class="font-data-mono text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-widest">Paul said:</p><p class="font-data-mono text-[13px] leading-relaxed text-on-surface">"${paulSaid}"</p></div>` : ""}
        ${samSaid ? `<div class="bg-inset border border-level-1 rounded p-sm"><p class="font-data-mono text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-widest">Sam said:</p><p class="font-data-mono text-[13px] leading-relaxed text-on-surface">"${samSaid}"</p></div>` : ""}
      </div>
      <button onclick='openMediation(${JSON.stringify(c).replace(/'/g,"&#39;")})' class="mt-md w-full border border-primary-container text-primary-container font-label-caps text-label-caps py-2.5 rounded hover:bg-primary-container/10 transition-colors flex items-center justify-center gap-2"><span class="material-symbols-outlined" style="font-size:16px">gavel</span>ENTER MEDIATION</button>
    </div>`;
  }).join("");
}

function buildCommitmentHtml(filtered) {
  if (!filtered.length) {
    return `<div class="empty-state"><span class="material-symbols-outlined">assignment</span><p class="text-on-surface-variant">No commitments found</p></div>`;
  }
  return filtered.map(c => {
    const owner = (c.owner || c.founder || "?").toLowerCase();
    const initial = owner.charAt(0).toUpperCase();
    const avatarBg = owner === "paul" || initial === "P" ? "#f59e0b" : "#1abdff";
    const avatarText = owner === "paul" || initial === "P" ? "#19120a" : "#001e2d";
    const src = (c.source || "manual").toUpperCase();
    const status = (c.status || "pending").toUpperCase();
    const statusClass = status === "DONE" ? "border-[#14b8a6] bg-[#14b8a6]/10 text-[#14b8a6]" : status === "OVERDUE" ? "border-error bg-error/10 text-error" : "border-secondary-fixed bg-secondary-fixed/10 text-secondary-fixed";
    return `<div class="bg-inset border border-level-1 rounded p-md flex items-center justify-between glow-hover transition-all">
      <div class="flex items-center gap-4">
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black" style="background:${avatarBg};color:${avatarText}">${initial}</div>
        <div><p class="font-medium text-on-surface font-body-sm text-body-sm">${c.text || ""}</p>
        <span class="font-data-mono text-[10px] tracking-widest font-semibold text-on-surface-variant bg-level-1 px-1.5 py-0.5 rounded border border-level-1">${src}</span></div>
      </div>
      <span class="border ${statusClass} font-label-caps text-[10px] px-2 py-1 rounded whitespace-nowrap">${status}</span>
    </div>`;
  }).join("");
}

function renderCommitments() {
  let filtered = allCommitments;
  if (activeFounderFilter !== "all") filtered = allCommitments.filter(c => (c.owner || c.founder || "").toLowerCase() === activeFounderFilter);
  const html = buildCommitmentHtml(filtered);
  const container = document.getElementById("commitments-list");
  const containerFull = document.getElementById("commitments-list-full");
  if (container) container.innerHTML = html;
  if (containerFull) containerFull.innerHTML = html;
}

function renderBriefing(founder, data, el) {
  if (!data) { el.innerHTML = `<div class="empty-state"><span class="material-symbols-outlined">cloud_off</span><p>Failed to load</p></div>`; return; }
  const isPaul = founder === "paul";
  const avatarBg = isPaul ? "#f59e0b" : "#1abdff";
  const avatarText = isPaul ? "#19120a" : "#001e2d";
  const initial = isPaul ? "P" : "S";
  const name = isPaul ? "Paul" : "Sam";
  const role = isPaul ? "Business Focus" : "Technical Focus";
  const summary = data.summary || data.briefing?.summary || "No briefing available.";
  const items = data.actionItems || data.briefing?.actionItems || [];
  const commitments = data.pendingCommitments || data.briefing?.urgentItems || [];
  el.innerHTML = `
    <div class="flex items-center gap-4 mb-5 pb-5 border-b border-level-1">
      <div class="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black" style="background:${avatarBg};color:${avatarText}">${initial}</div>
      <div><h3 class="font-h3 text-[20px] font-bold text-on-surface">${name}</h3>
      <span class="font-label-caps text-label-caps text-on-surface-variant mt-1 block">${role}</span></div>
    </div>
    <div class="mb-6"><p class="font-body-base text-body-base text-on-surface-variant italic border-l-2 border-primary-container pl-4 py-2 bg-primary-container/5">"${summary}"</p></div>
    ${items.length ? `<h4 class="font-label-caps text-label-caps text-on-surface mb-4">ACTION ITEMS</h4>
    <ul class="space-y-4">${items.map(item => `<li class="action-item flex items-start gap-3"><input type="checkbox" class="action-checkbox mt-1 bg-inset border-level-1 rounded text-primary-container cursor-pointer"/><span class="font-body-sm text-body-sm text-on-surface leading-snug">${item}</span></li>`).join("")}</ul>` : ""}
    ${commitments.length ? `<h4 class="font-label-caps text-label-caps text-on-surface mb-4 mt-6">PENDING COMMITMENTS</h4>
    <ul class="space-y-2">${commitments.map(c => `<li class="text-body-sm text-on-surface-variant flex items-center gap-2"><span class="material-symbols-outlined text-[14px] text-primary-container">chevron_right</span>${typeof c === "string" ? c : c.text || ""}</li>`).join("")}</ul>` : ""}`;
}

// ─── Navigation ──────────────────────────────────────────────────────────────
function initNavigation() {
  const navLinks = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll(".section-page");
  navLinks.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const target = link.dataset.section;
      navLinks.forEach(l => l.classList.remove("active"));
      link.classList.add("active");
      sections.forEach(s => { s.classList.toggle("active", s.id === target); });
      activeSection = target;
    });
  });
}

function initFounderSwitcher() {
  const btns = document.querySelectorAll(".founder-btn");
  btns.forEach(btn => {
    btn.addEventListener("click", () => {
      const founder = btn.dataset.founder;
      btns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeFounderFilter = founder;
      updateCommitmentTabs(founder);
      renderCommitments();
    });
  });
}

function setupTabGroup(selector) {
  const tabs = document.querySelectorAll(selector);
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => { t.classList.remove("border-primary-container", "text-primary-container"); t.classList.add("border-transparent", "text-on-surface-variant"); });
      tab.classList.remove("border-transparent", "text-on-surface-variant");
      tab.classList.add("border-primary-container", "text-primary-container");
      activeFounderFilter = tab.dataset.filter;
      renderCommitments();
      // Sync header buttons
      document.querySelectorAll(".founder-btn").forEach(b => b.classList.remove("active"));
      if (activeFounderFilter !== "all") {
        const match = document.querySelector(`.founder-btn[data-founder="${activeFounderFilter}"]`);
        if (match) match.classList.add("active");
      }
      // Sync the other tab group
      syncTabs(selector === ".commitment-tab" ? ".commitment-tab-full" : ".commitment-tab", activeFounderFilter);
    });
  });
}

function syncTabs(selector, founder) {
  const tabs = document.querySelectorAll(selector);
  tabs.forEach(t => { t.classList.remove("border-primary-container", "text-primary-container"); t.classList.add("border-transparent", "text-on-surface-variant"); });
  const match = document.querySelector(`${selector}[data-filter="${founder}"]`);
  if (match) { match.classList.remove("border-transparent", "text-on-surface-variant"); match.classList.add("border-primary-container", "text-primary-container"); }
}

function updateCommitmentTabs(founder) {
  syncTabs(".commitment-tab", founder);
  syncTabs(".commitment-tab-full", founder);
}

// ─── Init ────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initFounderSwitcher();
  setupTabGroup(".commitment-tab");
  setupTabGroup(".commitment-tab-full");
  document.getElementById("capture-btn").addEventListener("click", captureMessage);
  // Load all data then build risk feed
  Promise.all([fetchCommitments(), fetchConflicts()]).then(() => {
    if (typeof buildRiskFeed === "function") buildRiskFeed(allCommitments, lastConflicts);
  });
  fetchBriefings();
});
