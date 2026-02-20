import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { execFile, spawn } from "node:child_process";
import matter from "gray-matter";
import multer from "multer";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";

const app = express();
const PORT = Number(process.env.PORT || 8787);
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(process.cwd(), "public")));

const DEFAULT_SKILLS_DIR = "/Users/lastresort/codex/skills";
const DEFAULT_WORKSPACE = "/Volumes/New Home/Crucial Backup /Codex/Gassian-Blender-MCP";
const MAX_LOG_CHARS = 250000;
const jobs = new Map();
const sessions = new Map();
const HIDDEN_SKILLS = new Set([
  "cloudflare-deploy",
  "sora",
  "docx-publisher",
  "fiction-lightweight-editor"
]);
const TEXT_FILE_EXTENSIONS = new Set([
  ".md",
  ".txt",
  ".json",
  ".yaml",
  ".yml",
  ".csv",
  ".docx",
  ".pdf"
]);

function nowIso() {
  return new Date().toISOString();
}

async function detectConfiguredModel() {
  try {
    const home = process.env.HOME || "";
    if (!home) return "";
    const configPath = path.join(home, ".codex", "config.toml");
    const raw = await fs.readFile(configPath, "utf8");
    const match = raw.match(/^\s*model\s*=\s*"([^"]+)"/m);
    return match?.[1] || "";
  } catch {
    return "";
  }
}

function trimLog(log) {
  if (log.length <= MAX_LOG_CHARS) return log;
  return log.slice(log.length - MAX_LOG_CHARS);
}

function buildPrompt(userPrompt, selectedSkills, attachedFilePaths = []) {
  const skillNames = selectedSkills.map((s) => s.name).join(", ");
  const filesBlock =
    attachedFilePaths.length > 0
      ? ["", "Context files (read these first):", ...attachedFilePaths.map((p) => `- ${p}`)].join("\n")
      : "";
  return [
    "You are running inside a local narrative pipeline GUI.",
    "Use these installed Codex skills if applicable:",
    skillNames || "(none selected)",
    "Follow skill instructions when selected skills match the task.",
    filesBlock,
    "",
    "User task:",
    userPrompt.trim()
  ].join("\n").trim();
}

function mergeIntake(base, next) {
  return {
    title: next?.title || base.title || "",
    genre: next?.genre || base.genre || "",
    tone: next?.tone || base.tone || "",
    concept: next?.concept || base.concept || "",
    notes: next?.notes || base.notes || ""
  };
}

function summarizeMessages(messages, limit = 12) {
  return messages
    .slice(-limit)
    .map((m) => {
      const text = String(m.text || "");
      const clipped = text.length > 900 ? `${text.slice(0, 900)} ...[truncated]` : text;
      return `${m.role.toUpperCase()}: ${clipped}`;
    })
    .join("\n\n");
}

function parseJsonBlock(text) {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1]);
    } catch {
      // fall through
    }
  }
  const loose = text.match(/\{[\s\S]*\}/);
  if (loose?.[0]) {
    try {
      return JSON.parse(loose[0]);
    } catch {
      return null;
    }
  }
  return null;
}

function extractAssistantBody(text) {
  const m = String(text || "").match(/ASSISTANT:\s*([\s\S]*?)\n\s*INTAKE_JSON:/i);
  if (m?.[1]) return m[1].trim();
  return String(text || "").trim();
}

