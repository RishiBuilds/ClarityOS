export const LogLevel = {
  ERROR: "ERROR",
  WARN: "WARN",
  INFO: "INFO",
  DEBUG: "DEBUG",
};

class Logger {
  constructor(level = LogLevel.INFO) {
    this.level = level;
    this.logs = [];
    this.maxLogs = 100;
  }

  setLevel(level) {
    this.level = level;
  }

  shouldLog(level) {
    const levels = [
      LogLevel.ERROR,
      LogLevel.WARN,
      LogLevel.INFO,
      LogLevel.DEBUG,
    ];
    return levels.indexOf(level) <= levels.indexOf(this.level);
  }

  log(level, message, context, error) {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry = {
      level,
      message,
      context: context || null,
      error: error ? { message: error.message, stack: error.stack } : null,
      timestamp: new Date().toISOString(),
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    const prefix = `[${entry.timestamp}] [${level}]`;
    const contextStr = context ? ` [${context}]` : "";
    process.stderr.write(`${prefix}${contextStr} ${message}\n`);

    if (error) {
      process.stderr.write(`  Error: ${error.message}\n`);
    }
  }

  error(message, context, error) {
    this.log(LogLevel.ERROR, message, context, error);
  }

  warn(message, context) {
    this.log(LogLevel.WARN, message, context);
  }

  info(message, context) {
    this.log(LogLevel.INFO, message, context);
  }

  debug(message, context) {
    this.log(LogLevel.DEBUG, message, context);
  }

  getRecentLogs(count = 20) {
    return this.logs.slice(-count);
  }
}

export const logger = new Logger();
