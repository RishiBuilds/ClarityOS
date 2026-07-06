import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ChatHuggingFace {
  constructor({ apiKey, model }) {
    this.apiKey = apiKey;
    this.model = model;
    this.hf = null;
  }

  async init() {
    if (!this.hf) {
      const { HfInference } = await import("@huggingface/inference");
      this.hf = new HfInference(this.apiKey);
    }
  }

  async invoke(prompt, systemPrompt) {
    await this.init();

    const defaultSys =
      "You are a plain language rewriting specialist. Rewrite raw text following rule lists and directives. Output ONLY the rewritten text, with no introduction or outro.";
    const response = await this.hf.chatCompletion({
      model: this.model,
      messages: [
        { role: "system", content: systemPrompt || defaultSys },
        { role: "user", content: prompt },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    });
    return response.choices[0].message.content.trim();
  }
}

async function fetchRewritePatterns(gradeLevel = "8") {
  const mcpServerPath = path.resolve(__dirname, "../mcp-server/index.js");

  console.error(
    `[Paraphraser Agent] Connecting to MCP Server at: ${mcpServerPath} for gradeLevel: ${gradeLevel}`,
  );

  try {
    const transport = new StdioClientTransport({
      command: "node",
      args: [mcpServerPath],
    });

    const client = new Client(
      { name: "clarityos-paraphraser-client", version: "1.0.0" },
      { capabilities: {} },
    );

    await client.connect(transport);

    const result = await client.callTool({
      name: "get_plain_language_patterns",
      arguments: { gradeLevel },
    });

    await transport.close();

    if (result && result.content && result.content[0]?.text) {
      const parsed = JSON.parse(result.content[0].text);
      console.error(
        `[Paraphraser Agent] Received ${parsed.length} patterns from MCP server.`,
      );
      return parsed;
    }

    console.error("[Paraphraser Agent] MCP server returned empty patterns.");
    return [];
  } catch (error) {
    console.error(
      `[Paraphraser Agent] MCP connection failed: ${error.message}. Using empty pattern set.`,
    );
    return [];
  }
}

export async function paraphraserNode(state) {
  const { rawText, draftText, directive, gradeLevel = "8" } = state;

  const textToRewrite = draftText || rawText;

  if (!textToRewrite) {
    throw new Error("Paraphraser Node: No text to rewrite.");
  }

  console.error(`[Paraphraser Agent] Starting rewrite pass...`);

  const patterns = await fetchRewritePatterns(gradeLevel);

  let patternRules = "";
  if (patterns.length > 0) {
    patternRules =
      "\n\nAPPLY THESE SPECIFIC REPLACEMENTS:\n" +
      patterns
        .slice(0, 30)
        .map((p) => `- Replace "${p.find}" with "${p.replace}"`)
        .join("\n");
  }

  const systemPrompt = `You are a plain language rewriting specialist working for ClarityOS.

YOUR MISSION: Rewrite the given text to meet Flesch-Kincaid Grade Level ${gradeLevel}.

RULES:
1. Preserve ALL meaning — no information loss.
2. Replace complex words with simpler alternatives.
3. Break long sentences (>25 words) into shorter ones.
4. Convert passive voice to active voice where possible.
5. Remove unnecessary jargon and filler phrases.
6. Keep proper nouns, numbers, and technical terms that have no simpler equivalent.
7. Output ONLY the rewritten text. No introductions, explanations, or commentary.
${patternRules}

${directive ? `\nEDITING DIRECTIVE FROM PROFILER:\n${directive}` : ""}`;

  const userPrompt = `Rewrite this text to Grade ${gradeLevel} reading level:\n\n${textToRewrite}`;

  console.error(
    `[Paraphraser Agent] Invoking Llama-3-8B-Instruct via HuggingFace...`,
  );

  const chat = new ChatHuggingFace({
    apiKey: process.env.HUGGINGFACEHUB_API_TOKEN,
    model: "meta-llama/Meta-Llama-3-8B-Instruct",
  });

  const rewrittenText = await chat.invoke(userPrompt, systemPrompt);

  console.error(
    `[Paraphraser Agent] Rewrite complete. Output length: ${rewrittenText.length} chars.`,
  );

  return {
    draftText: rewrittenText,
    status: "paraphrased",
  };
}