function buildBbbTurnPrompt(session, userText) {
  const filesBlock =
    Array.isArray(session.attachedFilePaths) && session.attachedFilePaths.length
      ? [
          "",
          "Attached context files (read these first if relevant):",
          ...session.attachedFilePaths.map((p) => `- ${p}`)
        ].join("\n")
      : "";
  const extractedContextBlock =
    Array.isArray(session.extractedContexts) && session.extractedContexts.length
      ? [
          "",
          "Extracted text context from uploaded files:",
          ...session.extractedContexts.map(
            (c, idx) =>
              `### Source ${idx + 1}: ${c.file}\nPath: ${c.path}\nExcerpt:\n${c.excerpt || "(empty)"}`
          )
        ].join("\n")
      : "";
  return [
    "You are the Book Brain Builder interviewer in a local fiction pipeline.",
    "Goal: ask focused follow-up questions and iteratively refine dossier intake fields.",
    "Keep assistant response concise and conversational. Ask at most 2 questions per turn.",
    "",
    "Current intake JSON:",
    JSON.stringify(session.intake, null, 2),
    filesBlock,
    extractedContextBlock,
    "",
    "Recent conversation:",
    summarizeMessages(session.messages),
    "",
    "Latest user message:",
    userText,
    "",
    "Output format (strict):",
    "ASSISTANT:",
    "<your conversational reply>",
    "INTAKE_JSON:",
    "```json",
    '{',
    '  "title": "",',
    '  "genre": "",',
    '  "tone": "",',
    '  "concept": "",',
    '  "notes": "",',
    '  "readiness": 0,',
    '  "ready_for_evaluation": false,',
    '  "missing": []',
    '}',
    "```"
  ].join("\n");
}

function buildEvaluationPrompt(session) {
  return [
    "You are the Dossier Evaluation Squad.",
    "Evaluate this fiction intake through five lenses: ATLAS, PSYCH, NOVA, TEMPO, NICHE.",
    "Return strict JSON only in a fenced json block.",
    "",
    "Intake JSON:",
    JSON.stringify(session.intake, null, 2),
    "",
    "Conversation context:",
    summarizeMessages(session.messages, 20),
    "",
    "JSON schema:",
    "{",
    '  "atlas": 0,',
    '  "psych": 0,',
    '  "nova": 0,',
    '  "tempo": 0,',
    '  "niche": 0,',
    '  "overall": 0,',
    '  "pass": false,',
    '  "verdict": "",',
    '  "must_fix": [""]',
    "}"
  ].join("\n");
}

function runCodexExec(cwd, model, prompt, timeoutMs = 120000) {
  return new Promise((resolve, reject) => {
    const args = ["exec", "--skip-git-repo-check", "-C", String(cwd)];
    if (String(model || "").trim()) {
      args.push("-m", String(model).trim());
    }
    args.push(prompt);
    const child = spawn("codex", args, { cwd: String(cwd), env: process.env });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let rejected = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      setTimeout(() => {
        if (timedOut) {
          child.kill("SIGKILL");
        }
      }, 4000);
    }, timeoutMs);

    child.stdout.on("data", (buf) => {
      stdout = trimLog(stdout + buf.toString());
    });
    child.stderr.on("data", (buf) => {
      stderr = trimLog(stderr + buf.toString());
    });
    child.on("error", (error) => {
      if (rejected) return;
      rejected = true;
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      if (rejected) return;
      rejected = true;
      clearTimeout(timer);
      if (timedOut) {
        return reject(new Error("codex request timed out"));
      }
      if (code !== 0) {
        return reject(new Error(stderr || `codex exited with code ${code}`));
      }
      return resolve({ stdout, stderr });
    });
  });
}

