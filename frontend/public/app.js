const el = {
  skillsDir: document.getElementById("skillsDir"),
  cwd: document.getElementById("cwd"),
  model: document.getElementById("model"),
  modelMirror: document.getElementById("modelMirror"),
  modelPreset: document.getElementById("modelPreset"),
  applyModelPresetBtn: document.getElementById("applyModelPresetBtn"),
  modelSetupModal: document.getElementById("modelSetupModal"),
  modelSetupText: document.getElementById("modelSetupText"),
  useDetectedModelBtn: document.getElementById("useDetectedModelBtn"),
  keepCurrentModelBtn: document.getElementById("keepCurrentModelBtn"),
  onboardingModal: document.getElementById("onboardingModal"),
  onboardingStatus: document.getElementById("onboardingStatus"),
  onboardingRecheckBtn: document.getElementById("onboardingRecheckBtn"),
  onboardingOpenDocsBtn: document.getElementById("onboardingOpenDocsBtn"),
  onboardingDismissBtn: document.getElementById("onboardingDismissBtn"),
  includeSystem: document.getElementById("includeSystem"),
  browseSkillsDirBtn: document.getElementById("browseSkillsDirBtn"),
  browseCwdBtn: document.getElementById("browseCwdBtn"),
  browseExportDirBtn: document.getElementById("browseExportDirBtn"),
  refreshSkillsBtn: document.getElementById("refreshSkillsBtn"),
  skillsList: document.getElementById("skillsList"),
  startSessionBtn: document.getElementById("startSessionBtn"),
  launchAbbBtn: document.getElementById("launchAbbBtn"),
  micBtn: document.getElementById("micBtn"),
  evaluateBtn: document.getElementById("evaluateBtn"),
  masterSaveBtn: document.getElementById("masterSaveBtn"),
  sessionMeta: document.getElementById("sessionMeta"),
  conversationLog: document.getElementById("conversationLog"),
  conversationInput: document.getElementById("conversationInput"),
  sendConversationBtn: document.getElementById("sendConversationBtn"),
  forceSendBtn: document.getElementById("forceSendBtn"),
  autoSendVoice: document.getElementById("autoSendVoice"),
  evalProgress: document.getElementById("evalProgress"),
  evalProgressCircle: document.getElementById("evalProgressCircle"),
  evalProgressText: document.getElementById("evalProgressText"),
  turnProgress: document.getElementById("turnProgress"),
  turnProgressCircle: document.getElementById("turnProgressCircle"),
  turnProgressText: document.getElementById("turnProgressText"),
  diagnosticsOutput: document.getElementById("diagnosticsOutput"),
  clearDiagnosticsBtn: document.getElementById("clearDiagnosticsBtn"),
  micHeroImage: document.getElementById("micHeroImage"),
  micGlyph: document.getElementById("micGlyph"),
  micImageFile: document.getElementById("micImageFile"),
  micImageQuick: document.getElementById("micImageQuick"),
  exportDir: document.getElementById("exportDir"),
  exportSessionBtn: document.getElementById("exportSessionBtn"),
  sessionResetModal: document.getElementById("sessionResetModal"),
  resetCancelBtn: document.getElementById("resetCancelBtn"),
  resetOnlyBtn: document.getElementById("resetOnlyBtn"),
  resetExportMdBtn: document.getElementById("resetExportMdBtn"),
  resetExportDocxBtn: document.getElementById("resetExportDocxBtn"),
  sessionStartModal: document.getElementById("sessionStartModal"),
  sessionStartPath: document.getElementById("sessionStartPath"),
  startUseCurrentBtn: document.getElementById("startUseCurrentBtn"),
  startChooseWorkspaceBtn: document.getElementById("startChooseWorkspaceBtn"),
  startCancelBtn: document.getElementById("startCancelBtn"),
  storyTitle: document.getElementById("storyTitle"),
  storyGenre: document.getElementById("storyGenre"),
  storyTone: document.getElementById("storyTone"),
  storyConcept: document.getElementById("storyConcept"),
  storyNotes: document.getElementById("storyNotes"),
  buildPromptBtn: document.getElementById("buildPromptBtn"),
  saveIntakeBtn: document.getElementById("saveIntakeBtn"),
  targetDir: document.getElementById("targetDir"),
  fileInput: document.getElementById("fileInput"),
  uploadBtn: document.getElementById("uploadBtn"),
  uploadedFiles: document.getElementById("uploadedFiles"),
  userPrompt: document.getElementById("userPrompt"),
  dryRun: document.getElementById("dryRun"),
  runBtn: document.getElementById("runBtn"),
  status: document.getElementById("status"),
  jobsList: document.getElementById("jobsList"),
  jobOutput: document.getElementById("jobOutput")
};

const defaults = {
  skillsDir: "/Users/lastresort/codex/skills",
  cwd: "/Volumes/New Home/Crucial Backup /Codex/Gassian-Blender-MCP",
  model: "gpt-5.3-codex"
};

const state = {
  skills: [],
  jobs: [],
  selectedJobId: null,
  uploadedPaths: [],
  extractedContexts: [],
  sessionId: null,
  readiness: 0,
  micActive: false,
  autoSendVoice: false
};
const MAX_TURN_CHARS = 2200;
const TURN_REQUEST_TIMEOUT_MS = 240000;
const EVAL_REQUEST_TIMEOUT_MS = 300000;
const ONBOARDING_ACK_KEY = "autobookOnboardingAck";
const diagnosticsLines = [];
let micLastStartAt = 0;
let micRestartBackoffUntil = 0;
let micInterimPreview = "";

