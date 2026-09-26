// ═══ UX UPGRADE MODULE ═══
// Premium interactions: analysis progress, mediation modal, risk feed, checkbox animations

const PROGRESS_STEPS = [
  { icon: "file-text", text: "Reading commitments..." },
  { icon: "arrows-horizontal", text: "Comparing founder priorities..." },
  { icon: "search", text: "Detecting promise mismatches..." },
  { icon: "shield", text: "Evaluating trust risk..." },
  { icon: "wrench", text: "Generating mediation plan..." }
];

// ─── Analysis Progress Panel ─────────────────────────────────────────────────
function showAnalysisProgress() {
  const el = document.getElementById("analysis-progress");
  el.innerHTML = `<div class="analysis-progress">
    <div class="flex items-center gap-2 mb-3">
      <span class="spinner spinner-accent"></span>
      <span class="font-mono text-label text-accent" id="progress-label">ANALYZING ALIGNMENT...</span>
    </div>
    <div id="progress-steps">${PROGRESS_STEPS.map((s, i) =>
      `<div class="progress-step" data-step="${i}">
        ${icon(s.icon, { size: 15 })}
        <span>${s.text}</span>
      </div>`).join("")}
    </div>
  </div>`;
  animateProgressSteps();
}

function animateProgressSteps() {
  const steps = document.querySelectorAll("#progress-steps .progress-step");
  let i = 0;
  const iv = setInterval(() => {
    if (i > 0 && steps[i - 1]) { steps[i - 1].classList.remove("active"); steps[i - 1].classList.add("done");
      steps[i - 1].querySelector(".icon").outerHTML = icon("check-circle", { size: 15 }); }
    if (i < steps.length) { steps[i].classList.add("active"); i++; }
    else { clearInterval(iv);
      const lbl = document.getElementById("progress-label");
      if (lbl) lbl.textContent = "ANALYSIS COMPLETE"; }
  }, 800);
  window._progressInterval = iv;
}

function clearAnalysisProgress() {
  if (window._progressInterval) clearInterval(window._progressInterval);
  const el = document.getElementById("analysis-progress");
  if (el) el.innerHTML = "";
}

// ─── Analysis Result Card ────────────────────────────────────────────────────
function showAnalysisResult(apiResult) {
  clearAnalysisProgress();
  const el = document.getElementById("analysis-result");
  const extracted = apiResult.extracted || apiResult.commitment;
  const c = apiResult.commitment;
  if (!extracted || !c) {
    el.innerHTML = `<div class="result-card">
      <div class="flex items-center gap-2 mb-2 text-ok">${icon("shield-check", { size: 18 })}
        <span class="font-h3 text-h3 text-ink">No Alignment Risk Detected</span></div>
      <p class="text-body text-ink-dim">This message doesn't contain commitments or promises that could cause founder misalignment.</p>
    </div>`;
    return;
  }
  const isConflictRisk = (c.relatedTo === "investor" || c.relatedTo === "customer");
  const tone = isConflictRisk ? "text-danger" : "text-accent";
  el.innerHTML = `<div class="result-card ${isConflictRisk ? "result-conflict" : ""}">
    <div class="result-section">
      <div class="flex items-center gap-2 mb-1 ${tone}">${icon(isConflictRisk ? "alert-triangle" : "cpu", { size: 17 })}
        <span class="font-mono text-label ${tone}">FOUNDER ALIGNMENT ALERT</span></div>
      <h3 class="font-h3 text-h3 text-ink mt-1">${isConflictRisk ? "External Promise vs Internal Priority Drift" : "Commitment Captured"}</h3>
    </div>
    <div class="result-section">
      <p class="font-mono text-[10px] tracking-wide text-ink-faint mb-1">DETECTED PATTERN</p>
      <p class="text-body text-ink">${c.owner || "Founder"} committed: <strong>"${c.text}"</strong></p>
      ${c.deadline ? `<p class="text-body text-ink-dim mt-1">Deadline: ${c.deadline}</p>` : ""}
    </div>
    ${isConflictRisk ? `<div class="result-section">
      <p class="font-mono text-[10px] tracking-wide text-ink-faint mb-1">RISK LEVEL</p>
      <span class="inline-flex items-center gap-1 border border-danger bg-danger-bg text-danger font-mono text-label px-2 py-1 rounded">
        ${icon("alert-circle", { size: 12 })} HIGH</span>
      <p class="text-body text-ink-dim mt-2">Client expectation risk + potential internal resentment if priorities aren't aligned.</p>
    </div>
    <div class="result-section">
      <p class="font-mono text-[10px] tracking-wide text-ink-faint mb-1">BEST NEXT MOVE</p>
      <p class="text-body text-ink font-medium">Immediate founder sync within 24 hours.</p>
    </div>` : ""}
    <div>
      <p class="font-mono text-[10px] tracking-wide text-ink-faint mb-2">SUGGESTED ACTIONS</p>
      <ul class="space-y-2">${["Clarify whether promise still stands", "Reconfirm current priorities", "Assign accountable owner", "Update external expectations if needed"].map(a =>
        `<li class="flex items-center gap-2 text-body text-ink"><span class="text-accent">${icon("chevron-right", { size: 13 })}</span>${a}</li>`).join("")}
      </ul>
    </div>
  </div>`;
}