function chooseDirectoryMacOS(startPath = "", prompt = "Choose a folder") {
  return new Promise((resolve, reject) => {
    const safePrompt = String(prompt).replace(/"/g, '\\"');
    const cleanedStart = String(startPath || "").trim();
    const useStart = cleanedStart.length > 0;
    const script = useStart
      ? `POSIX path of (choose folder with prompt "${safePrompt}" default location (POSIX file "${cleanedStart}"))`
      : `POSIX path of (choose folder with prompt "${safePrompt}")`;
    execFile("osascript", ["-e", script], (error, stdout, stderr) => {
      if (error) {
        const msg = String(stderr || error.message || "").trim();
        if (msg.includes("-128")) {
          return resolve({ cancelled: true, path: "" });
        }
        return reject(new Error(msg || "Native directory picker failed."));
      }
      const selectedPath = String(stdout || "").trim();
      return resolve({ cancelled: false, path: selectedPath });
    });
  });
}

function isTextLikeFile(file) {
  const ext = path.extname(file.originalname || "").toLowerCase();
  if (TEXT_FILE_EXTENSIONS.has(ext)) return true;
  const mime = String(file.mimetype || "").toLowerCase();
  return (
    mime.startsWith("text/") ||
    mime.includes("json") ||
    mime.includes("wordprocessingml") ||
    mime.includes("application/pdf")
  );
}

async function readUploadText(file) {
  const ext = path.extname(file.originalname || "").toLowerCase();
  if (ext === ".docx") {
    const docx = await mammoth.extractRawText({ buffer: file.buffer });
    return String(docx.value || "");
  }
  if (ext === ".pdf") {
    const parser = new PDFParse({ data: file.buffer });
    try {
      const pdf = await parser.getText();
      return String(pdf.text || "");
    } finally {
      await parser.destroy();
    }
  }
  return file.buffer.toString("utf8");
}

function normalizeLineValue(value) {
  return String(value || "")
    .replace(/^["'`]+|["'`]+$/g, "")
    .trim();
}

function extractByRegex(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const value = normalizeLineValue(match[1]);
      if (value) return value;
    }
  }
  return "";
}

function extractSection(text, sectionNames) {
  const escaped = sectionNames.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const pattern = new RegExp(
    `(?:^|\\n)#{1,4}\\s*(?:${escaped})\\s*\\n([\\s\\S]*?)(?=\\n#{1,4}\\s+|$)`,
    "i"
  );
  const match = text.match(pattern);
  if (!match || !match[1]) return "";
  return match[1].trim();
}

function extractIntakeFromText(rawText, fileName) {
  const text = String(rawText || "");
  if (!text.trim()) return null;

  const title = extractByRegex(text, [
    /(?:^|\n)\s*[-*]\s*(?:title|working title)\s*:\s*(.+)/i,
    /(?:^|\n)\s*(?:title|working title)\s*:\s*(.+)/i,
    /^#\s+(.+)$/m
  ]);
  const genre = extractByRegex(text, [
    /(?:^|\n)\s*[-*]\s*(?:genre|subgenre)\s*:\s*(.+)/i,
    /(?:^|\n)\s*(?:genre|subgenre)\s*:\s*(.+)/i
  ]);
  const tone = extractByRegex(text, [
    /(?:^|\n)\s*[-*]\s*tone\s*:\s*(.+)/i,
    /(?:^|\n)\s*tone\s*:\s*(.+)/i
  ]);

  const concept =
    extractSection(text, ["Concept", "Premise", "Core Premise", "Logline", "Story Concept"]) ||
    extractByRegex(text, [
      /(?:^|\n)\s*[-*]\s*(?:logline|premise|concept)\s*:\s*(.+)/i,
      /(?:^|\n)\s*(?:logline|premise|concept)\s*:\s*(.+)/i
    ]);

  const notes =
    extractSection(text, [
      "Notes",
      "Story Notes",
      "Constraints",
      "Characters",
      "World Building",
      "Plot Notes"
    ]) || "";

  const fallbackExcerpt = text
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1400);
  const conceptWithFallback = concept || (fallbackExcerpt ? fallbackExcerpt.slice(0, 500) : "");
  const notesWithFallback = notes || (fallbackExcerpt ? fallbackExcerpt.slice(500) : "");

  const score =
    (/(dossier|story_intake|story intake|book brain)/i.test(fileName) ? 3 : 0) +
    (title ? 1 : 0) +
    (genre ? 1 : 0) +
    (tone ? 1 : 0) +
    (conceptWithFallback ? 2 : 0) +
    (notesWithFallback ? 1 : 0);

  if (!title && !genre && !tone && !conceptWithFallback && !notesWithFallback) return null;
  return { title, genre, tone, concept: conceptWithFallback, notes: notesWithFallback, score };
}

