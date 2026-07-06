export class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.field = field;
    this.name = "ValidationError";
  }
}

export class ProcessingError extends Error {
  constructor(message, originalText) {
    super(message);
    this.originalText = originalText;
    this.name = "ProcessingError";
  }
}
