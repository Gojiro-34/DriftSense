// ═══ UX UPGRADE MODULE ═══
// Premium interactions: analysis progress, mediation modal, risk feed, checkbox animations

const PROGRESS_STEPS = [
  { icon: "description", text: "Reading commitments..." },
  { icon: "compare_arrows", text: "Comparing founder priorities..." },
  { icon: "search", text: "Detecting promise mismatches..." },
  { icon: "shield", text: "Evaluating trust risk..." },
  { icon: "auto_fix_high", text: "Generating mediation plan..." }
];

// ─── Analysis Progress Panel ─────────────────────────────────────────────────
function showAnalysisProgress() {
  const el = document.getElementById("analysis-progress");
  el.innerHTML = `<div class="analysis-progress">
    <div class="flex items-center gap-2 mb-3">
      <span class="spinner spinner-amber" style="width:14px;height:14px"></span>
      <span class="font-label-caps text-label-caps text-[#f59e0b]" id="progress-label">ANALYZING ALIGNMENT...</span>
    </div>
    <div id="progress-steps">${PROGRESS_STEPS.map((s, i) =>
      `<div class="progress-step" data-step="${i}">
        <span class="material-symbols-outlined" style="font-size:16px">${s.icon}</span>
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
      steps[i - 1].querySelector(".material-symbols-outlined").textContent = "check_circle"; }
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
      <div class="flex items-center gap-2 mb-2"><span class="material-symbols-outlined text-[#10b981]">verified</span>
        <span class="font-h3 text-[18px] font-bold text-on-surface">No Alignment Risk Detected</span></div>
      <p class="text-body-sm text-on-surface-variant">This message doesn't contain commitments or promises that could cause founder misalignment.</p>
    </div>`;
    return;
  }
  const isConflictRisk = (c.relatedTo === "investor" || c.relatedTo === "customer");
  el.innerHTML = `<div class="result-card ${isConflictRisk ? "result-conflict" : ""}">
    <div class="result-section">
      <div class="flex items-center gap-2 mb-1"><span class="material-symbols-outlined text-${isConflictRisk ? "error" : "[#f59e0b]"}" style="font-size:20px">${isConflictRisk ? "warning" : "auto_awesome"}</span>
        <span class="font-label-caps text-label-caps text-${isConflictRisk ? "error" : "[#f59e0b]"}">FOUNDER ALIGNMENT ALERT</span></div>
      <h3 class="font-h3 text-[18px] font-bold text-on-surface mt-1">${isConflictRisk ? "External Promise vs Internal Priority Drift" : "Commitment Captured"}</h3>
    </div>
    <div class="result-section">
      <p class="font-label-caps text-[10px] text-on-surface-variant mb-1">DETECTED PATTERN</p>
      <p class="text-body-sm text-on-surface">${c.owner || "Founder"} committed: <strong>"${c.text}"</strong></p>
      ${c.deadline ? `<p class="text-body-sm text-on-surface-variant mt-1">Deadline: ${c.deadline}</p>` : ""}
    </div>
    ${isConflictRisk ? `<div class="result-section">
      <p class="font-label-caps text-[10px] text-on-surface-variant mb-1">RISK LEVEL</p>
      <span class="inline-flex items-center gap-1 border border-error bg-error/10 text-error font-label-caps text-label-caps px-2 py-1 rounded">
        <span class="material-symbols-outlined" style="font-size:14px">priority_high</span> HIGH</span>
      <p class="text-body-sm text-on-surface-variant mt-2">Client expectation risk + potential internal resentment if priorities aren't aligned.</p>
    </div>
    <div class="result-section">
      <p class="font-label-caps text-[10px] text-on-surface-variant mb-1">BEST NEXT MOVE</p>
      <p class="text-body-sm text-on-surface font-medium">Immediate founder sync within 24 hours.</p>
    </div>` : ""}
    <div>
      <p class="font-label-caps text-[10px] text-on-surface-variant mb-2">SUGGESTED ACTIONS</p>
      <ul class="space-y-2">${["Clarify whether promise still stands", "Reconfirm current priorities", "Assign accountable owner", "Update external expectations if needed"].map(a =>
        `<li class="flex items-center gap-2 text-body-sm text-on-surface"><span class="material-symbols-outlined text-[#f59e0b]" style="font-size:14px">chevron_right</span>${a}</li>`).join("")}
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
        <div><div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-[#f59e0b]">gavel</span>
          <span class="font-label-caps text-label-caps text-[#f59e0b]">MEDIATION SESSION</span></div>
          <h2 class="font-h3 text-h3 text-on-surface mt-1">${title}</h2>
        </div>
        <button onclick="closeMediation()" class="text-on-surface-variant hover:text-on-surface transition-colors">
          <span class="material-symbols-outlined">close</span></button>
      </div>
      <div class="modal-body space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="perspective-card paul-perspective">
            <div class="flex items-center gap-2 mb-3">
              <div class="w-7 h-7 rounded-full bg-[#f59e0b] flex items-center justify-center text-[#19120a] text-xs font-black">P</div>
              <span class="font-label-caps text-label-caps text-[#f59e0b]">PAUL'S PERSPECTIVE</span></div>
            <p class="text-body-sm text-on-surface">"${paulSaid}"</p>
          </div>
          <div class="perspective-card sam-perspective">
            <div class="flex items-center gap-2 mb-3">
              <div class="w-7 h-7 rounded-full bg-[#1abdff] flex items-center justify-center text-[#001e2d] text-xs font-black">S</div>
              <span class="font-label-caps text-label-caps text-[#1abdff]">SAM'S PERSPECTIVE</span></div>
            <p class="text-body-sm text-on-surface">"${samSaid}"</p>
          </div>
        </div>
        <div class="bg-inset border border-level-1 rounded-lg p-4">
          <p class="font-label-caps text-[10px] text-on-surface-variant mb-2">ROOT CAUSE</p>
          <p class="text-body-sm text-on-surface font-medium">No shared commitment lock system — external promises made without internal priority validation.</p>
        </div>
        <div>
          <p class="font-label-caps text-label-caps text-on-surface mb-3">GUIDED RESOLUTION</p>
          <div class="space-y-3">${[
            "Decide if promise remains active or needs to be walked back",
            "Re-rank priorities together with shared visibility",
            "Set rule for future external commitments",
            "Communicate unified message to stakeholders"
          ].map((s, i) => `<div class="flex items-start gap-3">
            <div class="w-6 h-6 rounded-full border border-[#f59e0b] flex items-center justify-center text-[#f59e0b] text-xs font-bold flex-shrink-0 mt-0.5">${i + 1}</div>
            <p class="text-body-sm text-on-surface">${s}</p></div>`).join("")}
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
      risks.push({ severity: "high", icon: "warning", text: `Paul promised "${pc.text}" — verify Sam's sprint includes this` });
    }
  });
  samCommits.forEach(sc => {
    if (sc.relatedTo === "feature") {
      risks.push({ severity: "medium", icon: "swap_horiz", text: `Sam changed priority: "${sc.text}" — check external commitments` });
    }
  });
  conflictArr.forEach(cf => {
    risks.push({ severity: (cf.severity || "medium").toLowerCase(), icon: "gavel", text: cf.title || cf.description || "Unresolved conflict detected" });
  });

  const noOwner = commitArr.filter(c => !(c.owner || c.founder));
  if (noOwner.length) risks.push({ severity: "medium", icon: "person_off", text: `${noOwner.length} commitment(s) missing owner assignment` });

  if (!risks.length) {
    el.innerHTML = `<div class="flex items-center gap-3 py-2 text-on-surface-variant"><span class="material-symbols-outlined text-[#10b981]">verified</span><span class="text-body-sm">No risks detected today. Founders are aligned.</span></div>`;
    return;
  }
  el.innerHTML = risks.map(r => {
    const dotColor = r.severity === "high" ? "#ef4444" : r.severity === "medium" ? "#f59e0b" : "#3b82f6";
    return `<div class="risk-item risk-${r.severity}">
      <div class="risk-dot" style="background:${dotColor}"></div>
      <div class="flex-1"><p class="text-body-sm text-on-surface">${r.text}</p></div>
      <span class="material-symbols-outlined text-on-surface-variant" style="font-size:16px">${r.icon}</span>
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