function mergeIntakeCandidates(candidates) {
  const sorted = [...candidates].sort((a, b) => b.score - a.score);
  const merged = { title: "", genre: "", tone: "", concept: "", notes: "" };
  for (const candidate of sorted) {
    if (!merged.title && candidate.title) merged.title = candidate.title;
    if (!merged.genre && candidate.genre) merged.genre = candidate.genre;
    if (!merged.tone && candidate.tone) merged.tone = candidate.tone;
    if (!merged.concept && candidate.concept) merged.concept = candidate.concept;
    if (!merged.notes && candidate.notes) merged.notes = candidate.notes;
  }
  return merged;
}

async function discoverSkills(skillsDir, includeSystem = false) {
  const entries = await fs.readdir(skillsDir, { withFileTypes: true });
  const dirs = entries
    .filter((e) => e.isDirectory())
    .filter((e) => includeSystem || !e.name.startsWith("."))
    .map((e) => e.name);

  const results = [];
  for (const dirName of dirs) {
    const skillFile = path.join(skillsDir, dirName, "SKILL.md");
    try {
      const raw = await fs.readFile(skillFile, "utf8");
      const parsed = matter(raw);
      const id = dirName;
      if (HIDDEN_SKILLS.has(id)) {
        continue;
      }
      results.push({
        id,
        directory: dirName,
        path: skillFile,
        name: parsed.data?.name || id,
        description: parsed.data?.description || "",
        version: parsed.data?.version || ""
      });
    } catch {
      // Ignore folders without readable SKILL.md.
    }
  }
  return results.sort((a, b) => a.name.localeCompare(b.name));
}

function getJobOr404(res, id) {
  const job = jobs.get(id);
  if (!job) {
    res.status(404).json({ error: "Job not found." });
    return null;
  }
  return job;
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: nowIso() });
});

app.get("/api/skills", async (req, res) => {
  const skillsDir = req.query.skillsDir || DEFAULT_SKILLS_DIR;
  const includeSystem = req.query.includeSystem === "1";
  try {
    const skills = await discoverSkills(String(skillsDir), includeSystem);
    res.json({ skillsDir, includeSystem, skills });
  } catch (error) {
    res.status(400).json({
      error: "Failed to read skills directory.",
      details: error.message
    });
  }
});

app.get("/api/models", async (req, res) => {
  const detectedModel = await detectConfiguredModel();
  const options = [
    detectedModel,
    "gpt-5.3-codex",
    "gpt-5-codex",
    "o3",
    "o4-mini"
  ].filter(Boolean);
  const unique = [...new Set(options)];
  res.json({ detectedModel, options: unique });
});

