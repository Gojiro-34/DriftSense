// ─── UX Module ─────────────────────────────────────────────────────────────
// Analysis progress, mediation modal, risk feed, checkbox interactions.

const PROGRESS_STEPS = [
  "Reading commitments",
  "Comparing founder priorities",
  "Detecting promise mismatches",
  "Evaluating trust risk",
  "Generating mediation plan"
];

// ─── Analysis Progress Panel ─────────────────────────────────────────────────
function showAnalysisProgress() {
  const el = document.getElementById("analysis-progress");
  el.innerHTML = `<div class="analysis-progress">
    <div class="flex items-center mb-3">
      <span class="spinner"></span>
      <span class="text-label text-ink-dim uppercase" id="progress-label">Analyzing alignment</span>
    </div>
    <div id="progress-steps">${PROGRESS_STEPS.map((s, i) =>
      `<div class="progress-step" data-step="${i}">${s}</div>`).join("")}
    </div>
  </div>`;
  animateProgressSteps();
}

function animateProgressSteps() {
  const steps = document.querySelectorAll("#progress-steps .progress-step");
  let i = 0;
  const iv = setInterval(() => {
    if (i > 0 && steps[i - 1]) { steps[i - 1].classList.remove("active"); steps[i - 1].classList.add("done"); }
    if (i < steps.length) { steps[i].classList.add("active"); i++; }
    else { clearInterval(iv);
      const lbl = document.getElementById("progress-label");
      if (lbl) lbl.textContent = "Analysis complete"; }
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
      <span class="text-label text-ink-faint uppercase">No alignment risk detected</span>
      <p class="text-body text-ink-dim mt-2">This message doesn't contain commitments or promises that could cause founder misalignment.</p>
    </div>`;
    return;
  }
  const isConflictRisk = (c.relatedTo === "investor" || c.relatedTo === "customer");
  el.innerHTML = `<div class="result-card ${isConflictRisk ? "result-conflict" : ""}">
    <div class="result-section">
      <span class="text-label ${isConflictRisk ? "text-danger" : "text-ink-dim"} uppercase">Founder alignment alert</span>
      <h3 class="text-[15px] font-semibold text-ink mt-1.5">${isConflictRisk ? "External promise vs. internal priority drift" : "Commitment captured"}</h3>
    </div>
    <div class="result-section">
      <p class="text-label text-ink-faint uppercase mb-1">Detected pattern</p>
      <p class="text-body text-ink">${c.owner || "Founder"} committed: <strong>"${c.text}"</strong></p>
      ${c.deadline ? `<p class="text-meta text-ink-dim mt-1">Deadline: ${c.deadline}</p>` : ""}
    </div>
    ${isConflictRisk ? `<div class="result-section">
      <p class="text-label text-ink-faint uppercase mb-1">Risk level</p>
      <p class="text-body text-danger font-medium">High</p>
      <p class="text-meta text-ink-dim mt-1.5">Client expectation risk, and potential internal resentment if priorities aren't aligned.</p>
    </div>
    <div class="result-section">
      <p class="text-label text-ink-faint uppercase mb-1">Best next move</p>
      <p class="text-body text-ink font-medium">Immediate founder sync within 24 hours.</p>
    </div>` : ""}
    <div>
      <p class="text-label text-ink-faint uppercase mb-2">Suggested actions</p>
      <ul class="space-y-1.5">${["Clarify whether promise still stands", "Reconfirm current priorities", "Assign accountable owner", "Update external expectations if needed"].map(a =>
        `<li class="text-body text-ink-dim">— ${a}</li>`).join("")}
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
        <div>
          <span class="text-label text-ink-faint uppercase">Mediation session</span>
          <h2 class="text-[16px] font-semibold text-ink mt-1">${title}</h2>
        </div>
        <button onclick="closeMediation()" class="text-ink-faint hover:text-ink transition-colors duration-150 text-[13px]">Close</button>
      </div>
      <div class="modal-body space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="perspective-card paul-perspective">
            <span class="text-label text-paul uppercase">Paul's perspective</span>
            <p class="text-body text-ink mt-2">"${paulSaid}"</p>
          </div>
          <div class="perspective-card sam-perspective">
            <span class="text-label text-sam uppercase">Sam's perspective</span>
            <p class="text-body text-ink mt-2">"${samSaid}"</p>
          </div>
        </div>
        <div class="bg-inset border border-border rounded p-4">
          <p class="text-label text-ink-faint uppercase mb-2">Root cause</p>
          <p class="text-body text-ink font-medium">No shared commitment lock system — external promises made without internal priority validation.</p>
        </div>
        <div>
          <p class="text-label text-ink-dim uppercase mb-3">Guided resolution</p>
          <ol class="space-y-2 list-decimal list-inside">${[
            "Decide if promise remains active or needs to be walked back",
            "Re-rank priorities together with shared visibility",
            "Set rule for future external commitments",
            "Communicate unified message to stakeholders"
          ].map(s => `<li class="text-body text-ink">${s}</li>`).join("")}
          </ol>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-danger" onclick="showToast('Escalated to advisory board','error');closeMediation()">Escalate</button>
        <button class="btn-secondary" onclick="showToast('Sync scheduled for tomorrow 9am','info');closeMediation()">Schedule sync</button>
        <button class="btn-primary" onclick="acceptMediationPlan()">Accept plan</button>
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

  const paulCommits = commitArr.filter(c => (c.owner || c.founder || "").toLowerCase() === "paul" && (c.status || "").toLowerCase() === "pending");
  const samCommits = commitArr.filter(c => (c.owner || c.founder || "").toLowerCase() === "sam" && (c.status || "").toLowerCase() === "pending");

  paulCommits.forEach(pc => {
    if (pc.relatedTo === "investor" || pc.relatedTo === "customer") {
      risks.push({ severity: "high", text: `Paul promised "${pc.text}" — verify Sam's sprint includes this` });
    }
  });
  samCommits.forEach(sc => {
    if (sc.relatedTo === "feature") {
      risks.push({ severity: "medium", text: `Sam changed priority: "${sc.text}" — check external commitments` });
    }
  });
  conflictArr.forEach(cf => {
    risks.push({ severity: (cf.severity || "medium").toLowerCase(), text: cf.title || cf.description || "Unresolved conflict detected" });
  });

  const noOwner = commitArr.filter(c => !(c.owner || c.founder));
  if (noOwner.length) risks.push({ severity: "medium", text: `${noOwner.length} commitment(s) missing owner assignment` });

  if (!risks.length) {
    el.innerHTML = `<div class="px-4 py-3 text-body text-ink-dim">No risks detected today. Founders are aligned.</div>`;
    return;
  }
  el.innerHTML = risks.map(r =>
    `<div class="risk-item risk-${r.severity}">
      <span class="risk-dot"></span>
      <p class="text-body text-ink flex-1">${r.text}</p>
    </div>`
  ).join("");
}

// ─── Checkbox Interaction ─────────────────────────────────────────────────────
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