function clearAnalysisResult() {
  const el = document.getElementById("analysis-result");
  if (el) el.innerHTML = "";
}

// ─── Mediation Modal ─────────────────────────────────────────────────────────
function openMediation(conflict) {
  const title = conflict.title || conflict.description || "Founder Misalignment";
  const paulSaid = conflict.paulSaid || conflict.commitmentA || "Needs momentum, promises to create growth.";
  const samSaid = conflict.samSaid || conflict.commitmentB || "Protecting execution capacity, reprioritized due to bandwidth.";
  const modal = document.getElementById("mediation-modal");
  modal.innerHTML = `<div class="modal-overlay" onclick="if(event.target===this)closeMediation()">
    <div class="modal-content">
      <div class="modal-header">
        <div><div class="flex items-center gap-2 text-danger">
          ${icon("gavel", { size: 15 })}
          <span class="font-mono text-label">MEDIATION SESSION</span></div>
          <h2 class="font-h3 text-h3 text-ink mt-1">${title}</h2>
        </div>
        <button onclick="closeMediation()" class="text-ink-faint hover:text-ink transition-colors duration-150">
          ${icon("x", { size: 18 })}</button>
      </div>
      <div class="modal-body space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="perspective-card paul-perspective">
            <div class="flex items-center gap-2 mb-3">
              <div class="w-6 h-6 rounded-full bg-paul flex items-center justify-center text-[11px] font-bold" style="color:#2a1700">P</div>
              <span class="font-mono text-label text-paul">PAUL'S PERSPECTIVE</span></div>
            <p class="text-body text-ink">"${paulSaid}"</p>
          </div>
          <div class="perspective-card sam-perspective">
            <div class="flex items-center gap-2 mb-3">
              <div class="w-6 h-6 rounded-full bg-sam flex items-center justify-center text-[11px] font-bold" style="color:#001e2d">S</div>
              <span class="font-mono text-label text-sam">SAM'S PERSPECTIVE</span></div>
            <p class="text-body text-ink">"${samSaid}"</p>
          </div>
        </div>
        <div class="bg-inset border border-border rounded p-4">
          <p class="font-mono text-[10px] tracking-wide text-ink-faint mb-2">ROOT CAUSE</p>
          <p class="text-body text-ink font-medium">No shared commitment lock system — external promises made without internal priority validation.</p>
        </div>
        <div>
          <p class="font-mono text-label text-ink mb-3">GUIDED RESOLUTION</p>
          <div class="space-y-3">${[
            "Decide if promise remains active or needs to be walked back",
            "Re-rank priorities together with shared visibility",
            "Set rule for future external commitments",
            "Communicate unified message to stakeholders"
          ].map((s, i) => `<div class="flex items-start gap-3">
            <div class="w-5 h-5 rounded-full border border-accent flex items-center justify-center text-accent text-[11px] font-semibold flex-shrink-0 mt-0.5">${i + 1}</div>
            <p class="text-body text-ink">${s}</p></div>`).join("")}
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-primary" onclick="acceptMediationPlan()">Accept Plan</button>
        <button class="btn-secondary" onclick="showToast('Sync scheduled for tomorrow 9am','info');closeMediation()">Schedule Sync</button>
        <button class="btn-danger" onclick="showToast('Escalated to advisory board','error');closeMediation()">Escalate</button>
      </div>
    </div>
  </div>`;
  document.body.style.overflow = "hidden";
}

