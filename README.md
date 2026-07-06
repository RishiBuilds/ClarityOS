# ClarityOS

**ClarityOS** is an agentic plain-language compliance tool that rewrites complex institutional text to meet Flesch-Kincaid readability standards. It is powered by a LangGraph multi-agent workflow combining Gemini 2.5 Flash and Llama-3-8B.

---

## The Problem
Institutional documents (e.g., medical forms, legal contracts, insurance policies, government notices) are frequently written in highly dense, jargon-laden, and grammatically complex language. This creates significant barriers to accessibility, making critical information hard to comprehend for the general public, patients, or policyholders. Compliance mandates (such as the US Plain Writing Act) require organizations to simplify their materials, but manual translation to plain language is slow, costly, and highly inconsistent.

## The Solution
ClarityOS automates plain-language compliance through a multi-agent auditing and rewriting loop. The solution combines:
1. **Deterministic Heuristics:** A fast pre-pass rule engine that replaces known institutional phrases (e.g., "utilize" to "use", "hypertension" to "high blood pressure") based on target readability grades.
2. **Standardized Knowledge Delivery:** A Model Context Protocol (MCP) server that exposes grade-specific plain language guidelines directly to the agent runtime.
3. **Agentic Orchestration (LangGraph):** A multi-agent network where separate LLMs handle profiling (identifying issues), paraphrasing (adapting text according to guidelines), and auditing (verifying Flesch-Kincaid score compliance and providing iteration feedback).

---

## Features

- **Multi-Agent Pipeline** — Profiler → Paraphraser → Critic loop with automatic quality gates
- **Flesch-Kincaid Scoring** — Real-time readability analysis before and after simplification
- **Three Grade Levels** — Grade 6 (Healthcare), Grade 8 (Government/Public), Grade 10 (Legal)
- **Retro Terminal Dashboard** — Cyberpunk-style browser UI with live pipeline status
- **MCP Server** — Model Context Protocol server for delivering replacement patterns via stdio JSON-RPC
- **Heuristic Pre-pass** — Deterministic word/phrase replacements applied before LLM processing

---

## Architecture

```
Browser → HTTP POST /api/humanize → LangGraph StateGraph
                                         │
                                    ┌────┴─────┐
                                    │ Profiler │  (Gemini 2.5 Flash)
                                    │ FK score │
                                    └─────┬────┘
                                          │ directive
                                    ┌─────┴──────┐
                                    │ Paraphraser│  (Llama-3-8B)
                                    │  MCP fetch │
                                    └─────┬──────┘
                                          │ draftText
                                    ┌─────┴─────┐
                                    │  Critic   │  (Gemini 2.5 Flash)
                                    │ score gate│
                                    └─────┬─────┘
                                          │
                                  ┌───────┴───────┐
                                  │ approved → END│
                                  │ rejected → loop│ (max 4×)
                                  └───────────────┘
```

The **Profiler** scores the input text and issues a simplification directive. The **Paraphraser** rewrites the text, pulling grade-specific replacement patterns from the MCP server. The **Critic** re-scores the draft and either approves it or sends it back for another pass, up to four iterations.

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

```env
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_API_KEY=your_google_api_key
HUGGINGFACEHUB_API_TOKEN=your_huggingface_token
PORT=3000
```

### 3. Start the app

```bash
npm start
```

Then open **http://localhost:3000** in your browser.

---

## API Reference

### `GET /health`

Health check endpoint.

```bash
curl http://localhost:3000/health
```

**Response**

```json
{ "ok": true, "timestamp": "2025-01-01T00:00:00.000Z" }
```

### `POST /api/humanize`

Simplifies text to a target reading level.

```bash
curl -X POST http://localhost:3000/api/humanize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "The patient is utilizing medications in order to alleviate hypertension.",
    "gradeLevel": "6"
  }'
```

**Response**

```json
{
  "result": "The patient is using medicine to ease high blood pressure.",
  "plainText": "The patient is using medicine to ease high blood pressure.",
  "readabilityScores": { "before": 14.2, "after": 5.8 },
  "gradeLevel": "6",
  "iterations": 2
}
```

**Parameters**

| Parameter    | Type   | Required | Description                                     |
| ------------ | ------ | -------- | ----------------------------------------------- |
| `text`       | string | Yes      | Text to simplify (1–10,000 characters)          |
| `gradeLevel` | string | No       | Target FK grade: `"6"`, `"8"` (default), `"10"` |

**Error Responses**

| Status | Meaning                                       |
| ------ | --------------------------------------------- |
| `400`  | Invalid input (missing text, bad grade level) |
| `500`  | Pipeline processing failure                   |

---

## MCP Server

The MCP server runs as a stdio JSON-RPC 2.0 process and exposes one tool.

```bash
node mcp-server/index.js
```

**Tool: `get_plain_language_patterns`**

| Field  | Type                                                      |
| ------ | --------------------------------------------------------- |
| Input  | `{ gradeLevel: "6" \| "8" \| "10" }`                      |
| Output | `Array<{ find: string, replace: string, flags: string }>` |

---

## Environment Variables

| Variable                   | Required | Description                                                    |
| -------------------------- | -------- | -------------------------------------------------------------- |
| `GEMINI_API_KEY`           | Yes (one) | Google Gemini API key (alternative to `GOOGLE_API_KEY`)       |
| `GOOGLE_API_KEY`           | Yes (one) | Google Gemini API key (used by the Profiler and Critic agents) |
| `HUGGINGFACEHUB_API_TOKEN` | Yes      | HuggingFace API token (used by the Paraphraser agent)          |
| `PORT`                     | No       | HTTP server port (default: `3000`)                             |

---

## Grade Levels

| Grade | Target FK | Max Avg Sentence Length | Use Case                                          |
| ----- | --------- | ----------------------- | ------------------------------------------------- |
| 6     | ≤ 6.0     | 14 words                | Healthcare, children's content                    |
| 8     | ≤ 8.0     | 18 words                | General public, government (US Plain Writing Act) |
| 10    | ≤ 10.0    | 22 words                | Legal, technical/professional                     |

---

## Project Structure

```
clarityos/
├── package.json
├── .env.example
├── README.md
├── src/
│   ├── index.js          # Entry point + env loading
│   ├── gui.js             # HTTP server + dashboard HTML
│   ├── readability.js     # FK calculator
│   ├── patterns.js        # Replacement dictionaries
│   ├── humanize.js        # Heuristic pre-pass pipeline
│   ├── errors.js          # Custom error classes
│   └── logger.js          # Stderr-only logger
├── graph/
│   └── workflow.js        # LangGraph StateGraph
├── agents/
│   ├── profiler.js        # Gemini analysis node
│   ├── paraphraser.js     # Llama-3 rewrite node + MCP
│   └── critic.js          # Gemini review + loop logic
└── mcp-server/
    └── index.js           # MCP stdio server
```

---

## License

ISC