function addDiagnosticLine(message, level = "info") {
  const stamp = new Date().toLocaleTimeString();
  diagnosticsLines.push(`[${stamp}] [${level}] ${String(message)}`);
  while (diagnosticsLines.length > 80) diagnosticsLines.shift();
  if (el.diagnosticsOutput) {
    el.diagnosticsOutput.textContent = diagnosticsLines.join("\n") || "No diagnostics yet.";
    el.diagnosticsOutput.scrollTop = el.diagnosticsOutput.scrollHeight;
  }
}

function setStatus(text) {
  el.status.textContent = text;
  if (text) {
    const msg = String(text);
    const level = /error|failed|timeout|blocked/i.test(msg) ? "error" : "info";
    addDiagnosticLine(msg, level);
  }
}

function closeOnboardingModal() {
  el.onboardingModal.classList.add("hidden");
}

function openOnboardingModal() {
  el.onboardingModal.classList.remove("hidden");
}

function syncModelInputs(source = "model") {
  if (source === "model") {
    el.modelMirror.value = el.model.value;
  } else {
    el.model.value = el.modelMirror.value;
  }
}

function checkedSkillIds() {
  return [...document.querySelectorAll("input[data-skill-id]:checked")].map((n) =>
    n.getAttribute("data-skill-id")
  );
}

function renderSkills() {
  el.skillsList.innerHTML = "";
  if (!state.skills.length) {
    el.skillsList.innerHTML = "<p>No skills found.</p>";
    return;
  }
  state.skills.forEach((skill) => {
    const box = document.createElement("label");
    box.className = "skill-item";
    box.innerHTML = `
      <div class="inline">
        <input type="checkbox" data-skill-id="${skill.id}" />
        <strong>${skill.name}</strong>
      </div>
      <p>${skill.description || "No description"}</p>
      <p><code>${skill.id}</code></p>
    `;
    el.skillsList.appendChild(box);
  });
}

function renderJobs() {
  el.jobsList.innerHTML = "";
  if (!state.jobs.length) {
    el.jobsList.innerHTML = "<p>No jobs yet.</p>";
    return;
  }
  state.jobs.forEach((job) => {
    const card = document.createElement("div");
    card.className = "job-item";
    card.innerHTML = `
      <strong>${job.id}</strong>
      <span>Status: ${job.status}</span><br />
      <span>Skills: ${job.skills.join(", ") || "(none)"}</span>
    `;
    card.addEventListener("click", () => openJob(job.id));
    el.jobsList.appendChild(card);
  });
}

function renderUploadedFiles() {
  el.uploadedFiles.innerHTML = "";
  if (!state.uploadedPaths.length) {
    el.uploadedFiles.innerHTML = "<p>No uploaded files attached.</p>";
    return;
  }
  const list = document.createElement("ul");
  state.uploadedPaths.forEach((p) => {
    const li = document.createElement("li");
    li.textContent = p;
    list.appendChild(li);
  });
  el.uploadedFiles.appendChild(list);
}

function addConversationMessage(role, text) {
  const node = document.createElement("div");
  node.className = `turn turn-${role}`;
  node.innerHTML = `<strong>${role === "user" ? "You" : "Builder"}</strong><p>${String(text || "").replace(/\n/g, "<br />")}</p>`;
  el.conversationLog.appendChild(node);
  el.conversationLog.scrollTop = el.conversationLog.scrollHeight;
}

function appendToConversationInput(text) {
  const incoming = String(text || "").trim();
  if (!incoming) return;
  const current = el.conversationInput.value.trim();
  el.conversationInput.value = current ? `${current} ${incoming}` : incoming;
}

function setSessionMeta(text) {
  el.sessionMeta.textContent = text;
}

function hasSessionId() {
  return Boolean(state.sessionId);
}

function openSessionResetModal() {
  el.sessionResetModal.classList.remove("hidden");
}

function closeSessionResetModal() {
  el.sessionResetModal.classList.add("hidden");
}

function openSessionStartModal() {
  el.sessionStartPath.textContent = el.cwd.value.trim() || "(no workspace selected)";
  el.sessionStartModal.classList.remove("hidden");
}

function closeSessionStartModal() {
  el.sessionStartModal.classList.add("hidden");
}

function splitTurnText(text, maxChars = MAX_TURN_CHARS) {
  const normalized = String(text || "").trim();
  if (normalized.length <= maxChars) {
    return { sendText: normalized, remainder: "" };
  }
  const head = normalized.slice(0, maxChars);
  const points = [head.lastIndexOf("\n"), head.lastIndexOf(". "), head.lastIndexOf(" ")];
  const best = Math.max(...points);
  const cut = best > 600 ? best + (head[best] === "." ? 1 : 0) : maxChars;
  return { sendText: normalized.slice(0, cut).trim(), remainder: normalized.slice(cut).trim() };
}

async function chooseDirectoryNative(targetInputId, promptText) {
  const input = el[targetInputId];
  if (!input) return;
  const startPath = String(input.value || "").trim();
  const res = await fetch("/api/fs/choose-directory", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ startPath, prompt: promptText })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to open native picker");
  if (data.cancelled) return;
  if (data.path) {
    input.value = data.path;
  }
}

async function startSessionFlow(useChooser = false) {
  if (useChooser) {
    await chooseDirectoryNative("cwd", "Choose Workspace Directory");
  }
  if (!el.exportDir.value.trim() || el.exportDir.value.trim() === defaults.cwd) {
    el.exportDir.value = el.cwd.value.trim();
  }
  const prepPayload = {
    cwd: el.cwd.value.trim(),
    skillsDir: el.skillsDir.value.trim(),
    includeSystem: el.includeSystem.checked,
    selectedSkillIds: checkedSkillIds()
  };
  const prepRes = await fetch("/api/session/prepare-workspace", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(prepPayload)
  });
  const prepData = await prepRes.json();
  if (!prepRes.ok) {
    throw new Error(prepData.error || "Workspace preparation failed");
  }
  await startSession();
  setStatus(`Session workspace prepared at ${prepPayload.cwd}`);
}

