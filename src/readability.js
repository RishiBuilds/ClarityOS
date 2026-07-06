export function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length <= 3) {
    return 1;
  }

  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  word = word.replace(/^y/, "");

  const matches = word.match(/[aeiouy]{1,2}/g);
  const syllables = matches ? matches.length : 0;
  return Math.max(1, syllables);
}

export function splitSentences(text) {
  const pieces = text.match(/[^.!?]+[.!?]*/g);
  return pieces?.length
    ? pieces.map((piece) => piece.trim()).filter(Boolean)
    : [text];
}

export function splitWords(text) {
  return text.match(/\b[\w'-]+\b/g) || [];
}

export function calculateReadabilityMetrics(text) {
  if (!text || text.trim().length === 0) {
    return {
      wordCount: 0,
      sentenceCount: 0,
      syllableCount: 0,
      averageSentenceLength: 0,
      averageSyllablesPerWord: 0,
      fleschKincaidGrade: 0,
    };
  }

  const sentences = splitSentences(text);
  const words = splitWords(text);

  const wordCount = words.length;
  const sentenceCount = sentences.length;
  const syllableCount = words.reduce(
    (sum, word) => sum + countSyllables(word),
    0,
  );

  if (wordCount === 0) {
    return {
      wordCount: 0,
      sentenceCount,
      syllableCount: 0,
      averageSentenceLength: 0,
      averageSyllablesPerWord: 0,
      fleschKincaidGrade: 0,
    };
  }

  const averageSentenceLength =
    sentenceCount > 0 ? wordCount / sentenceCount : wordCount;
  const averageSyllablesPerWord = syllableCount / wordCount;

  const fleschKincaidGrade =
    0.39 * averageSentenceLength + 11.8 * averageSyllablesPerWord - 15.59;

  return {
    wordCount,
    sentenceCount,
    syllableCount,
    averageSentenceLength: parseFloat(averageSentenceLength.toFixed(1)),
    averageSyllablesPerWord: parseFloat(averageSyllablesPerWord.toFixed(2)),
    fleschKincaidGrade: parseFloat(fleschKincaidGrade.toFixed(1)),
  };
}

export function calculateFK(text) {
  return calculateReadabilityMetrics(text).fleschKincaidGrade;
}

export function getReadabilityDescription(grade) {
  if (grade <= 6) return "Elementary (Grade 6) — Easy for most readers";
  if (grade <= 8) return "Middle School (Grade 8) — General public level";
  if (grade <= 10) return "High School (Grade 10) — Professional level";
  if (grade <= 12) return "College Prep (Grade 12) — Advanced";
  return "College+ — Very complex text";
}
