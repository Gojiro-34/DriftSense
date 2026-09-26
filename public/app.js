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
  const names = { success: "check-circle", error: "x-circle", info: "info" };
  toast.innerHTML = `${icon(names[type] || "info", { size: 17 })}${message}`;
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
    `<div class="bg-inset border border-border rounded p-3 flex items-center justify-between" style="min-height:52px"><div class="flex items-center gap-4 flex-1"><div class="skeleton" style="width:28px;height:28px;border-radius:50%"></div><div class="flex-1"><div class="skeleton skeleton-text" style="width:70%"></div><div class="skeleton" style="width:50px;height:12px"></div></div></div></div>`
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
    const errHtml = `<div class="empty-state">${icon("cloud-off", { size: 32 })}<p>Failed to load conflicts</p></div>`;
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
    const errHtml = `<div class="empty-state">${icon("cloud-off", { size: 32 })}<p>Failed to load commitments</p></div>`;
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
    const errHtml = `<div class="empty-state">${icon("cloud-off", { size: 32 })}<p>Failed to load</p></div>`;
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
  btn.innerHTML = `<span class="spinner" style="border-color:rgba(4,33,29,0.35);border-top-color:transparent"></span> Analyzing Alignment...`;
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
    btn.innerHTML = `${icon("cpu", { size: 16 })} Analyze with AI`;
  }
}

// ─── Renderers ───────────────────────────────────────────────────────────────
function renderConflicts(conflicts, container) {
  if (!conflicts.length) {
    container.innerHTML = `<div class="empty-state lg:col-span-2">${icon("shield-check", { size: 30, className: "text-ok" })}<p class="text-[15px] font-semibold text-ink-dim">No active conflicts</p><p class="text-body text-ink-faint mt-1">Your founding team is aligned.</p></div>`;
    return;
  }
  container.innerHTML = conflicts.map(c => {
    const sev = (c.severity || "medium").toUpperCase();
    const borderClass = sev === "HIGH" ? "border-danger/60" : sev === "MEDIUM" ? "border-caution/60" : "border-border-strong";
    const badgeClass = sev === "HIGH" ? "border-danger bg-danger-bg text-danger" : sev === "MEDIUM" ? "border-caution bg-caution-bg text-caution" : "border-border-strong text-ink-dim";
    const iconName = sev === "HIGH" ? "alert-circle" : sev === "MEDIUM" ? "alert-triangle" : "info";
    const title = c.title || c.description || "Conflict Detected";
    const paulSaid = c.paulSaid || c.commitmentA || "";
    const samSaid = c.samSaid || c.commitmentB || "";
    return `<div class="bg-panel border ${borderClass} rounded p-4">
      <div class="flex justify-between items-start mb-2"><div>
        <div class="inline-flex items-center gap-1 border ${badgeClass} font-mono text-[10px] px-1.5 py-0.5 rounded mb-1.5">${icon(iconName, { size: 11 })} ${sev}</div>
        <h3 class="font-mono text-[14px] font-semibold text-ink mt-1">${title}</h3>
      </div></div>
      <div class="space-y-2.5">
        ${paulSaid ? `<div class="bg-inset border border-border rounded p-2.5"><p class="font-mono text-[10px] font-semibold text-ink-faint mb-1 tracking-wide">PAUL SAID</p><p class="font-mono text-[12.5px] leading-relaxed text-ink">"${paulSaid}"</p></div>` : ""}
        ${samSaid ? `<div class="bg-inset border border-border rounded p-2.5"><p class="font-mono text-[10px] font-semibold text-ink-faint mb-1 tracking-wide">SAM SAID</p><p class="font-mono text-[12.5px] leading-relaxed text-ink">"${samSaid}"</p></div>` : ""}
      </div>
      <button onclick='openMediation(${JSON.stringify(c).replace(/'/g,"&#39;")})' class="mt-4 w-full border border-accent text-accent font-mono text-label py-2.5 rounded hover:bg-accent/10 transition-colors duration-150 flex items-center justify-center gap-2">${icon("gavel", { size: 14 })}ENTER MEDIATION</button>
    </div>`;
  }).join("");
}

