import http from "node:http";
import { URL } from "node:url";
import { z } from "zod";
import { logger } from "./logger.js";
import { ValidationError, ProcessingError } from "./errors.js";
import { graph } from "../graph/workflow.js";
import { calculateFK } from "./readability.js";

const HumanizeRequestSchema = z.object({
  text: z
    .string()
    .min(1, "Text is required")
    .max(10000, "Text too long (max 10,000 chars)"),
  gradeLevel: z.enum(["6", "8", "10"]).default("8"),
});

export const defaultGuiPort = parseInt(process.env.PORT || "3000", 10);

function renderPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ClarityOS — Plain Language Agent Dashboard</title>
  <meta name="description" content="ClarityOS: An agentic plain language compliance tool that rewrites complex institutional text to meet Flesch-Kincaid readability standards." />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500&display=swap" rel="stylesheet">
  <style>

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {

      --font-ui:       'IBM Plex Sans', system-ui, sans-serif;
      --font-terminal: 'IBM Plex Mono', 'Courier New', monospace;
      --fw-regular: 400;
      --fw-medium:  500;

      --text-xs:   11px;
      --text-sm:   13px;
      --text-base: 15px;
      --text-lg:   18px;
      --text-xl:   22px;
      --text-2xl:  32px;

      --bg-base:   #0d1117;
      --bg-panel:  #161b22;
      --bg-input:  #0d1117;
      --bg-raised: #1c2128;

      --border-dim:   rgba(48, 54, 61, 1);
      --border-mid:   rgba(99, 110, 123, 0.4);
      --border-focus: #58a6ff;

      --txt-primary:   #e6edf3;
      --txt-secondary: #8b949e;
      --txt-muted:     #484f58;

      --accent-green:  #3fb950;
      --accent-amber:  #d29922;
      --accent-blue:   #58a6ff;
      --accent-red:    #f85149;
      --accent-purple: #bc8cff;

      --score-before: #d29922;
      --score-after:  #3fb950;
      --score-fail:   #f85149;
    }

    html, body { height: 100%; }

    body {
      display: grid;
      grid-template-rows: 48px 1fr;
      grid-template-columns: 340px 1fr;
      grid-template-areas:
        "header  header"
        "sidebar main";
      height: 100vh;
      overflow: hidden;
      background: var(--bg-base);
      color: var(--txt-primary);
      font-family: var(--font-ui);
      font-size: var(--text-base);
      font-weight: var(--fw-regular);
      line-height: 1.6;
    }

    .app-header {
      grid-area: header;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      border-bottom: 1px solid var(--border-dim);
      background: var(--bg-panel);
    }

    .app-wordmark {
      font-family: var(--font-terminal);
      font-size: 16px;
      font-weight: var(--fw-medium);
      letter-spacing: 0.12em;
      color: var(--txt-primary);
      user-select: none;
    }

    .pipeline-status {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .pipeline-pill {
      font-family: var(--font-terminal);
      font-size: 10px;
      font-weight: var(--fw-medium);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      padding: 3px 6px;
      border-radius: 4px;
      background: var(--bg-raised);
      color: var(--txt-muted);
      transition: background 0.2s, color 0.2s;
      user-select: none;
    }

    .pipeline-pill.active {
      background: var(--accent-amber);
      color: var(--bg-base);
      animation: pulse-border 1.5s ease-in-out infinite;
    }

    .pipeline-pill.done {
      background: var(--accent-green);
      color: var(--bg-base);
    }

    .pipeline-pill.error {
      background: var(--accent-red);
      color: var(--bg-base);
    }

    .pipeline-dot {
      width: 3px;
      height: 3px;
      border-radius: 50%;
      background: var(--border-mid);
    }

    .app-sidebar {
      grid-area: sidebar;
      width: 340px;
      border-right: 1px solid var(--border-dim);
      background: var(--bg-panel);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      overflow-y: auto;
    }

    .sidebar-label {
      font-family: var(--font-terminal);
      font-size: var(--text-xs);
      font-weight: var(--fw-medium);
      color: var(--txt-secondary);
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    .doc-type-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }

    .doc-type-btn {
      height: 36px;
      border: 1px solid var(--border-dim);
      border-radius: 6px;
      background: transparent;
      color: var(--txt-secondary);
      font-family: var(--font-ui);
      font-size: var(--text-sm);
      font-weight: var(--fw-regular);
      cursor: pointer;
      transition: border-color 0.15s, color 0.15s, background 0.15s;
    }

    .doc-type-btn:hover {
      border-color: var(--accent-blue);
      color: var(--accent-blue);
    }

    .doc-type-btn.active {
      border-color: var(--accent-blue);
      color: var(--accent-blue);
      background: var(--bg-raised);
    }

    .grade-selector {
      display: flex;
      gap: 6px;
    }

    .grade-btn {
      flex: 1;
      height: 36px;
      border: 1px solid var(--border-dim);
      border-radius: 6px;
      background: transparent;
      color: var(--txt-secondary);
      font-family: var(--font-ui);
      font-size: var(--text-sm);
      font-weight: var(--fw-regular);
      cursor: pointer;
      transition: border-color 0.15s, color 0.15s, background 0.15s;
    }

    .grade-btn:hover {
      border-color: var(--accent-green);
      color: var(--accent-green);
    }

    .grade-btn.active {
      border-color: var(--accent-green);
      color: var(--accent-green);
      background: rgba(63, 185, 80, 0.12);
    }

    .input-textarea {
      width: 100%;
      height: 200px;
      resize: none;
      background: var(--bg-input);
      border: 1px solid var(--border-dim);
      border-radius: 8px;
      padding: 12px;
      font-family: var(--font-ui);
      font-size: 14px;
      font-weight: var(--fw-regular);
      color: var(--txt-primary);
      line-height: 1.7;
      outline: none;
      transition: border-color 0.15s;
    }

    .input-textarea:focus {
      border-color: var(--border-focus);
      box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.12);
    }

    .input-textarea::placeholder {
      color: var(--txt-muted);
    }

    .transmit-btn {
      width: 100%;
      height: 40px;
      border: none;
      border-radius: 8px;
      background: var(--accent-green);
      color: var(--bg-base);
      font-family: var(--font-terminal);
      font-size: var(--text-sm);
      font-weight: var(--fw-medium);
      letter-spacing: 0.08em;
      text-transform: uppercase;
      cursor: pointer;
      transition: opacity 0.15s, transform 0.1s;
    }

    .transmit-btn:hover:not(:disabled) {
      opacity: 0.88;
    }

    .transmit-btn:active:not(:disabled) {
      transform: scale(0.98);
    }

    .transmit-btn:disabled {
      cursor: not-allowed;
    }

    .transmit-btn.processing {
      background: var(--bg-raised);
      border: 1px solid var(--border-dim);
      color: var(--txt-muted);
    }

    .app-main {
      grid-area: main;
      display: grid;
      grid-template-rows: 6fr 4fr;
      overflow: hidden;
    }

    .output-panels {
      display: grid;
      grid-template-columns: 1fr 1fr;
      border-bottom: 1px solid var(--border-dim);
      overflow: hidden;
    }

    .output-panel {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .output-panel + .output-panel {
      border-left: 1px solid var(--border-dim);
    }

    .output-panel-header {
      height: 36px;
      min-height: 36px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      border-bottom: 1px solid var(--border-dim);
      background: var(--bg-panel);
    }

    .output-panel-label {
      font-family: var(--font-terminal);
      font-size: 10px;
      font-weight: var(--fw-medium);
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--txt-secondary);
    }

    .fk-badge {
      font-family: var(--font-terminal);
      font-size: var(--text-xs);
      font-weight: var(--fw-medium);
      padding: 2px 8px;
      border-radius: 4px;
      color: var(--bg-base);
    }

    .fk-badge.before {
      background: var(--score-before);
    }

    .fk-badge.after-pass {
      background: var(--score-after);
    }

    .fk-badge.after-fail {
      background: var(--score-fail);
    }

    .fk-badge.empty {
      background: var(--bg-raised);
      color: var(--txt-muted);
    }

    .output-panel-content {
      flex: 1;
      padding: 16px;
      font-family: var(--font-terminal);
      font-size: var(--text-sm);
      line-height: 1.85;
      color: var(--txt-primary);
      overflow-y: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .output-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--txt-muted);
      font-family: var(--font-terminal);
      font-size: var(--text-lg);
    }

    .score-delta-line {
      margin-top: 12px;
      padding-top: 10px;
      border-top: 1px solid var(--border-dim);
      font-family: var(--font-terminal);
      font-size: var(--text-xs);
      color: var(--txt-secondary);
    }

    .score-widget {
      display: none;
      align-items: center;
      justify-content: center;
      gap: 24px;
      padding: 12px 16px;
      background: var(--bg-panel);
      border-bottom: 1px solid var(--border-dim);
    }

    .score-widget.visible {
      display: flex;
    }

    .score-block {
      text-align: center;
    }

    .score-block-label {
      font-family: var(--font-terminal);
      font-size: var(--text-xs);
      font-weight: var(--fw-medium);
      color: var(--txt-secondary);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 2px;
    }

    .score-block-value {
      font-family: var(--font-terminal);
      font-size: var(--text-2xl);
      font-weight: var(--fw-medium);
      line-height: 1.1;
    }

    .score-block-value.before-color {
      color: var(--score-before);
    }

    .score-block-value.after-pass-color {
      color: var(--score-after);
    }

    .score-block-value.after-fail-color {
      color: var(--score-fail);
    }

    .score-arrow {
      font-family: var(--font-terminal);
      font-size: var(--text-lg);
      color: var(--txt-muted);
    }

    .score-delta-pill {
      font-family: var(--font-terminal);
      font-size: 12px;
      font-weight: var(--fw-medium);
      padding: 3px 10px;
      border-radius: 4px;
    }

    .score-delta-pill.positive {
      background: rgba(63, 185, 80, 0.15);
      color: var(--accent-green);
    }

    .score-delta-pill.negative {
      background: rgba(248, 81, 73, 0.15);
      color: var(--accent-red);
    }

    .log-pane {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: var(--bg-panel);
    }

    .log-header {
      height: 36px;
      min-height: 36px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      border-bottom: 1px solid var(--border-dim);
    }

    .log-header-label {
      font-family: var(--font-terminal);
      font-size: 10px;
      font-weight: var(--fw-medium);
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--txt-secondary);
    }

    .log-clear-btn {
      background: none;
      border: none;
      font-family: var(--font-terminal);
      font-size: var(--text-xs);
      color: var(--txt-muted);
      cursor: pointer;
      text-decoration: none;
      transition: color 0.15s;
    }

    .log-clear-btn:hover {
      color: var(--txt-secondary);
    }

    .log-body {
      flex: 1;
      overflow-y: auto;
      padding: 8px 16px;
      background: var(--bg-base);
    }

    .log-entry {
      font-family: var(--font-terminal);
      font-size: var(--text-sm);
      line-height: 1.6;
      opacity: 0;
      animation: log-appear 0.2s ease forwards;
    }

    @keyframes log-appear {
      from { opacity: 0; transform: translateX(-6px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    .log-ts {
      color: var(--txt-muted);
      font-size: var(--text-xs);
      margin-right: 4px;
    }

    .log-tag {
      font-weight: var(--fw-medium);
      margin-right: 4px;
    }

    .log-tag.profiler    { color: var(--accent-blue); }
    .log-tag.paraphraser { color: var(--accent-amber); }
    .log-tag.critic      { color: var(--accent-purple); }
    .log-tag.system      { color: var(--txt-muted); }
    .log-tag.error       { color: var(--accent-red); }

    .log-msg {
      color: var(--txt-primary);
    }

    .cursor {
      display: inline;
      font-family: var(--font-terminal);
      animation: blink 1s step-end infinite;
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50%      { opacity: 0; }
    }

    @keyframes pulse-border {
      0%, 100% { border-color: var(--accent-amber); }
      50%      { border-color: rgba(210, 153, 34, 0.3); }
    }

    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: var(--bg-base); }
    ::-webkit-scrollbar-thumb { background: var(--border-mid); border-radius: 2px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--txt-muted); }

    .sidebar-toggle {
      display: none;
      position: fixed;
      bottom: 16px;
      left: 16px;
      z-index: 100;
      width: 44px;
      height: 44px;
      border-radius: 8px;
      border: 1px solid var(--border-dim);
      background: var(--bg-panel);
      color: var(--txt-primary);
      font-family: var(--font-terminal);
      font-size: var(--text-lg);
      cursor: pointer;
      align-items: center;
      justify-content: center;
    }

    @media (max-width: 768px) {
      body {
        grid-template-columns: 1fr;
        grid-template-areas:
          "header"
          "main";
      }

      .app-sidebar {
        position: fixed;
        top: 48px;
        left: 0;
        bottom: 0;
        z-index: 50;
        transform: translateX(-100%);
        transition: transform 0.25s ease;
      }

      .app-sidebar.open {
        transform: translateX(0);
      }

      .sidebar-toggle {
        display: flex;
      }

      .output-panels {
        grid-template-columns: 1fr;
      }

      .output-panel + .output-panel {
        border-left: none;
        border-top: 1px solid var(--border-dim);
      }

      .log-pane {
        min-height: 180px;
      }

      .score-widget {
        flex-wrap: wrap;
        gap: 12px;
      }
    }
  </style>
</head>
<body>

  <header class="app-header">
    <div class="app-wordmark" style="display: flex; align-items: center; gap: 8px;">
      <span>CLARITY // OS</span>
      <span style="font-size: 9px; padding: 2px 5px; border-radius: 3px; background: rgba(63, 185, 80, 0.15); color: var(--accent-green); font-weight: normal; letter-spacing: normal; text-transform: uppercase;">Active</span>
    </div>
    <div class="pipeline-status" id="pipeline-status">
      <div class="pipeline-pill" data-step="profiler" id="step-profiler">PROFILER</div>
      <div class="pipeline-dot"></div>
      <div class="pipeline-pill" data-step="paraphraser" id="step-paraphraser">PARAPHRASER</div>
      <div class="pipeline-dot"></div>
      <div class="pipeline-pill" data-step="critic" id="step-critic">CRITIC</div>
    </div>
  </header>

  <aside class="app-sidebar" id="app-sidebar">

    <div>
      <div class="sidebar-label">Document type</div>
      <div class="doc-type-grid" id="doc-type-selector">
        <button class="doc-type-btn active" data-type="medical">Medical</button>
        <button class="doc-type-btn" data-type="legal">Legal</button>
        <button class="doc-type-btn" data-type="insurance">Insurance</button>
        <button class="doc-type-btn" data-type="government">Government</button>
      </div>
    </div>

    <div>
      <div class="sidebar-label">Target grade</div>
      <div class="grade-selector" id="grade-selector">
        <button class="grade-btn" data-grade="6">Grade 6</button>
        <button class="grade-btn active" data-grade="8">Grade 8</button>
        <button class="grade-btn" data-grade="10">Grade 10</button>
      </div>
    </div>

    <div style="flex:1;display:flex;flex-direction:column;">
      <div class="sidebar-label">Paste your text</div>
      <textarea
        id="input-text"
        class="input-textarea"
        style="flex:1;min-height:160px;"
        placeholder="Paste medical notes, legal terms, insurance text..."
      ></textarea>
    </div>

    <button class="transmit-btn" id="transmit-btn">TRANSMIT</button>
  </aside>

  <main class="app-main">

    <div class="score-widget" id="score-widget">
      <div class="score-block">
        <div class="score-block-label">Before</div>
        <div class="score-block-value before-color" id="score-big-before">--</div>
        <div style="font-family:var(--font-terminal);font-size:var(--text-xs);color:var(--txt-muted);margin-top:2px;">FK grade</div>
      </div>
      <div class="score-arrow">→</div>
      <div class="score-block">
        <div class="score-block-label">After</div>
        <div class="score-block-value after-pass-color" id="score-big-after">--</div>
        <div style="font-family:var(--font-terminal);font-size:var(--text-xs);color:var(--txt-muted);margin-top:2px;">FK grade</div>
      </div>
      <div class="score-delta-pill" id="score-delta-pill"></div>
    </div>

    <div class="output-panels">

      <div class="output-panel">
        <div class="output-panel-header">
          <span class="output-panel-label">BEFORE</span>
          <span class="fk-badge empty" id="fk-badge-before">FK --</span>
        </div>
        <div class="output-panel-content" id="output-before">
          <div class="output-empty">--</div>
        </div>
      </div>

      <div class="output-panel">
        <div class="output-panel-header">
          <span class="output-panel-label">AFTER</span>
          <span class="fk-badge empty" id="fk-badge-after">FK --</span>
        </div>
        <div class="output-panel-content" id="output-after">
          <div class="output-empty">--</div>
        </div>
      </div>
    </div>

    <div class="log-pane">
      <div class="log-header">
        <span class="log-header-label">AGENT LOG</span>
        <button class="log-clear-btn" id="log-clear-btn">clear</button>
      </div>
      <div class="log-body" id="log-body">
        <div class="log-entry">
          <span class="log-ts">\${new Date().toISOString().slice(11,19)} </span>
          <span class="log-tag system">[SYSTEM]</span>
          <span class="log-msg">ClarityOS initialized. Ready for input.</span>
          <span class="cursor">█</span>
        </div>
      </div>
    </div>
  </main>

  <button class="sidebar-toggle" id="sidebar-toggle">☰</button>

  <script>

    let selectedGrade = '8';
    let selectedDocType = 'medical';
    let isProcessing = false;
    let logCount = 1;
    let loadingDotsInterval = null;

    const inputText      = document.getElementById('input-text');
    const transmitBtn    = document.getElementById('transmit-btn');
    const outputBefore   = document.getElementById('output-before');
    const outputAfter    = document.getElementById('output-after');
    const logBody        = document.getElementById('log-body');
    const fkBadgeBefore  = document.getElementById('fk-badge-before');
    const fkBadgeAfter   = document.getElementById('fk-badge-after');
    const scoreWidget    = document.getElementById('score-widget');
    const scoreBigBefore = document.getElementById('score-big-before');
    const scoreBigAfter  = document.getElementById('score-big-after');
    const scoreDeltaPill = document.getElementById('score-delta-pill');
    const sidebarToggle  = document.getElementById('sidebar-toggle');
    const appSidebar     = document.getElementById('app-sidebar');
    const logClearBtn    = document.getElementById('log-clear-btn');

    const stepProfiler     = document.getElementById('step-profiler');
    const stepParaphraser  = document.getElementById('step-paraphraser');
    const stepCritic       = document.getElementById('step-critic');
    const pipelineSteps    = [stepProfiler, stepParaphraser, stepCritic];

    sidebarToggle.addEventListener('click', () => {
      appSidebar.classList.toggle('open');
    });

    document.getElementById('doc-type-selector').addEventListener('click', (e) => {
      const btn = e.target.closest('.doc-type-btn');
      if (!btn || isProcessing) return;
      document.querySelectorAll('.doc-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedDocType = btn.dataset.type;
      addLog('SYSTEM', 'Document type set to ' + selectedDocType);
    });

    document.getElementById('grade-selector').addEventListener('click', (e) => {
      const btn = e.target.closest('.grade-btn');
      if (!btn || isProcessing) return;
      document.querySelectorAll('.grade-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedGrade = btn.dataset.grade;
      addLog('SYSTEM', 'Target grade level set to ' + selectedGrade);
    });

    logClearBtn.addEventListener('click', () => {
      logBody.innerHTML = '';
      logCount = 0;
      addLog('SYSTEM', 'Log cleared.');
    });

    function resetSteps() {
      pipelineSteps.forEach(s => {
        s.classList.remove('active', 'done', 'error');
      });
    }

    function activateStep(name) {
      const map = { profiler: 0, paraphraser: 1, critic: 2 };
      const idx = map[name];
      if (idx === undefined) return;
      for (let i = 0; i < idx; i++) {
        pipelineSteps[i].classList.remove('active');
        pipelineSteps[i].classList.add('done');
      }
      pipelineSteps[idx].classList.remove('done');
      pipelineSteps[idx].classList.add('active');
      for (let i = idx + 1; i < pipelineSteps.length; i++) {
        pipelineSteps[i].classList.remove('active', 'done');
      }
    }

    function completeAllSteps() {
      pipelineSteps.forEach(s => {
        s.classList.remove('active');
        s.classList.add('done');
      });
    }

    function errorStep(name) {
      const map = { profiler: 0, paraphraser: 1, critic: 2 };
      const idx = map[name] ?? 2;
      pipelineSteps[idx].classList.remove('active', 'done');
      pipelineSteps[idx].classList.add('error');
    }

    function addLog(agent, message) {

      const prevCursor = logBody.querySelector('.log-entry:last-child .cursor');
      if (prevCursor) prevCursor.remove();

      const ts = new Date().toISOString().slice(11, 19);
      const agentClass = agent.toLowerCase();
      const entry = document.createElement('div');
      entry.className = 'log-entry';
      entry.innerHTML =
        '<span class="log-ts">' + ts + ' </span>' +
        '<span class="log-tag ' + agentClass + '">[' + agent + ']</span>' +
        '<span class="log-msg">' + escapeHtml(message) + '</span>';

      if (isProcessing) {
        const cur = document.createElement('span');
        cur.className = 'cursor';
        cur.textContent = '█';
        entry.appendChild(cur);
      }

      logBody.appendChild(entry);
      logBody.scrollTop = logBody.scrollHeight;
      logCount++;
    }

    function escapeHtml(text) {
      const d = document.createElement('div');
      d.textContent = text;
      return d.innerHTML;
    }

    function animateValue(el, from, to, duration, decimals) {
      const start = performance.now();
      const diff = to - from;
      function tick(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const current = from + diff * progress;
        el.textContent = current.toFixed(decimals || 1);
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }

    function typeText(el, text, speed) {
      return new Promise((resolve) => {
        el.textContent = '';
        let i = 0;
        function next() {
          if (i < text.length) {
            el.textContent += text[i];
            i++;
            setTimeout(next, speed || 8);
          } else {
            resolve();
          }
        }
        next();
      });
    }

    function showScores(before, after, target) {
      const tgt = Number(target);

      if (before !== null && before !== undefined) {
        fkBadgeBefore.textContent = 'FK ' + before.toFixed(1);
        fkBadgeBefore.className = 'fk-badge before';
      }
      if (after !== null && after !== undefined) {
        fkBadgeAfter.textContent = 'FK ' + after.toFixed(1);
        fkBadgeAfter.className = after <= tgt ? 'fk-badge after-pass' : 'fk-badge after-fail';
      }

      scoreWidget.classList.add('visible');
      animateValue(scoreBigBefore, 0, before, 600, 1);
      animateValue(scoreBigAfter, before, after, 600, 1);

      scoreBigAfter.className = after <= tgt
        ? 'score-block-value after-pass-color'
        : 'score-block-value after-fail-color';

      if (before !== null && after !== null) {
        const delta = before - after;
        if (after <= tgt) {
          scoreDeltaPill.className = 'score-delta-pill positive';
          scoreDeltaPill.textContent = '↓ ' + delta.toFixed(1) + ' grades';
        } else {
          scoreDeltaPill.className = 'score-delta-pill negative';
          scoreDeltaPill.textContent = '↑ still above target';
        }
      }
    }

    function startLoadingDots() {
      let dots = 0;
      loadingDotsInterval = setInterval(() => {
        dots = (dots + 1) % 4;
        transmitBtn.textContent = 'PROCESSING' + '.'.repeat(dots);
      }, 500);
    }

    function stopLoadingDots() {
      if (loadingDotsInterval) {
        clearInterval(loadingDotsInterval);
        loadingDotsInterval = null;
      }
    }

    transmitBtn.addEventListener('click', async () => {
      const text = inputText.value.trim();
      if (!text) {
        addLog('SYSTEM', 'Error: No input text provided.');
        return;
      }
      if (isProcessing) return;

      isProcessing = true;
      transmitBtn.disabled = true;
      transmitBtn.classList.add('processing');
      startLoadingDots();
      resetSteps();

      outputBefore.textContent = text;
      outputAfter.innerHTML = '<span class="cursor">█</span>';

      fkBadgeBefore.textContent = 'FK --';
      fkBadgeBefore.className = 'fk-badge empty';
      fkBadgeAfter.textContent = 'FK --';
      fkBadgeAfter.className = 'fk-badge empty';
      scoreWidget.classList.remove('visible');

      addLog('SYSTEM', 'Transmission initiated. Grade level: ' + selectedGrade + ', Doc type: ' + selectedDocType);

      activateStep('profiler');
      addLog('PROFILER', 'Computing baseline Flesch-Kincaid grade...');

      try {
        const response = await fetch('/api/humanize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, gradeLevel: selectedGrade }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(err.error || 'Server error: ' + response.status);
        }

        const data = await response.json();

        if (data.readabilityScores) {
          addLog('PROFILER', 'Baseline grade: ' + (data.readabilityScores.before?.toFixed(1) || '?'));
          activateStep('paraphraser');
          addLog('PARAPHRASER', 'Rewriting text to Grade ' + selectedGrade + '...');
        }

        if (data.iterations > 1) {
          for (let i = 1; i < data.iterations; i++) {
            addLog('CRITIC', 'Iteration ' + i + ' — reviewing draft...');
            addLog('CRITIC', 'Rejected — feedback injected for Paraphraser');
            addLog('PARAPHRASER', 'Pass ' + (i + 1) + ' complete');
          }
          activateStep('critic');
        } else {
          activateStep('critic');
        }

        addLog('CRITIC', 'Final FK grade: ' + (data.readabilityScores?.after?.toFixed(1) || '?'));

        if (data.readabilityScores?.after <= Number(selectedGrade)) {
          addLog('CRITIC', 'Approved ✓');
        } else {
          addLog('CRITIC', 'Forced approval (max iterations reached)');
        }

        const resultText = data.plainText || data.result || '[No output]';
        await typeText(outputAfter, resultText, 8);

        if (data.readabilityScores?.before != null && data.readabilityScores?.after != null) {
          const b = data.readabilityScores.before;
          const a = data.readabilityScores.after;
          const pct = ((b - a) / b * 100).toFixed(0);
          const deltaLine = document.createElement('div');
          deltaLine.className = 'score-delta-line';
          deltaLine.textContent = 'Grade ' + b.toFixed(1) + ' → ' + a.toFixed(1) + ' (reduced by ' + pct + '%)';
          outputAfter.appendChild(deltaLine);
        }

        showScores(
          data.readabilityScores?.before,
          data.readabilityScores?.after,
          selectedGrade
        );

        addLog('SYSTEM', 'Transmission complete ✓');
        completeAllSteps();

      } catch (err) {
        addLog('ERROR', err.message);
        outputAfter.textContent = '[ Error: ' + err.message + ' ]';
        errorStep('critic');
      } finally {
        isProcessing = false;

        const lastCursor = logBody.querySelector('.log-entry:last-child .cursor');
        if (lastCursor) lastCursor.remove();

        transmitBtn.disabled = false;
        transmitBtn.classList.remove('processing');
        stopLoadingDots();
        transmitBtn.textContent = 'TRANSMIT';
      }
    });

    inputText.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        transmitBtn.click();
      }
    });
  </script>
</body>
</html>`;
}

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(data));
}

function sendHTML(res, html) {
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-cache",
  });
  res.end(html);
}

async function handleHumanize(req, res) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
  }

  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    return sendJSON(res, 400, { error: "Invalid JSON body" });
  }

  const validation = HumanizeRequestSchema.safeParse(parsed);
  if (!validation.success) {
    return sendJSON(res, 400, {
      error: "Validation failed",
      details: validation.error.issues,
    });
  }

  const { text, gradeLevel } = validation.data;

  logger.info(
    `Processing /api/humanize — ${text.length} chars, grade ${gradeLevel}`,
    "GUI",
  );

  try {
    const beforeFK = calculateFK(text);

    const result = await graph.invoke({
      rawText: text,
      gradeLevel,
      draftText: null,
      directive: null,
      status: null,
      readabilityScores: { before: beforeFK, after: null },
      iterations: 0,
    });

    const afterFK =
      result.readabilityScores?.after ?? calculateFK(result.draftText || text);

    const response = {
      result: result.draftText || text,
      plainText: result.draftText || text,
      readabilityScores: {
        before: parseFloat(beforeFK.toFixed(1)),
        after: parseFloat(afterFK.toFixed(1)),
      },
      gradeLevel,
      iterations: result.iterations || 1,
    };

    logger.info(
      `Pipeline complete. FK: ${response.readabilityScores.before} → ${response.readabilityScores.after}`,
      "GUI",
    );

    return sendJSON(res, 200, response);
  } catch (error) {
    logger.error(`Pipeline failed: ${error.message}`, "GUI", error);
    return sendJSON(res, 500, {
      error: "Pipeline processing failed",
      message: error.message,
    });
  }
}

export function startGuiServer(port = defaultGuiPort) {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${port}`);
    const pathname = url.pathname;

    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
      return res.end();
    }

    if (req.method === "GET" && pathname === "/") {
      return sendHTML(res, renderPage());
    }

    if (req.method === "GET" && pathname === "/health") {
      return sendJSON(res, 200, {
        ok: true,
        timestamp: new Date().toISOString(),
      });
    }

    if (req.method === "POST" && pathname === "/api/humanize") {
      return handleHumanize(req, res);
    }

    sendJSON(res, 404, { error: "Not found" });
  });

  server.listen(port, () => {
    logger.info(
      `ClarityOS dashboard running at http://localhost:${port}`,
      "GUI",
    );
  });

  return server;
}
