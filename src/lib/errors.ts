/** Errors safe to surface to the client. Anything else becomes a generic message. */
export class AppError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(what = "Resource") {
    super("NOT_FOUND", `${what} not found`);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have access to this") {
    super("FORBIDDEN", message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super("VALIDATION", message);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string) {
    super("RATE_LIMIT", message);
  }
}
