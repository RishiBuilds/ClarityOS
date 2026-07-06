import { ValidationError, ProcessingError } from "./errors.js";
import { logger } from "./logger.js";
import { getPatternsByGrade, fillerPatterns } from "./patterns.js";
import {
  calculateReadabilityMetrics,
  getReadabilityDescription,
  splitSentences,
} from "./readability.js";

function normalizeWhitespace(text) {
  return text.replace(/\s+/g, " ").trim();
}

function preserveCase(replacement, match) {
  if (match.toUpperCase() === match) {
    return replacement.toUpperCase();
  }

  if (match[0] === match[0]?.toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }

  return replacement;
}

function applyReplacement(text, pattern, replacement, changes) {
  return text.replace(pattern, (match) => {
    const nextValue = preserveCase(replacement, match);
    if (match !== nextValue) {
      changes.push(`${match} -> ${nextValue}`);
    }
    return nextValue;
  });
}

function applyPatternReplacements(text, patterns, changes) {
  return patterns.reduce((currentText, { regex, replacement }) => {
    return applyReplacement(currentText, regex, replacement, changes);
  }, text);
}

function collapseRepeats(text) {
  return text
    .replace(/\b(\w+)(\s+\1\b){1,}/gi, "$1")
    .replace(/\s+,/g, ",")
    .replace(/\s+\./g, ".")
    .replace(/\s+!/g, "!")
    .replace(/\s+\?/g, "?");
}

function humanizeSentence(sentence, gradeLevel) {
  let current = sentence.trim();

  if (gradeLevel === "6") {
    const openerPatterns = [
      [/^Additionally,\s*/i, "Also, "],
      [/^Moreover,\s*/i, "Also, "],
      [/^However,\s*/i, "But, "],
      [/^Therefore,\s*/i, "So, "],
      [/^In addition,\s*/i, "Also, "],
      [/^Furthermore,\s*/i, "Also, "],
      [/^Consequently,\s*/i, "So, "],
      [/^Nevertheless,\s*/i, "Still, "],
    ];

    for (const [pattern, replacement] of openerPatterns) {
      current = current.replace(pattern, replacement);
    }
  }

  return current;
}

export function humanizeText(text, gradeLevel = "8") {
  if (!text || typeof text !== "string") {
    throw new ValidationError("Text is required and must be a string", "text");
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    throw new ValidationError("Text cannot be empty", "text");
  }

  logger.info(
    `Starting heuristic pre-pass for grade level ${gradeLevel}`,
    "Humanizer",
  );

  const changes = [];
  const beforeMetrics = calculateReadabilityMetrics(trimmed);

  const patterns = getPatternsByGrade(gradeLevel);
  let result = applyPatternReplacements(trimmed, patterns, changes);

  result = applyPatternReplacements(result, fillerPatterns, changes);

  const sentences = splitSentences(result);
  const processedSentences = sentences.map((s) =>
    humanizeSentence(s, gradeLevel),
  );
  result = processedSentences.join(" ");

  result = collapseRepeats(result);

  result = normalizeWhitespace(result);

  const afterMetrics = calculateReadabilityMetrics(result);

  logger.info(
    `Pre-pass complete. FK: ${beforeMetrics.fleschKincaidGrade} -> ${afterMetrics.fleschKincaidGrade}. Changes: ${changes.length}`,
    "Humanizer",
  );

  return {
    plainText: result,
    changes,
    metrics: {
      before: beforeMetrics,
      after: afterMetrics,
    },
  };
}
