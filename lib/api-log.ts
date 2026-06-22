import "server-only";

import { createLogger, truncate, type Logger } from "@/lib/logger";

type ApiLogOptions = {
  scope: string;
  userId?: string | null;
  request?: Request;
};

export function apiLogger({ scope, userId, request }: ApiLogOptions): Logger {
  const requestId = request?.headers.get("x-request-id") ?? crypto.randomUUID();

  return createLogger(scope, {
    requestId,
    ...(userId ? { userId } : {}),
  });
}

export function logUnauthorized(log: Logger, reason = "missing_session") {
  log.warn("auth.unauthorized", { reason });
}

export function logValidationError(log: Logger, reason: string, context?: Record<string, unknown>) {
  log.warn("request.invalid", { reason, ...context });
}

export function durationMs(start: number) {
  return Date.now() - start;
}

export { truncate };
