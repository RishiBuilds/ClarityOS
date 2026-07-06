import { calculateReadabilityMetrics } from "../src/readability.js";

export async function profilerNode(state) {
  const { rawText, gradeLevel = "8" } = state;

  if (!rawText) {
    throw new Error("Profiler Node: state.rawText is required.");
  }

  const metrics = calculateReadabilityMetrics(rawText);
  const beforeScore = metrics.fleschKincaidGrade;

  console.error(
    `[Profiler Agent] Computed initial Flesch-Kincaid Grade Level: ${beforeScore.toFixed(2)}`,
  );

  const { ChatGoogleGenerativeAI } = await import("@langchain/google-genai");

  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
    temperature: 0.3,
  });

  const systemPrompt = `You are a plain language compliance analyst.
Analyze the provided text and identify:
1. The approximate reading difficulty.
2. Any sentences over 25 words.
3. Passive voice constructions.
4. Jargon or technical vocabulary.
5. Nominalization patterns (verbs turned into nouns, e.g., "utilization" instead of "use", "implementation" instead of "do").

The target readability level is Flesch-Kincaid Grade Level ${gradeLevel}.
Based on this target and your analysis, produce a structured editing directive for the Paraphraser agent detailing exactly what changes need to be made.

Format your response as a structured directive with these sections:
- TARGET_GRADE: ${gradeLevel}
- CURRENT_GRADE: ${beforeScore.toFixed(1)}
- PROBLEM_PATTERNS: [list specific words/phrases to simplify]
- LONG_SENTENCES: [list sentences that need splitting]
- PASSIVE_VOICE: [list passive constructions to convert]
- VOCABULARY_TIER: [elementary/intermediate/advanced]
- SENTENCE_COMPLEXITY: [simple/compound/complex]`;

  const humanPrompt = `Analyze this text for plain language compliance:\n\n${rawText}`;

  console.error(`[Profiler Agent] Sending text to Gemini for analysis...`);

  const response = await model.invoke([
    ["system", systemPrompt],
    ["human", humanPrompt],
  ]);

  const directive = response.content;

  console.error(
    `[Profiler Agent] Directive generated. Baseline FK: ${beforeScore.toFixed(2)}, Target: ${gradeLevel}`,
  );

  return {
    directive,
    readabilityScores: {
      before: beforeScore,
      after: null,
    },
    status: "profiled",
  };
}
