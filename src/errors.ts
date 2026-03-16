/**
 * Error classes for Elephantasm SDK.
 * Maps HTTP status codes to specific exception types.
 */

/** Base exception for all Elephantasm SDK errors. */
export class ElephantasmError extends Error {
  public readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'ElephantasmError';
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Invalid or missing API key (401). */
export class AuthenticationError extends ElephantasmError {
  constructor(message = 'Invalid or missing API key') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

/** Resource not found (404). */
export class NotFoundError extends ElephantasmError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

/** Validation error (422). */
export class ValidationError extends ElephantasmError {
  constructor(message = 'Validation error') {
    super(message, 422);
    this.name = 'ValidationError';
  }
}

/** Rate limit exceeded (429). */
export class RateLimitError extends ElephantasmError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

/** Server error (5xx). */
export class ServerError extends ElephantasmError {
  constructor(message = 'Server error') {
    super(message, 500);
    this.name = 'ServerError';
  }
}