function buildCommitmentHtml(filtered) {
  if (!filtered.length) {
    return `<div class="empty-state">${icon("clipboard", { size: 28 })}<p class="text-ink-dim">No commitments found</p></div>`;
  }
  return filtered.map(c => {
    const owner = (c.owner || c.founder || "?").toLowerCase();
    const initial = owner.charAt(0).toUpperCase();
    const avatarBg = owner === "paul" || initial === "P" ? "#c98a3a" : "#3f8fc9";
    const avatarText = owner === "paul" || initial === "P" ? "#2a1700" : "#001e2d";
    const src = (c.source || "manual").toUpperCase();
    const status = (c.status || "pending").toUpperCase();
    const statusClass = status === "DONE" ? "border-ok bg-ok-bg text-ok" : status === "OVERDUE" ? "border-danger bg-danger-bg text-danger" : "border-border-strong text-ink-dim";
    return `<div class="bg-inset border border-border rounded p-3 flex items-center justify-between">
      <div class="flex items-center gap-3.5">
        <div class="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0" style="background:${avatarBg};color:${avatarText}">${initial}</div>
        <div><p class="font-medium text-ink text-body">${c.text || ""}</p>
        <span class="font-mono text-[10px] tracking-wide font-medium text-ink-faint bg-panel px-1.5 py-0.5 rounded border border-border">${src}</span></div>
      </div>
      <span class="border ${statusClass} font-mono text-[10px] px-2 py-1 rounded whitespace-nowrap flex-shrink-0 ml-3">${status}</span>
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
  if (!data) { el.innerHTML = `<div class="empty-state">${icon("cloud-off", { size: 28 })}<p>Failed to load</p></div>`; return; }
  const isPaul = founder === "paul";
  const avatarBg = isPaul ? "#c98a3a" : "#3f8fc9";
  const avatarText = isPaul ? "#2a1700" : "#001e2d";
  const initial = isPaul ? "P" : "S";
  const name = isPaul ? "Paul" : "Sam";
  const role = isPaul ? "Business Focus" : "Technical Focus";
  const summary = data.summary || data.briefing?.summary || "No briefing available.";
  const items = data.actionItems || data.briefing?.actionItems || [];
  const commitments = data.pendingCommitments || data.briefing?.urgentItems || [];
  el.innerHTML = `
    <div class="flex items-center gap-3.5 mb-4 pb-4 border-b border-border">
      <div class="w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-bold flex-shrink-0" style="background:${avatarBg};color:${avatarText}">${initial}</div>
      <div><h3 class="font-h3 text-[17px] font-bold text-ink">${name}</h3>
      <span class="font-mono text-label text-ink-faint mt-0.5 block">${role}</span></div>
    </div>
    <div class="mb-5"><p class="text-body text-ink-dim italic border-l-2 border-accent pl-3.5 py-1.5">"${summary}"</p></div>
    ${items.length ? `<h4 class="font-mono text-label text-ink-dim mb-3">ACTION ITEMS</h4>
    <ul class="space-y-3">${items.map(item => `<li class="action-item flex items-start gap-3"><input type="checkbox" class="action-checkbox mt-1 bg-inset border-border rounded cursor-pointer"/><span class="text-body text-ink leading-snug">${item}</span></li>`).join("")}</ul>` : ""}
    ${commitments.length ? `<h4 class="font-mono text-label text-ink-dim mb-3 mt-5">PENDING COMMITMENTS</h4>
    <ul class="space-y-2">${commitments.map(c => `<li class="text-body text-ink-dim flex items-center gap-2"><span class="text-accent">${icon("chevron-right", { size: 13 })}</span>${typeof c === "string" ? c : c.text || ""}</li>`).join("")}</ul>` : ""}`;
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
      tabs.forEach(t => { t.classList.remove("border-accent", "text-accent"); t.classList.add("border-transparent", "text-ink-faint"); });
      tab.classList.remove("border-transparent", "text-ink-faint");
      tab.classList.add("border-accent", "text-accent");
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
  tabs.forEach(t => { t.classList.remove("border-accent", "text-accent"); t.classList.add("border-transparent", "text-ink-faint"); });
  const match = document.querySelector(`${selector}[data-filter="${founder}"]`);
  if (match) { match.classList.remove("border-transparent", "text-ink-faint"); match.classList.add("border-accent", "text-accent"); }
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