app.get("/api/fs/list", async (req, res) => {
  const rawPath = String(req.query.path || "/");
  const currentPath = path.resolve(rawPath);
  try {
    const stat = await fs.stat(currentPath);
    if (!stat.isDirectory()) {
      return res.status(400).json({ error: "Path is not a directory." });
    }
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    const dirs = entries
      .filter((e) => e.isDirectory())
      .map((e) => ({
        name: e.name,
        path: path.join(currentPath, e.name)
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const parent = path.dirname(currentPath);
    return res.json({
      currentPath,
      parent: parent === currentPath ? null : parent,
      directories: dirs
    });
  } catch (error) {
    return res.status(400).json({ error: "Failed to read directory.", details: error.message });
  }
});

app.post("/api/fs/choose-directory", async (req, res) => {
  const startPath = String(req.body?.startPath || "").trim();
  const prompt = String(req.body?.prompt || "Choose a folder");
  try {
    const result = await chooseDirectoryMacOS(startPath, prompt);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: "Failed to open native directory picker.", details: error.message });
  }
});

app.post("/api/session/prepare-workspace", async (req, res) => {
  const cwd = String(req.body?.cwd || "").trim();
  const skillsDir = String(req.body?.skillsDir || DEFAULT_SKILLS_DIR).trim();
  const includeSystem = Boolean(req.body?.includeSystem);
  const selectedSkillIds = Array.isArray(req.body?.selectedSkillIds)
    ? req.body.selectedSkillIds.map((x) => String(x))
    : [];
  if (!cwd) {
    return res.status(400).json({ error: "cwd is required." });
  }
  try {
    await fs.mkdir(cwd, { recursive: true });
    const folders = ["intake", "dossiers", "drafts", "exports", "uploads", "logs"];
    for (const folder of folders) {
      await fs.mkdir(path.join(cwd, folder), { recursive: true });
    }
    const availableSkills = await discoverSkills(skillsDir, includeSystem);
    const selectedSkills = availableSkills
      .filter((s) => selectedSkillIds.includes(s.id))
      .map((s) => `- ${s.id}: ${s.description || "No description"}`);
    const manifest = [
      "# Auto Book Builder Session Workspace",
      "",
      `- Created: ${nowIso()}`,
      `- Root: ${cwd}`,
      "",
      "## Folder Layout",
      "- intake/",
      "- dossiers/",
      "- drafts/",
      "- exports/",
      "- uploads/",
      "- logs/",
      "",
      "## Selected Skills",
      ...(selectedSkills.length ? selectedSkills : ["- (none selected)"]),
      ""
    ].join("\n");
    const manifestPath = path.join(cwd, "SESSION_WORKSPACE.md");
    await fs.writeFile(manifestPath, manifest, "utf8");
    return res.json({ ok: true, cwd, folders: folders.map((f) => path.join(cwd, f)), manifestPath });
  } catch (error) {
    return res.status(500).json({ error: "Failed to prepare session workspace.", details: error.message });
  }
});

app.get("/api/jobs", (req, res) => {
  const list = [...jobs.values()]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((j) => ({
      id: j.id,
      status: j.status,
      createdAt: j.createdAt,
      finishedAt: j.finishedAt,
      cwd: j.cwd,
      skills: j.skills.map((s) => s.name),
      promptPreview: j.userPrompt.slice(0, 140)
    }));
  res.json({ jobs: list });
});

app.get("/api/jobs/:id", (req, res) => {
  const job = getJobOr404(res, req.params.id);
  if (!job) return;
  res.json(job);
});

app.post("/api/run", async (req, res) => {
  const {
    userPrompt,
    cwd = DEFAULT_WORKSPACE,
    model = "",
    skillIds = [],
    skillsDir = DEFAULT_SKILLS_DIR,
    includeSystem = false,
    dryRun = false,
    attachedFilePaths = []
  } = req.body || {};

  if (!userPrompt || typeof userPrompt !== "string" || !userPrompt.trim()) {
    return res.status(400).json({ error: "userPrompt is required." });
  }

  const availableSkills = await discoverSkills(String(skillsDir), Boolean(includeSystem));
  const selectedSkills = availableSkills.filter((s) => skillIds.includes(s.id));

  const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const prompt = buildPrompt(userPrompt, selectedSkills, attachedFilePaths);
  const baseArgs = ["exec", "--skip-git-repo-check", "--json", "-C", String(cwd)];
  if (model && String(model).trim()) {
    baseArgs.push("-m", String(model).trim());
  }
  baseArgs.push(prompt);

  const job = {
    id,
    status: dryRun ? "dry_run_complete" : "running",
    createdAt: nowIso(),
    finishedAt: null,
    cwd: String(cwd),
    skillsDir: String(skillsDir),
    skills: selectedSkills,
    userPrompt,
    attachedFilePaths,
    prompt,
    command: `codex ${baseArgs.join(" ")}`,
    stdout: "",
    stderr: "",
    exitCode: null
  };
  jobs.set(id, job);

  if (dryRun) {
    job.stdout = "Dry run completed. No Codex execution was performed.";
    job.finishedAt = nowIso();
    return res.status(201).json({ id, status: job.status });
  }

  const child = spawn("codex", baseArgs, {
    cwd: String(cwd),
    env: process.env
  });

  child.stdout.on("data", (buf) => {
    job.stdout = trimLog(job.stdout + buf.toString());
  });

  child.stderr.on("data", (buf) => {
    job.stderr = trimLog(job.stderr + buf.toString());
  });

  child.on("close", (code) => {
    job.exitCode = code;
    job.status = code === 0 ? "completed" : "failed";
    job.finishedAt = nowIso();
  });

  child.on("error", (error) => {
    job.stderr = trimLog(job.stderr + `\n${error.message}`);
    job.status = "failed";
    job.exitCode = 1;
    job.finishedAt = nowIso();
  });

  return res.status(201).json({ id, status: job.status });
});

app.post("/api/story-intake", async (req, res) => {
  const { cwd = DEFAULT_WORKSPACE, title = "", genre = "", tone = "", concept = "", notes = "" } =
    req.body || {};
  const content = [
    "# Story Intake",
    "",
    `- Saved: ${nowIso()}`,
    `- Title: ${title}`,
    `- Genre: ${genre}`,
    `- Tone: ${tone}`,
    "",
    "## Concept",
    concept || "(none)",
    "",
    "## Notes",
    notes || "(none)",
    ""
  ].join("\n");
  try {
    const filePath = path.join(String(cwd), "STORY_INTAKE.md");
    await fs.writeFile(filePath, content, "utf8");
    return res.json({ ok: true, filePath });
  } catch (error) {
    return res.status(400).json({ error: "Failed to save story intake.", details: error.message });
  }
});

app.post("/api/upload", upload.array("files", 12), async (req, res) => {
  const cwd = String(req.body.cwd || DEFAULT_WORKSPACE);
  const targetDir = String(req.body.targetDir || "uploads");
  const files = req.files || [];
  if (!files.length) {
    return res.status(400).json({ error: "No files uploaded." });
  }

  try {
    const uploadDir = path.join(cwd, targetDir);
    await fs.mkdir(uploadDir, { recursive: true });
    const saved = [];
    const intakeCandidates = [];
    const intakeSources = [];
    const parseFailures = [];
    const extractedContexts = [];
    for (const file of files) {
      const safeName = path.basename(file.originalname).replace(/[^\w.\- ]/g, "_");
      const finalPath = path.join(uploadDir, safeName);
      await fs.writeFile(finalPath, file.buffer);
      saved.push(finalPath);
      if (isTextLikeFile(file)) {
        try {
          const text = await readUploadText(file);
          const excerpt = String(text || "").replace(/\s+/g, " ").trim().slice(0, 3000);
          extractedContexts.push({ file: safeName, path: finalPath, excerpt });
          const parsed = extractIntakeFromText(text, safeName);
          if (parsed) {
            intakeCandidates.push(parsed);
            intakeSources.push(safeName);
          }
        } catch (error) {
          parseFailures.push({ file: safeName, error: error.message });
          // Keep upload successful even if extraction fails for one file.
        }
      }
    }
    const intake = intakeCandidates.length ? mergeIntakeCandidates(intakeCandidates) : null;
    return res.json({ ok: true, saved, intake, intakeSources, parseFailures, extractedContexts });
  } catch (error) {
    return res.status(400).json({ error: "Upload failed.", details: error.message });
  }
});

app.post("/api/session/start", (req, res) => {
  const { cwd = DEFAULT_WORKSPACE, model = "", skillsDir = DEFAULT_SKILLS_DIR, includeSystem = false } =
    req.body || {};
  const id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const session = {
    id,
    createdAt: nowIso(),
    cwd: String(cwd),
    model: String(model || ""),
    skillsDir: String(skillsDir || DEFAULT_SKILLS_DIR),
    includeSystem: Boolean(includeSystem),
    messages: [],
    intake: { title: "", genre: "", tone: "", concept: "", notes: "" },
    readiness: 0,
    readyForEvaluation: false,
    lastEvaluation: null,
    attachedFilePaths: [],
    extractedContexts: [],
    busy: false
  };
  sessions.set(id, session);
  return res.json({ id, session });
});

app.get("/api/session/:id", (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) return res.status(404).json({ error: "Session not found." });
  return res.json({ session });
});