function applyMicHeroImage(dataUrl) {
  const value = String(dataUrl || "").trim();
  if (!value) {
    el.micHeroImage.removeAttribute("src");
    el.micBtn.classList.remove("mic-photo-loaded");
    localStorage.removeItem("micHeroImageDataUrl");
    return;
  }
  el.micHeroImage.src = value;
  el.micBtn.classList.add("mic-photo-loaded");
  localStorage.setItem("micHeroImageDataUrl", value);
}

function triggerMicSpeaking() {
  el.micBtn.classList.add("mic-speaking");
  window.clearTimeout(triggerMicSpeaking._timer);
  triggerMicSpeaking._timer = window.setTimeout(() => {
    el.micBtn.classList.remove("mic-speaking");
  }, 420);
}

function applyExtractedIntake(intake) {
  if (!intake) return false;
  let changed = false;
  const setValue = (node, value) => {
    if (typeof value !== "string" || !value.trim()) return;
    node.value = value.trim();
    changed = true;
  };
  setValue(el.storyTitle, intake.title);
  setValue(el.storyGenre, intake.genre);
  setValue(el.storyTone, intake.tone);
  setValue(el.storyConcept, intake.concept);
  setValue(el.storyNotes, intake.notes);
  return changed;
}

async function startSession() {
  const payload = {
    cwd: el.cwd.value.trim(),
    model: el.model.value.trim(),
    skillsDir: el.skillsDir.value.trim(),
    includeSystem: el.includeSystem.checked
  };
  const res = await fetch("/api/session/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to start session");
  state.sessionId = data.id;
  state.readiness = 0;
  el.conversationLog.innerHTML = "";
  setSessionMeta(`Session ${data.id} active. Readiness: 0/100`);
  setStatus("Conversation session started.");
}

function hasActiveSession() {
  return Boolean(state.sessionId) && (el.conversationLog.children.length > 0 || state.readiness > 0);
}

