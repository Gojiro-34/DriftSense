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
  toast.textContent = message;
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
    `<div class="px-4 py-3 flex items-center justify-between" style="min-height:48px"><div class="flex-1"><div class="skeleton skeleton-text" style="width:60%"></div><div class="skeleton" style="width:44px;height:10px"></div></div></div>`
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
    const errHtml = `<div class="empty-state">Failed to load conflicts</div>`;
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
    const errHtml = `<div class="empty-state">Failed to load commitments</div>`;
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
    const errHtml = `<div class="empty-state">Failed to load</div>`;
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
  btn.innerHTML = `<span class="spinner"></span>Analyzing…`;
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
    showToast("Message captured and analyzed", "success");
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
    btn.innerHTML = `Analyze message`;
  }
}

// ─── Renderers ───────────────────────────────────────────────────────────────
function renderConflicts(conflicts, container) {
  if (!conflicts.length) {
    container.innerHTML = `<div class="empty-state lg:col-span-2 bg-panel">No active conflicts — your founding team is aligned.</div>`;
    return;
  }
  container.innerHTML = conflicts.map(c => {
    const sev = (c.severity || "medium").toUpperCase();
    const sevClass = sev === "HIGH" ? "text-danger" : sev === "MEDIUM" ? "text-caution" : "text-ink-faint";
    const title = c.title || c.description || "Conflict detected";
    const paulSaid = c.paulSaid || c.commitmentA || "";
    const samSaid = c.samSaid || c.commitmentB || "";
    return `<div class="bg-panel p-5">
      <span class="text-label ${sevClass} uppercase">${sev}</span>
      <h3 class="text-[14px] font-semibold text-ink mt-1.5 mb-3">${title}</h3>
      <div class="space-y-2.5 mb-4">
        ${paulSaid ? `<div><p class="text-meta text-ink-faint mb-0.5">Paul said</p><p class="text-body text-ink-dim">"${paulSaid}"</p></div>` : ""}
        ${samSaid ? `<div><p class="text-meta text-ink-faint mb-0.5">Sam said</p><p class="text-body text-ink-dim">"${samSaid}"</p></div>` : ""}
      </div>
      <button onclick='openMediation(${JSON.stringify(c).replace(/'/g,"&#39;")})' class="link-btn">Open mediation →</button>
    </div>`;
  }).join("");
}

function buildCommitmentHtml(filtered) {
  if (!filtered.length) {
    return `<div class="empty-state">No commitments found</div>`;
  }
  return filtered.map(c => {
    const owner = (c.owner || c.founder || "?").toLowerCase();
    const initial = owner.charAt(0).toUpperCase();
    const src = (c.source || "manual").toUpperCase();
    const status = (c.status || "pending").toUpperCase();
    const statusClass = status === "DONE" ? "text-ok" : status === "OVERDUE" ? "text-danger" : "text-ink-faint";
    return `<div class="px-4 py-3 flex items-center justify-between">
      <div class="flex-1 min-w-0">
        <p class="text-body text-ink truncate">${c.text || ""}</p>
        <p class="text-meta text-ink-faint mt-0.5">${owner.charAt(0).toUpperCase() + owner.slice(1)} · ${src}</p>
      </div>
      <span class="text-label ${statusClass} uppercase whitespace-nowrap ml-4">${status}</span>
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
  if (!data) { el.innerHTML = `<div class="empty-state">Failed to load</div>`; return; }
  const isPaul = founder === "paul";
  const name = isPaul ? "Paul" : "Sam";
  const role = isPaul ? "Business focus" : "Technical focus";
  const summary = data.summary || data.briefing?.summary || "No briefing available.";
  const items = data.actionItems || data.briefing?.actionItems || [];
  const commitments = data.pendingCommitments || data.briefing?.urgentItems || [];
  el.innerHTML = `
    <div class="mb-4 pb-4 border-b border-border">
      <h3 class="text-[15px] font-semibold text-ink">${name}</h3>
      <span class="text-meta text-ink-faint">${role}</span>
    </div>
    <p class="text-body text-ink-dim italic mb-5">"${summary}"</p>
    ${items.length ? `<p class="text-label text-ink-faint uppercase mb-2.5">Action items</p>
    <ul class="space-y-2.5 mb-5">${items.map(item => `<li class="action-item flex items-start gap-2.5"><input type="checkbox" class="action-checkbox mt-1"/><span class="text-body text-ink leading-snug">${item}</span></li>`).join("")}</ul>` : ""}
    ${commitments.length ? `<p class="text-label text-ink-faint uppercase mb-2">Pending commitments</p>
    <ul class="space-y-1.5">${commitments.map(c => `<li class="text-body text-ink-dim">— ${typeof c === "string" ? c : c.text || ""}</li>`).join("")}</ul>` : ""}`;
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
      tabs.forEach(t => { t.classList.remove("border-ink", "text-ink"); t.classList.add("border-transparent", "text-ink-faint"); });
      tab.classList.remove("border-transparent", "text-ink-faint");
      tab.classList.add("border-ink", "text-ink");
      activeFounderFilter = tab.dataset.filter;
      renderCommitments();
      document.querySelectorAll(".founder-btn").forEach(b => b.classList.remove("active"));
      if (activeFounderFilter !== "all") {
        const match = document.querySelector(`.founder-btn[data-founder="${activeFounderFilter}"]`);
        if (match) match.classList.add("active");
      }
      syncTabs(selector === ".commitment-tab" ? ".commitment-tab-full" : ".commitment-tab", activeFounderFilter);
    });
  });
}

function syncTabs(selector, founder) {
  const tabs = document.querySelectorAll(selector);
  tabs.forEach(t => { t.classList.remove("border-ink", "text-ink"); t.classList.add("border-transparent", "text-ink-faint"); });
  const match = document.querySelector(`${selector}[data-filter="${founder}"]`);
  if (match) { match.classList.remove("border-transparent", "text-ink-faint"); match.classList.add("border-ink", "text-ink"); }
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
  Promise.all([fetchCommitments(), fetchConflicts()]).then(() => {
    if (typeof buildRiskFeed === "function") buildRiskFeed(allCommitments, lastConflicts);
  });
  fetchBriefings();
});
