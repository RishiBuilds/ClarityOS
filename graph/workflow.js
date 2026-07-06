import { StateGraph, END, START } from "@langchain/langgraph";
import { profilerNode } from "../agents/profiler.js";
import { paraphraserNode } from "../agents/paraphraser.js";
import { criticNode } from "../agents/critic.js";

const workflowStateConfig = {
  channels: {
    rawText: null,
    directive: null,
    draftText: null,
    status: null,
    gradeLevel: null,
    readabilityScores: null,
    iterations: null,
  },
};

async function criticWithIterations(state) {
  const currentIterations = (state.iterations || 0) + 1;
  console.error(`[Workflow] Critic iteration ${currentIterations} of 4`);

  const result = await criticNode(state);

  return {
    ...result,
    iterations: currentIterations,
  };
}

function shouldContinue(state) {
  const { status, iterations = 0 } = state;

  if (status === "approved") {
    console.error(`[Workflow] Critic approved. Ending pipeline.`);
    return "end";
  }

  if (iterations >= 4) {
    console.error(
      `[Workflow] Max iterations (4) reached. Forcing pipeline end.`,
    );
    return "end";
  }

  console.error(
    `[Workflow] Critic rejected (iteration ${iterations}). Routing back to Paraphraser.`,
  );
  return "paraphraser";
}

const workflow = new StateGraph(workflowStateConfig);

workflow.addNode("profiler", profilerNode);
workflow.addNode("paraphraser", paraphraserNode);
workflow.addNode("critic", criticWithIterations);

workflow.addEdge(START, "profiler");
workflow.addEdge("profiler", "paraphraser");
workflow.addEdge("paraphraser", "critic");

workflow.addConditionalEdges("critic", shouldContinue, {
  paraphraser: "paraphraser",
  end: END,
});

export const graph = workflow.compile();