async function sendConversationTurn(textOverride = "") {
  if (!state.sessionId) {
    throw new Error("Start a session first.");
  }
  const rawText = (textOverride || el.conversationInput.value).trim();
  if (!rawText) return;
  const { sendText: text, remainder } = splitTurnText(rawText);
  if (!text) return;
  if (sendConversationTurn._busy) {
    pendingAutoSend = true;
    setStatus("Turn in progress. Message queued.");
    return;
  }
  sendConversationTurn._busy = true;
  pendingAutoSend = false;
  startTurnProgress();
  addConversationMessage("user", text);
  if (!textOverride) {
    el.conversationInput.value = remainder || "";
    if (remainder) {
      setStatus(`Long turn detected. Sending chunk (${text.length} chars). Remaining queued.`);
    }
  }

  try {
    const controller = new AbortController();
    activeTurnController = controller;
    const timeoutId = window.setTimeout(() => controller.abort(), TURN_REQUEST_TIMEOUT_MS);
    let res;
    try {
      res = await fetch(`/api/session/${encodeURIComponent(state.sessionId)}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          text,
          attachedFilePaths: state.uploadedPaths,
          extractedContexts: state.extractedContexts
        })
      });
    } finally {
      window.clearTimeout(timeoutId);
    }
    const data = await res.json();
    if (!res.ok) {
      const details = data.details ? `: ${data.details}` : "";
      throw new Error(`${data.error || "Conversation turn failed"}${details}`);
    }

    applyExtractedIntake(data.intake);
    state.readiness = Number(data.readiness || 0);
    addConversationMessage("assistant", data.assistant || "(no reply)");
    setSessionMeta(
      `Session ${state.sessionId} active. Readiness: ${state.readiness}/100${data.readyForEvaluation ? " (ready for evaluation)" : ""}`
    );
  } catch (error) {
    stopTurnProgress(false);
    if (error?.name === "AbortError") {
      throw new Error("Request timed out waiting for BBB response");
    }
    if (!textOverride && !el.conversationInput.value.trim()) {
      el.conversationInput.value = text;
    }
    throw error;
  } finally {
    activeTurnController = null;
    sendConversationTurn._busy = false;
    if (turnProgressTimer) {
      stopTurnProgress(true);
    }
    if (state.autoSendVoice && (pendingAutoSend || el.conversationInput.value.trim())) {
      pendingAutoSend = false;
      queueAutoSend();
    }
  }
}

async function runEvaluation() {
  if (!state.sessionId) throw new Error("Start a session first.");
  if (runEvaluation._busy) {
    setStatus("Evaluation already running...");
    return;
  }
  runEvaluation._busy = true;
  const originalLabel = el.evaluateBtn.textContent;
  el.evaluateBtn.disabled = true;
  el.evaluateBtn.textContent = "Evaluating...";
  startEvalProgress();
  try {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), EVAL_REQUEST_TIMEOUT_MS);
    let res;
    try {
      res = await fetch(`/api/session/${encodeURIComponent(state.sessionId)}/evaluate`, {
        method: "POST",
        signal: controller.signal
      });
    } finally {
      window.clearTimeout(timeoutId);
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Evaluation failed");
    const e = data.evaluation;
    addConversationMessage(
      "assistant",
      `Evaluation: overall ${e.overall}/100 | pass=${e.pass}\nVerdict: ${e.verdict}\nMust fix: ${(e.must_fix || []).join("; ") || "(none)"}`
    );
    setStatus(`Evaluation complete. Overall ${e.overall}/100.`);
    stopEvalProgress(true);
  } catch (error) {
    stopEvalProgress(false);
    if (error?.name === "AbortError") {
      throw new Error("Evaluation timed out");
    }
    throw error;
  } finally {
    runEvaluation._busy = false;
    el.evaluateBtn.disabled = false;
    el.evaluateBtn.textContent = originalLabel;
  }
}

async function exportSessionFiles(format = "md", sessionIdOverride = "") {
  const targetSessionId = sessionIdOverride || state.sessionId;
  if (!targetSessionId) throw new Error("Start a session first.");
  const payload = {
    outputDir: el.exportDir.value.trim() || el.cwd.value.trim(),
    format
  };
  const res = await fetch(`/api/session/${encodeURIComponent(targetSessionId)}/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Export failed");
  const paths = Object.values(data.files || {});
  paths.forEach((p) => {
    if (!state.uploadedPaths.includes(p)) state.uploadedPaths.push(p);
  });
  renderUploadedFiles();
  setStatus(`Exported ${format.toUpperCase()} intake artifacts to ${payload.outputDir}.`);
}

function initMic() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    addDiagnosticLine("Web Speech API not supported in this browser.", "error");
    setStatus("Mic not supported in this browser.");
    return null;
  }
  addDiagnosticLine(`Web Speech API detected (${window.webkitSpeechRecognition ? "webkit" : "standard"}).`);
  const recognition = new SR();
  recognition.lang = "en-US";
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;
  recognition.onstart = () => {
    micLastStartAt = Date.now();
    micInterimPreview = "";
    addDiagnosticLine("Microphone recognition started.");
  };
  recognition.onresult = (event) => {
    let finalText = "";
    let interimText = "";
    const startIdx = Number.isInteger(event.resultIndex) ? event.resultIndex : 0;
    for (let i = startIdx; i < event.results.length; i += 1) {
      const result = event.results[i];
      const transcript = result?.[0]?.transcript?.trim();
      if (!transcript) continue;
      if (result.isFinal) {
        finalText += (finalText ? " " : "") + transcript;
      } else {
        interimText += (interimText ? " " : "") + transcript;
      }
    }

    if (interimText && interimText !== micInterimPreview) {
      micInterimPreview = interimText;
      addDiagnosticLine(`Mic interim: ${interimText.slice(0, 120)}`);
      setStatus(`Mic hearing: ${interimText.slice(0, 80)}${interimText.length > 80 ? "..." : ""}`);
    }

    if (finalText) {
      micInterimPreview = "";
      addDiagnosticLine(`Mic transcript chunk (${finalText.length} chars): ${finalText.slice(0, 120)}`);
      appendToConversationInput(finalText);
      triggerMicSpeaking();
      if (state.autoSendVoice) {
        if (hasSessionId()) {
          setStatus("Mic captured text. Auto-send queued...");
          queueAutoSend("mic-final");
        } else {
          addDiagnosticLine("Mic captured text but no session is active; auto-send skipped.", "warn");
          setStatus("Transcript captured, but no session is started. Click Start Session to send.");
        }
      } else {
        setStatus(
          hasSessionId()
            ? "Mic captured text. Press Send Message when ready."
            : "Transcript captured. Start a session, then send when ready."
        );
      }
    }
  };
  recognition.onerror = (event) => {
    const code = event?.error || "unknown";
    addDiagnosticLine(`Microphone recognition error: ${code}`, "error");
    if (code === "not-allowed" || code === "service-not-allowed") {
      state.micActive = false;
      el.micBtn.classList.remove("mic-live");
      el.micBtn.setAttribute("aria-label", "Start microphone");
      el.micBtn.title = "Start microphone";
      setStatus("Microphone permission blocked in browser.");
      return;
    }
    if (code === "no-speech") {
      setStatus("Mic heard no speech. Listening will retry.");
      return;
    }
    if (code === "aborted" && !state.micActive) {
      return;
    }
    setStatus(`Microphone error: ${code}`);
  };
  recognition.onend = () => {
    addDiagnosticLine(`Microphone recognition ended. micActive=${state.micActive ? "true" : "false"}`);
    if (state.micActive) {
      const now = Date.now();
      if (now < micRestartBackoffUntil) return;
      if (now - micLastStartAt < 500) {
        micRestartBackoffUntil = now + 400;
      }
      try {
        recognition.start();
      } catch (error) {
        addDiagnosticLine(`Microphone restart failed: ${error.message}`, "error");
        if (/already started|InvalidStateError/i.test(String(error?.message || ""))) {
          return;
        }
        setStatus(`Microphone restart error: ${error.message}`);
      }
    }
  };
  return recognition;
}

let micRecognition = null;
let autoSendTimer = null;
let pendingAutoSend = false;
let activeTurnController = null;
let turnProgressTimer = null;
let evalProgressTimer = null;

function setEvalProgress(percent) {
  const clamped = Math.max(0, Math.min(100, Number(percent) || 0));
  const shown = Math.round(clamped);
  const visiblePercent = Math.max(2, shown);
  el.evalProgressCircle.style.strokeDasharray = `${visiblePercent} 100`;
  if (shown < 45) {
    el.evalProgressCircle.style.stroke = "#2aa7ff";
  } else if (shown < 80) {
    el.evalProgressCircle.style.stroke = "#69be28";
  } else {
    el.evalProgressCircle.style.stroke = "#e63946";
  }
  el.evalProgressText.textContent = `Evaluating ${shown}%`;
}

function startEvalProgress() {
  const startedAt = Date.now();
  el.evalProgress.classList.remove("hidden");
  setEvalProgress(2);
  window.clearInterval(evalProgressTimer);
  evalProgressTimer = window.setInterval(() => {
    const elapsed = Date.now() - startedAt;
    const ratio = Math.min(0.95, elapsed / EVAL_REQUEST_TIMEOUT_MS);
    setEvalProgress(ratio * 100);
  }, 250);
}

function stopEvalProgress(success = true) {
  window.clearInterval(evalProgressTimer);
  evalProgressTimer = null;
  if (success) {
    setEvalProgress(100);
    window.setTimeout(() => {
      el.evalProgress.classList.add("hidden");
    }, 220);
  } else {
    el.evalProgress.classList.add("hidden");
  }
}

function setTurnProgress(percent) {
  const clamped = Math.max(0, Math.min(100, Number(percent) || 0));
  const shown = Math.round(clamped);
  const visiblePercent = Math.max(2, shown);
  el.turnProgressCircle.style.strokeDasharray = `${visiblePercent} 100`;
  if (shown < 45) {
    el.turnProgressCircle.style.stroke = "#2aa7ff";
  } else if (shown < 80) {
    el.turnProgressCircle.style.stroke = "#69be28";
  } else {
    el.turnProgressCircle.style.stroke = "#e63946";
  }
  el.turnProgressText.textContent = `${shown}%`;
}

function startTurnProgress() {
  const startedAt = Date.now();
  el.turnProgress.classList.remove("hidden");
  setTurnProgress(2);
  window.clearInterval(turnProgressTimer);
  turnProgressTimer = window.setInterval(() => {
    const elapsed = Date.now() - startedAt;
    const ratio = Math.min(0.95, elapsed / TURN_REQUEST_TIMEOUT_MS);
    setTurnProgress(ratio * 100);
  }, 250);
}

function stopTurnProgress(success = true) {
  window.clearInterval(turnProgressTimer);
  turnProgressTimer = null;
  if (success) {
    setTurnProgress(100);
    window.setTimeout(() => {
      el.turnProgress.classList.add("hidden");
    }, 220);
  } else {
    el.turnProgress.classList.add("hidden");
  }
}

function queueAutoSend(reason = "unknown") {
  if (!state.autoSendVoice) return;
  const pendingText = el.conversationInput.value.trim();
  if (!pendingText) return;
  if (!hasSessionId()) {
    addDiagnosticLine(`Auto-send skipped (${reason}): no active session.`, "warn");
    setStatus("Auto-send is on, but no session is started yet.");
    return;
  }
  window.clearTimeout(autoSendTimer);
  addDiagnosticLine(`Auto-send queued (${reason}).`);
  autoSendTimer = window.setTimeout(async () => {
    try {
      if (!hasSessionId()) {
        addDiagnosticLine("Auto-send canceled: session missing at send time.", "warn");
        setStatus("Auto-send canceled because no session is active.");
        return;
      }
      await sendConversationTurn();
    } catch (error) {
      addDiagnosticLine(`Auto-send failed: ${error.message}`, "error");
      setStatus(`Auto-send error: ${error.message}`);
    }
  }, 1100);
}

async function forceSendNow() {
  if (!state.sessionId) throw new Error("Start a session first.");
  const pendingText = el.conversationInput.value.trim();
  if (!pendingText && !sendConversationTurn._busy) return;
  pendingAutoSend = true;
  if (sendConversationTurn._busy && activeTurnController) {
    activeTurnController.abort();
    setStatus("Forced current turn to stop. Sending latest text...");
    window.setTimeout(() => {
      queueAutoSend("force-send-after-abort");
    }, 180);
    return;
  }
  await sendConversationTurn();
}

setInterval(() => {
  if (!state.autoSendVoice) return;
  if (sendConversationTurn._busy) return;
  if (!state.sessionId) return;
  const pendingText = el.conversationInput.value.trim();
  if (!pendingText) return;
  queueAutoSend("heartbeat");
}, 1800);

function toggleMic() {
  state.micActive = !state.micActive;
  addDiagnosticLine(`Mic toggle requested. active=${state.micActive ? "true" : "false"}`);
  if (!micRecognition) micRecognition = initMic();
  if (!micRecognition) {
    state.micActive = false;
    return;
  }
  if (state.micActive) {
    try {
      micRecognition.start();
      el.micBtn.classList.add("mic-live");
      el.micBtn.setAttribute("aria-label", "Stop microphone");
      el.micBtn.title = "Stop microphone";
      setStatus("Mic listening.");
    } catch (error) {
      state.micActive = false;
      addDiagnosticLine(`Microphone start failed: ${error.message}`, "error");
      setStatus(`Microphone start error: ${error.message}`);
    }
  } else {
    try {
      micRecognition.stop();
    } catch (error) {
      addDiagnosticLine(`Microphone stop error: ${error.message}`, "error");
    }
    el.micBtn.classList.remove("mic-live");
    el.micBtn.setAttribute("aria-label", "Start microphone");
    el.micBtn.title = "Start microphone";
    setStatus("Mic stopped.");
  }
}

function buildPromptFromIntake() {
  const lines = [
    "Use selected narrative skills to process this story intake.",
    "",
    `Title: ${el.storyTitle.value.trim() || "(none)"}`,
    `Genre: ${el.storyGenre.value.trim() || "(none)"}`,
    `Tone: ${el.storyTone.value.trim() || "(none)"}`,
    "",
    "Concept:",
    el.storyConcept.value.trim() || "(none)",
    "",
    "Notes:",
    el.storyNotes.value.trim() || "(none)",
    "",
    "Deliverables:",
    "- If intake is rough: run Book Brain Builder behavior and produce DOSSIER/VOICE outputs.",
    "- Then run validation guidance for dossier quality.",
    "- If ready, propose next Auto Book Builder scope."
  ];
  el.userPrompt.value = lines.join("\n");
}

function buildAutoBookBuilderPrompt() {
  const title = el.storyTitle.value.trim() || "(untitled)";
  const genre = el.storyGenre.value.trim() || "(unspecified)";
  const tone = el.storyTone.value.trim() || "(unspecified)";
  const concept = el.storyConcept.value.trim() || "(none)";
  const notes = el.storyNotes.value.trim() || "(none)";
  return [
    "Initialize project from DOSSIER.md and write files in the selected workspace.",
    "Use the auto-book-builder skill to begin drafting Act I now.",
    "If dossier fields are incomplete, minimally normalize from the intake below and proceed.",
    "",
    `Title: ${title}`,
    `Genre: ${genre}`,
    `Tone: ${tone}`,
    "",
    "Concept:",
    concept,
    "",
    "Notes:",
    notes,
    "",
    "Required deliverables:",
    "1. Create/initialize project folder in workspace.",
    "2. Produce Act I outputs as markdown chapter files.",
    "3. Update continuity artifacts and build/session memory files.",
    "4. Return explicit file paths for everything created."
  ].join("\n");
}

async function loadSkills() {
  const params = new URLSearchParams({
    skillsDir: el.skillsDir.value.trim(),
    includeSystem: el.includeSystem.checked ? "1" : "0"
  });
  const res = await fetch(`/api/skills?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load skills");
  state.skills = data.skills;
  renderSkills();
  setStatus(`Loaded ${data.skills.length} skills.`);
}

async function loadModels(showSetupPrompt = false) {
  const res = await fetch("/api/models");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load models");
  const options = Array.isArray(data.options) ? data.options : [];
  el.modelPreset.innerHTML = "";
  options.forEach((m) => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    el.modelPreset.appendChild(opt);
  });
  if (data.detectedModel && !el.model.value.trim()) {
    el.model.value = data.detectedModel;
    syncModelInputs("model");
  }
  if (showSetupPrompt && !localStorage.getItem("modelSetupDone")) {
    const detected = data.detectedModel || "(none detected)";
    el.modelSetupText.textContent = `Detected Codex model from your local config: ${detected}. Use this as default?`;
    el.modelSetupModal.classList.remove("hidden");
    el.useDetectedModelBtn.onclick = () => {
      if (data.detectedModel) {
        el.model.value = data.detectedModel;
        syncModelInputs("model");
      }
      localStorage.setItem("modelSetupDone", "1");
      el.modelSetupModal.classList.add("hidden");
      setStatus(`Model set to ${el.model.value || "(empty)"}.`);
    };
    el.keepCurrentModelBtn.onclick = () => {
      localStorage.setItem("modelSetupDone", "1");
      el.modelSetupModal.classList.add("hidden");
    };
  }
}

async function loadJobs() {
  const res = await fetch("/api/jobs");
  const data = await res.json();
  state.jobs = data.jobs || [];
  renderJobs();
}

function formatOnboardingStatus(status) {
  if (!status) return "Unable to determine setup status.";
  const lines = [];
  lines.push(`Codex CLI installed: ${status.codexInstalled ? "yes" : "no"}`);
  if (status.codexVersion) lines.push(`Codex version: ${status.codexVersion}`);
  lines.push(`Codex auth detected: ${status.codexAuthDetected ? "yes" : "no"}`);
  lines.push(`Codex CLI operational: ${status.codexOperational ? "yes" : "no"}`);
  lines.push(`Skills directory found: ${status.skillsDirExists ? "yes" : "no"}`);
  lines.push(`Detected model config: ${status.detectedModel || "(none)"}`);
  if (status.lastError) lines.push(`Last check error: ${status.lastError}`);
  lines.push(status.ready ? "Status: Ready." : "Status: Setup needed.");
  return lines.join("\n");
}

async function checkOnboarding(forceShow = false, deepCheck = false) {
  const params = new URLSearchParams({
    cwd: el.cwd.value.trim() || defaults.cwd,
    deep: deepCheck ? "1" : "0"
  });
  const res = await fetch(`/api/onboarding/status?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Onboarding check failed");
  el.onboardingStatus.textContent = formatOnboardingStatus(data);
  if (data.ready) {
    localStorage.setItem(ONBOARDING_ACK_KEY, "1");
    closeOnboardingModal();
    return;
  }
  const previouslyAcknowledged = localStorage.getItem(ONBOARDING_ACK_KEY) === "1";
  if (forceShow || !previouslyAcknowledged) {
    openOnboardingModal();
  }
}

async function openJob(id) {
  const res = await fetch(`/api/jobs/${encodeURIComponent(id)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load job");
  state.selectedJobId = id;
  el.jobOutput.textContent = [
    `# ${data.id}`,
    `status=${data.status}`,
    `exitCode=${data.exitCode}`,
    `createdAt=${data.createdAt}`,
    `finishedAt=${data.finishedAt || ""}`,
    "",
    "## Command",
    data.command,
    "",
    "## Stdout",
    data.stdout || "(empty)",
    "",
    "## Stderr",
    data.stderr || "(empty)"
  ].join("\n");
}

async function runTask() {
  return runTaskWithPayload({
    userPrompt: el.userPrompt.value,
    cwd: el.cwd.value.trim(),
    model: el.model.value.trim(),
    skillIds: checkedSkillIds(),
    attachedFilePaths: state.uploadedPaths,
    skillsDir: el.skillsDir.value.trim(),
    includeSystem: el.includeSystem.checked,
    dryRun: el.dryRun.checked
  });
}

async function runTaskWithPayload(inputPayload) {
  const payload = {
    ...inputPayload,
    attachedFilePaths: Array.isArray(inputPayload?.attachedFilePaths)
      ? inputPayload.attachedFilePaths
      : state.uploadedPaths
  };
  const res = await fetch("/api/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Run failed");
  setStatus(`Started job ${data.id} (${data.status}).`);
  await loadJobs();
  await openJob(data.id);
}

async function launchAutoBookBuilder() {
  await saveStoryIntake();
  const autoPrompt = buildAutoBookBuilderPrompt();
  el.userPrompt.value = autoPrompt;
  const payload = {
    userPrompt: autoPrompt,
    cwd: el.cwd.value.trim(),
    model: el.model.value.trim(),
    skillIds: ["auto-book-builder"],
    attachedFilePaths: state.uploadedPaths,
    skillsDir: el.skillsDir.value.trim(),
    includeSystem: el.includeSystem.checked,
    dryRun: false
  };
  const originalLabel = el.launchAbbBtn.textContent;
  el.launchAbbBtn.disabled = true;
  el.launchAbbBtn.textContent = "Launching...";
  try {
    await runTaskWithPayload(payload);
    setStatus("Auto Book Builder launched.");
  } finally {
    el.launchAbbBtn.disabled = false;
    el.launchAbbBtn.textContent = originalLabel;
  }
}

async function masterSaveAll() {
  const originalLabel = el.masterSaveBtn.textContent;
  el.masterSaveBtn.disabled = true;
  el.masterSaveBtn.textContent = "Saving...";
  try {
    await saveStoryIntake();
    if (state.sessionId) {
      await exportSessionFiles("md");
      await exportSessionFiles("docx");
      setStatus("Master Save complete: intake + session exports (MD, DOCX).");
    } else {
      setStatus("Master Save complete: STORY_INTAKE.md saved (start a session to export conversation artifacts).");
    }
  } finally {
    el.masterSaveBtn.disabled = false;
    el.masterSaveBtn.textContent = originalLabel;
  }
}

async function saveStoryIntake() {
  const payload = {
    cwd: el.cwd.value.trim(),
    title: el.storyTitle.value,
    genre: el.storyGenre.value,
    tone: el.storyTone.value,
    concept: el.storyConcept.value,
    notes: el.storyNotes.value
  };
  const res = await fetch("/api/story-intake", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to save story intake");
  if (!state.uploadedPaths.includes(data.filePath)) {
    state.uploadedPaths.push(data.filePath);
    renderUploadedFiles();
  }
  setStatus(`Saved story intake: ${data.filePath}`);
}

async function uploadFiles() {
  const files = [...(el.fileInput.files || [])];
  if (!files.length) {
    setStatus("No files selected.");
    return;
  }

  const form = new FormData();
  form.append("cwd", el.cwd.value.trim());
  form.append("targetDir", el.targetDir.value.trim() || "uploads");
  files.forEach((file) => form.append("files", file, file.name));

  const res = await fetch("/api/upload", {
    method: "POST",
    body: form
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload failed");
  data.saved.forEach((p) => {
    if (!state.uploadedPaths.includes(p)) state.uploadedPaths.push(p);
  });
  (data.extractedContexts || []).forEach((ctx) => {
    const key = `${ctx.file}|${ctx.path}`;
    const exists = state.extractedContexts.some((x) => `${x.file}|${x.path}` === key);
    if (!exists) state.extractedContexts.push(ctx);
  });
  renderUploadedFiles();
  const intakeFilled = applyExtractedIntake(data.intake);
  if (intakeFilled) {
    const sourceHint =
      Array.isArray(data.intakeSources) && data.intakeSources.length
        ? ` from ${data.intakeSources.join(", ")}`
        : "";
    setStatus(`Uploaded ${data.saved.length} file(s) and auto-filled Story Intake${sourceHint}.`);
  } else {
    setStatus(`Uploaded ${data.saved.length} file(s).`);
  }
  if (Array.isArray(data.parseFailures) && data.parseFailures.length) {
    setStatus(
      `Uploaded ${data.saved.length} file(s); parse warning on ${data.parseFailures
        .map((x) => x.file)
        .join(", ")}.`
    );
  } else if (Array.isArray(data.extractedContexts) && data.extractedContexts.length) {
    setStatus(
      `Uploaded ${data.saved.length} file(s); ingested ${data.extractedContexts.length} file(s) into session context.`
    );
  }
}

async function refreshAll() {
  try {
    await loadSkills();
    await loadModels(true);
    await loadJobs();
    checkOnboarding(false, false).catch(() => {
      // Keep startup responsive even if onboarding verification fails.
    });
  } catch (error) {
    setStatus(`Error: ${error.message}`);
  }
}

el.refreshSkillsBtn.addEventListener("click", async () => {
  try {
    await loadSkills();
    await loadModels(false);
  } catch (error) {
    setStatus(`Error: ${error.message}`);
  }
});

el.onboardingRecheckBtn.addEventListener("click", async () => {
  try {
    await checkOnboarding(true, true);
    setStatus("Onboarding check completed.");
  } catch (error) {
    setStatus(`Onboarding error: ${error.message}`);
  }
});

el.onboardingDismissBtn.addEventListener("click", () => {
  localStorage.setItem(ONBOARDING_ACK_KEY, "1");
  closeOnboardingModal();
  setStatus("Onboarding dismissed.");
});

el.onboardingOpenDocsBtn.addEventListener("click", () => {
  window.open("https://github.com/openai/codex", "_blank", "noopener,noreferrer");
});

el.runBtn.addEventListener("click", async () => {
  try {
    await runTask();
  } catch (error) {
    setStatus(`Run error: ${error.message}`);
  }
});

el.buildPromptBtn.addEventListener("click", () => {
  buildPromptFromIntake();
  setStatus("Built prompt from Story Intake.");
});

el.saveIntakeBtn.addEventListener("click", async () => {
  try {
    await saveStoryIntake();
  } catch (error) {
    setStatus(`Save error: ${error.message}`);
  }
});

el.uploadBtn.addEventListener("click", async () => {
  try {
    await uploadFiles();
  } catch (error) {
    setStatus(`Upload error: ${error.message}`);
  }
});

el.startSessionBtn.addEventListener("click", async () => {
  try {
    if (hasActiveSession()) {
      openSessionResetModal();
      return;
    }
    openSessionStartModal();
  } catch (error) {
    setStatus(`Session error: ${error.message}`);
  }
});

el.launchAbbBtn.addEventListener("click", async () => {
  try {
    await launchAutoBookBuilder();
  } catch (error) {
    setStatus(`Launch error: ${error.message}`);
  }
});

el.masterSaveBtn.addEventListener("click", async () => {
  try {
    await masterSaveAll();
  } catch (error) {
    setStatus(`Master save error: ${error.message}`);
  }
});

el.sendConversationBtn.addEventListener("click", async () => {
  try {
    await sendConversationTurn();
  } catch (error) {
    setStatus(`Conversation error: ${error.message}`);
  }
});

el.forceSendBtn.addEventListener("click", async () => {
  try {
    await forceSendNow();
  } catch (error) {
    setStatus(`Force send error: ${error.message}`);
  }
});

el.evaluateBtn.addEventListener("click", async () => {
  try {
    await runEvaluation();
  } catch (error) {
    setStatus(`Evaluation error: ${error.message}`);
  }
});

el.exportSessionBtn.addEventListener("click", async () => {
  try {
    await exportSessionFiles("md");
  } catch (error) {
    setStatus(`Export error: ${error.message}`);
  }
});

el.micBtn.addEventListener("click", () => {
  toggleMic();
});

el.clearDiagnosticsBtn?.addEventListener("click", () => {
  diagnosticsLines.length = 0;
  if (el.diagnosticsOutput) {
    el.diagnosticsOutput.textContent = "No diagnostics yet.";
  }
});

el.autoSendVoice.addEventListener("change", () => {
  state.autoSendVoice = el.autoSendVoice.checked;
  if (!state.autoSendVoice) {
    window.clearTimeout(autoSendTimer);
  }
  localStorage.setItem("autoSendVoice", state.autoSendVoice ? "1" : "0");
});

el.micImageFile.addEventListener("change", () => {
  const file = el.micImageFile.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    applyMicHeroImage(String(reader.result || ""));
    setStatus("Mic hero image updated.");
  };
  reader.readAsDataURL(file);
});

el.browseSkillsDirBtn.addEventListener("click", async () => {
  try {
    await chooseDirectoryNative("skillsDir", "Choose Skills Directory");
    await loadSkills();
  } catch (error) {
    setStatus(`Picker error: ${error.message}`);
  }
});

el.browseCwdBtn.addEventListener("click", async () => {
  try {
    await chooseDirectoryNative("cwd", "Choose Workspace Directory");
    if (!el.exportDir.value.trim()) {
      el.exportDir.value = el.cwd.value.trim();
    }
  } catch (error) {
    setStatus(`Picker error: ${error.message}`);
  }
});

el.browseExportDirBtn.addEventListener("click", async () => {
  try {
    await chooseDirectoryNative("exportDir", "Choose Export Directory");
  } catch (error) {
    setStatus(`Picker error: ${error.message}`);
  }
});

el.model.addEventListener("input", () => {
  syncModelInputs("model");
});

el.modelMirror.addEventListener("input", () => {
  syncModelInputs("mirror");
});

el.applyModelPresetBtn.addEventListener("click", () => {
  if (!el.modelPreset.value) return;
  el.model.value = el.modelPreset.value;
  syncModelInputs("model");
  setStatus(`Model switched to ${el.model.value}.`);
});

el.resetCancelBtn.addEventListener("click", () => {
  closeSessionResetModal();
});

el.resetOnlyBtn.addEventListener("click", async () => {
  closeSessionResetModal();
  try {
    openSessionStartModal();
  } catch (error) {
    setStatus(`Session error: ${error.message}`);
  }
});

el.resetExportMdBtn.addEventListener("click", async () => {
  const oldSessionId = state.sessionId;
  closeSessionResetModal();
  try {
    await exportSessionFiles("md", oldSessionId);
    openSessionStartModal();
  } catch (error) {
    setStatus(`Reset/export error: ${error.message}`);
  }
});

el.resetExportDocxBtn.addEventListener("click", async () => {
  const oldSessionId = state.sessionId;
  closeSessionResetModal();
  try {
    await exportSessionFiles("docx", oldSessionId);
    openSessionStartModal();
  } catch (error) {
    setStatus(`Reset/export error: ${error.message}`);
  }
});

el.startCancelBtn.addEventListener("click", () => {
  closeSessionStartModal();
});

el.startUseCurrentBtn.addEventListener("click", async () => {
  closeSessionStartModal();
  try {
    await startSessionFlow(false);
  } catch (error) {
    setStatus(`Session error: ${error.message}`);
  }
});

el.startChooseWorkspaceBtn.addEventListener("click", async () => {
  closeSessionStartModal();
  try {
    await startSessionFlow(true);
  } catch (error) {
    setStatus(`Session error: ${error.message}`);
  }
});

el.micImageQuick.addEventListener("change", () => {
  const file = el.micImageQuick.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    applyMicHeroImage(String(reader.result || ""));
    setStatus("Mic hero image updated.");
  };
  reader.readAsDataURL(file);
});

setInterval(async () => {
  try {
    await loadJobs();
    if (state.selectedJobId) await openJob(state.selectedJobId);
  } catch {
    // Keep polling silent.
  }
}, 3000);

el.skillsDir.value = defaults.skillsDir;
el.cwd.value = defaults.cwd;
el.model.value = defaults.model;
syncModelInputs("model");
el.exportDir.value = defaults.cwd;
const savedMicImage = localStorage.getItem("micHeroImageDataUrl") || "";
if (savedMicImage) applyMicHeroImage(savedMicImage);
const savedAutoSend = localStorage.getItem("autoSendVoice") === "1";
state.autoSendVoice = savedAutoSend;
el.autoSendVoice.checked = savedAutoSend;
addDiagnosticLine("UI initialized.");
renderUploadedFiles();
refreshAll();
