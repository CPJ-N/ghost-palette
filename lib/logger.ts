import "server-only";

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogContext = Record<string, unknown>;

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function resolveMinLevel(): LogLevel {
  const fromEnv = process.env.LOG_LEVEL?.toLowerCase();
  if (fromEnv === "debug" || fromEnv === "info" || fromEnv === "warn" || fromEnv === "error") {
    return fromEnv;
  }
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

const MIN_LEVEL = resolveMinLevel();
const IS_PRODUCTION = process.env.NODE_ENV === "production";

export function truncate(value: string, max = 120): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}…`;
}

function serializeError(error: unknown): LogContext {
  if (error instanceof Error) {
    return {
      errorName: error.name,
      errorMessage: error.message,
      ...(IS_PRODUCTION ? {} : { errorStack: error.stack }),
    };
  }
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    return {
      ...(typeof record.code === "string" ? { errorCode: record.code } : {}),
      ...(record.message != null ? { errorMessage: String(record.message) } : {}),
      ...(record.details != null ? { errorDetails: String(record.details) } : {}),
    };
  }
  return { errorMessage: String(error) };
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_RANK[level] >= LEVEL_RANK[MIN_LEVEL];
}

function write(level: LogLevel, scope: string, message: string, context?: LogContext) {
  if (!shouldLog(level)) return;

  const entry = {
    ts: new Date().toISOString(),
    level,
    scope,
    msg: message,
    ...context,
  };

  const line = IS_PRODUCTION ? JSON.stringify(entry) : formatPretty(entry);

  switch (level) {
    case "error":
      console.error(line);
      break;
    case "warn":
      console.warn(line);
      break;
    default:
      console.log(line);
  }
}

function formatPretty(entry: Record<string, unknown>): string {
  const { ts, level, scope, msg, ...rest } = entry;
  const ctx =
    Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest)}` : "";
  return `[${String(ts)}] ${String(level).toUpperCase()} ${String(scope)} ${String(msg)}${ctx}`;
}

export type Logger = {
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, error?: unknown, context?: LogContext) => void;
  child: (context: LogContext) => Logger;
};

export function createLogger(scope: string, baseContext: LogContext = {}): Logger {
  const logWith = (level: LogLevel, message: string, context?: LogContext) => {
    write(level, scope, message, { ...baseContext, ...context });
  };

  return {
    debug: (message, context) => logWith("debug", message, context),
    info: (message, context) => logWith("info", message, context),
    warn: (message, context) => logWith("warn", message, context),
    error: (message, error, context) =>
      logWith("error", message, {
        ...context,
        ...(error !== undefined ? serializeError(error) : {}),
      }),
    child: (context) => createLogger(scope, { ...baseContext, ...context }),
  };
}

/** Root application logger — prefer scoped children in modules and routes. */
export const log = createLogger("ghost-palette");