function closeMediation() {
  document.getElementById("mediation-modal").innerHTML = "";
  document.body.style.overflow = "";
}

function acceptMediationPlan() {
  showToast("Mediation plan accepted — alignment restored", "success");
  closeMediation();
  fetchConflicts();
}

// ─── Risk Feed ───────────────────────────────────────────────────────────────
function buildRiskFeed(commitments, conflicts) {
  const el = document.getElementById("risk-feed");
  if (!el) return;
  const risks = [];
  const conflictArr = Array.isArray(conflicts) ? conflicts : [];
  const commitArr = Array.isArray(commitments) ? commitments : [];

  // Detect Paul promises vs Sam deprioritized
  const paulCommits = commitArr.filter(c => (c.owner || c.founder || "").toLowerCase() === "paul" && (c.status || "").toLowerCase() === "pending");
  const samCommits = commitArr.filter(c => (c.owner || c.founder || "").toLowerCase() === "sam" && (c.status || "").toLowerCase() === "pending");

  paulCommits.forEach(pc => {
    if (pc.relatedTo === "investor" || pc.relatedTo === "customer") {
      risks.push({ severity: "high", icon: "alert-triangle", text: `Paul promised "${pc.text}" — verify Sam's sprint includes this` });
    }
  });
  samCommits.forEach(sc => {
    if (sc.relatedTo === "feature") {
      risks.push({ severity: "medium", icon: "repeat", text: `Sam changed priority: "${sc.text}" — check external commitments` });
    }
  });
  conflictArr.forEach(cf => {
    risks.push({ severity: (cf.severity || "medium").toLowerCase(), icon: "gavel", text: cf.title || cf.description || "Unresolved conflict detected" });
  });

  const noOwner = commitArr.filter(c => !(c.owner || c.founder));
  if (noOwner.length) risks.push({ severity: "medium", icon: "user-x", text: `${noOwner.length} commitment(s) missing owner assignment` });

  if (!risks.length) {
    el.innerHTML = `<div class="flex items-center gap-3 py-2 text-ink-dim"><span class="text-ok">${icon("shield-check", { size: 16 })}</span><span class="text-body">No risks detected today. Founders are aligned.</span></div>`;
    return;
  }
  el.innerHTML = risks.map(r => {
    const dotColor = r.severity === "high" ? "#d1584c" : r.severity === "medium" ? "#c99a3f" : "#3f8fc9";
    return `<div class="risk-item risk-${r.severity}">
      <div class="risk-dot" style="background:${dotColor}"></div>
      <div class="flex-1"><p class="text-body text-ink">${r.text}</p></div>
      <span class="text-ink-faint">${icon(r.icon, { size: 15 })}</span>
    </div>`;
  }).join("");
}

// ─── Checkbox Animation ──────────────────────────────────────────────────────
function initCheckboxDelegation() {
  document.addEventListener("change", (e) => {
    if (!e.target.classList.contains("action-checkbox")) return;
    const item = e.target.closest(".action-item");
    if (!item) return;
    if (e.target.checked) {
      item.classList.add("checked");
      showToast("Action item completed", "success");
    } else {
      item.classList.remove("checked");
    }
  });
}

// ─── Expose globally ─────────────────────────────────────────────────────────
window.showAnalysisProgress = showAnalysisProgress;
window.clearAnalysisProgress = clearAnalysisProgress;
window.showAnalysisResult = showAnalysisResult;
window.clearAnalysisResult = clearAnalysisResult;
window.openMediation = openMediation;
window.closeMediation = closeMediation;
window.acceptMediationPlan = acceptMediationPlan;
window.buildRiskFeed = buildRiskFeed;

document.addEventListener("DOMContentLoaded", initCheckboxDelegation);