app.post("/api/session/:id/message", async (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) return res.status(404).json({ error: "Session not found." });
  if (session.busy) return res.status(409).json({ error: "Session is processing another turn." });

  const userText = String(req.body?.text || "").trim();
  const attachedFilePaths = Array.isArray(req.body?.attachedFilePaths)
    ? req.body.attachedFilePaths.map((p) => String(p)).filter(Boolean)
    : [];
  const extractedContexts = Array.isArray(req.body?.extractedContexts)
    ? req.body.extractedContexts
        .map((x) => ({
          file: String(x?.file || ""),
          path: String(x?.path || ""),
          excerpt: String(x?.excerpt || "").slice(0, 3000)
        }))
        .filter((x) => x.file || x.path || x.excerpt)
    : [];
  if (!userText) return res.status(400).json({ error: "text is required." });
  if (attachedFilePaths.length) {
    session.attachedFilePaths = [...new Set([...session.attachedFilePaths, ...attachedFilePaths])];
  }
  if (extractedContexts.length) {
    const seen = new Set(session.extractedContexts.map((x) => `${x.file}|${x.path}`));
    for (const ctx of extractedContexts) {
      const key = `${ctx.file}|${ctx.path}`;
      if (!seen.has(key)) {
        session.extractedContexts.push(ctx);
        seen.add(key);
      }
    }
  }

  session.busy = true;
  session.messages.push({ role: "user", text: userText, at: nowIso() });
  try {
    const prompt = buildBbbTurnPrompt(session, userText);
    const run = await runCodexExec(session.cwd, session.model, prompt, 420000);
    const assistantText = extractAssistantBody(run.stdout);
    const parsed = parseJsonBlock(run.stdout) || {};
    const nextIntake = mergeIntake(session.intake, parsed);
    const readiness = Number(parsed.readiness || session.readiness || 0);
    const readyForEvaluation = Boolean(parsed.ready_for_evaluation);

    session.intake = nextIntake;
    session.readiness = Number.isFinite(readiness) ? Math.max(0, Math.min(100, readiness)) : 0;
    session.readyForEvaluation = readyForEvaluation || session.readiness >= 80;
    session.messages.push({ role: "assistant", text: assistantText, at: nowIso() });
    return res.json({
      ok: true,
      assistant: assistantText,
      intake: session.intake,
      readiness: session.readiness,
      readyForEvaluation: session.readyForEvaluation,
      missing: Array.isArray(parsed.missing) ? parsed.missing : []
    });
  } catch (error) {
    return res.status(500).json({ error: "BBB turn failed.", details: error.message });
  } finally {
    session.busy = false;
  }
});

