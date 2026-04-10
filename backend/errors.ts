export class BackendError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "BackendError";
    this.status = status;
    this.details = details;
  }
}

export function badRequest(message: string, details?: unknown) {
  return new BackendError(400, message, details);
}

export function unauthorized(message = "Unauthorized") {
  return new BackendError(401, message);
}

export function notFound(message: string) {
  return new BackendError(404, message);
}

export function conflict(message: string) {
  return new BackendError(409, message);
}
