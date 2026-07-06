import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import patterns from "../src/patterns.js";

function log(message) {
  process.stderr.write(`[MCP Server] ${message}\n`);
}

const server = new Server(
  {
    name: "clarityos-patterns-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

const GetPatternsInputSchema = z
  .object({
    gradeLevel: z.enum(["6", "8", "10"], {
      required_error: "gradeLevel parameter is required",
      invalid_type_error: "gradeLevel must be one of '6', '8', or '10'",
    }),
  })
  .strict();

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_plain_language_patterns",
        description:
          "Retrieves plain language replacement patterns for a target readability grade level, sourced from documented plain language guidelines.",
        inputSchema: {
          type: "object",
          properties: {
            gradeLevel: {
              type: "string",
              description:
                "Target Flesch-Kincaid grade level. Use 6 for healthcare and children's content, 8 for general public and government content, 10 for legal and technical professional content.",
              enum: ["6", "8", "10"],
            },
          },
          required: ["gradeLevel"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name !== "get_plain_language_patterns") {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: `Unknown tool: ${name}` }),
        },
      ],
      isError: true,
    };
  }

  const validation = GetPatternsInputSchema.safeParse(args);
  if (!validation.success) {
    log(`Validation failed: ${validation.error.message}`);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: "Invalid input",
            details: validation.error.issues,
          }),
        },
      ],
      isError: true,
    };
  }

  const { gradeLevel } = validation.data;
  log(`Fetching patterns for grade level: ${gradeLevel}`);

  const gradePatterns = patterns.getPatternsByGrade(gradeLevel);

  const serialisablePatterns = gradePatterns.map((p) => ({
    find: p.regex.source,
    replace: p.replacement,
    flags: p.regex.flags,
  }));

  log(
    `Returning ${serialisablePatterns.length} patterns for grade ${gradeLevel}`,
  );

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(serialisablePatterns),
      },
    ],
  };
});

async function main() {
  log("Starting ClarityOS MCP Pattern Server...");
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log("MCP Pattern Server running on stdio transport.");
}

main().catch((error) => {
  process.stderr.write(`[MCP Server] Fatal error: ${error.message}\n`);
  process.exit(1);
});