app.post("/api/session/:id/evaluate", async (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) return res.status(404).json({ error: "Session not found." });
  if (session.busy) return res.status(409).json({ error: "Session is processing another request." });

  session.busy = true;
  try {
    const prompt = buildEvaluationPrompt(session);
    const run = await runCodexExec(session.cwd, session.model, prompt);
    const parsed = parseJsonBlock(run.stdout);
    if (!parsed) {
      return res.status(500).json({ error: "Failed to parse evaluation output." });
    }
    session.lastEvaluation = parsed;
    session.messages.push({
      role: "assistant",
      text: `Evaluation complete. Overall ${parsed.overall}/100. Verdict: ${parsed.verdict}`,
      at: nowIso()
    });
    return res.json({ ok: true, evaluation: parsed });
  } catch (error) {
    return res.status(500).json({ error: "Evaluation failed.", details: error.message });
  } finally {
    session.busy = false;
  }
});

app.post("/api/session/:id/export", async (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) return res.status(404).json({ error: "Session not found." });

  const outputDir = String(req.body?.outputDir || session.cwd);
  const format = String(req.body?.format || "md").toLowerCase();
  try {
    await fs.mkdir(outputDir, { recursive: true });
    const intakeBase = session.intake.title
      ? session.intake.title.replace(/[^\w.\- ]/g, "_").trim().replace(/\s+/g, "_")
      : "STORY_INTAKE";

    const intakeDoc = [
      "# Story Intake",
      "",
      `- Saved: ${nowIso()}`,
      `- Title: ${session.intake.title}`,
      `- Genre: ${session.intake.genre}`,
      `- Tone: ${session.intake.tone}`,
      `- Readiness: ${session.readiness}`,
      "",
      "## Concept",
      session.intake.concept || "(none)",
      "",
      "## Notes",
      session.intake.notes || "(none)",
      ""
    ].join("\n");

    const dossierDoc = [
      "# DOSSIER DRAFT",
      "",
      `## Title\n${session.intake.title || "(none)"}`,
      "",
      `## Genre\n${session.intake.genre || "(none)"}`,
      "",
      `## Tone\n${session.intake.tone || "(none)"}`,
      "",
      `## Core Concept\n${session.intake.concept || "(none)"}`,
      "",
      `## Working Notes\n${session.intake.notes || "(none)"}`,
      "",
      session.lastEvaluation
        ? `## Evaluation Snapshot\n\`\`\`json\n${JSON.stringify(session.lastEvaluation, null, 2)}\n\`\`\`\n`
        : "## Evaluation Snapshot\n(not run)\n"
    ].join("\n");

    const transcript = [
      "# Intake Conversation",
      "",
      ...session.messages.map((m) => `## ${m.role.toUpperCase()} (${m.at})\n${m.text}\n`)
    ].join("\n");
    if (format === "docx") {
      const docxPath = path.join(outputDir, `${intakeBase}_SESSION_EXPORT.docx`);
      const toParagraphs = (text) =>
        String(text || "")
          .split(/\n+/)
          .map((line) => new Paragraph({ children: [new TextRun(line || " ")] }));
      const children = [
        new Paragraph({ text: "Story Intake", heading: HeadingLevel.HEADING_1 }),
        ...toParagraphs(
          [
            `Saved: ${nowIso()}`,
            `Title: ${session.intake.title || ""}`,
            `Genre: ${session.intake.genre || ""}`,
            `Tone: ${session.intake.tone || ""}`,
            `Readiness: ${session.readiness}`
          ].join("\n")
        ),
        new Paragraph({ text: "Concept", heading: HeadingLevel.HEADING_2 }),
        ...toParagraphs(session.intake.concept || "(none)"),
        new Paragraph({ text: "Notes", heading: HeadingLevel.HEADING_2 }),
        ...toParagraphs(session.intake.notes || "(none)"),
        new Paragraph({ text: "Dossier Draft", heading: HeadingLevel.HEADING_1 }),
        ...toParagraphs(dossierDoc),
        new Paragraph({ text: "Intake Conversation", heading: HeadingLevel.HEADING_1 }),
        ...toParagraphs(transcript)
      ];
      const doc = new Document({ sections: [{ children }] });
      const buffer = await Packer.toBuffer(doc);
      await fs.writeFile(docxPath, buffer);
      return res.json({
        ok: true,
        files: { docxPath },
        format: "docx",
        readiness: session.readiness,
        evaluation: session.lastEvaluation
      });
    }

    const intakePath = path.join(outputDir, "STORY_INTAKE.md");
    const dossierPath = path.join(outputDir, "DOSSIER_DRAFT.md");
    const conversationPath = path.join(outputDir, "INTAKE_CONVERSATION.md");
    await fs.writeFile(intakePath, intakeDoc, "utf8");
    await fs.writeFile(dossierPath, dossierDoc, "utf8");
    await fs.writeFile(conversationPath, transcript, "utf8");
    return res.json({
      ok: true,
      files: { intakePath, dossierPath, conversationPath },
      format: "md",
      readiness: session.readiness,
      evaluation: session.lastEvaluation
    });
  } catch (error) {
    return res.status(500).json({ error: "Export failed.", details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Auto Book Builder running at http://127.0.0.1:${PORT}`);
});
