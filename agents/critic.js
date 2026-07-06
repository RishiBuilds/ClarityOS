import { calculateReadabilityMetrics } from "../src/readability.js";

export async function criticNode(state) {
  const { draftText, gradeLevel = "8", directive, readabilityScores } = state;

  if (!draftText) {
    throw new Error("Critic Node: state.draftText is required.");
  }

  console.error("[Critic Agent] Throttling loop: sleeping for 2000ms...");
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const metrics = calculateReadabilityMetrics(draftText);
  const afterScore = metrics.fleschKincaidGrade;

  const updatedReadabilityScores = {
    before: readabilityScores ? readabilityScores.before : null,
    after: afterScore,
  };

  console.error(
    `[Critic Agent] Computed draft Flesch-Kincaid Grade Level: ${afterScore.toFixed(2)} (Target: ${gradeLevel})`,
  );

  if (afterScore <= Number(gradeLevel)) {
    console.error(
      `[Critic Agent] Score gate passed. Readability level ${afterScore.toFixed(2)} is at or below target ${gradeLevel}. Approving.`,
    );
    return {
      status: "approved",
      directive,
      readabilityScores: updatedReadabilityScores,
    };
  }

  console.error(
    `[Critic Agent] Score gate failed (${afterScore.toFixed(2)} > ${gradeLevel}). Invoking Gemini for qualitative review...`,
  );

  const { ChatGoogleGenerativeAI } = await import("@langchain/google-genai");

  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
    temperature: 0.2,
  });

  const systemPrompt = `You are a plain language compliance reviewer.
Analyze the provided draft text to determine if it meets the plain language guidelines for Flesch-Kincaid Grade Level ${gradeLevel}.

The current FK score is ${afterScore.toFixed(1)}, but the target is ${gradeLevel}.

Provide SPECIFIC, ACTIONABLE feedback about:
1. Sentences that are still too complex or long
2. Words that should be replaced with simpler alternatives
3. Passive voice that should be converted to active
4. Any remaining jargon or technical language

Format your response as a bulleted list of specific changes needed.
Be concise and direct — the Paraphraser agent will use your feedback to revise.`;

  const humanPrompt = `Review this draft for Grade ${gradeLevel} compliance:\n\n${draftText}`;

  const response = await model.invoke([
    ["system", systemPrompt],
    ["human", humanPrompt],
  ]);

  const feedback = response.content;

  console.error(
    `[Critic Agent] Review complete. Rejecting draft — feedback injected for Paraphraser.`,
  );

  const updatedDirective = `${directive || ""}\n\n--- CRITIC FEEDBACK (Iteration) ---\nCurrent FK: ${afterScore.toFixed(1)}, Target: ${gradeLevel}\n${feedback}`;

  return {
    status: "rejected",
    directive: updatedDirective,
    readabilityScores: updatedReadabilityScores,
  };
}
