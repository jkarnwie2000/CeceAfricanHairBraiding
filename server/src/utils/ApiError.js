/** Error with an HTTP status code that the error handler will forward to the client. */
export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
    this.expose = true;
  }

  static badRequest(msg = 'Bad request', details) {
    return new ApiError(400, msg, details);
  }
  static unauthorized(msg = 'Please log in to continue') {
    return new ApiError(401, msg);
  }
  static forbidden(msg = 'You do not have permission to do that') {
    return new ApiError(403, msg);
  }
  static notFound(msg = 'Not found') {
    return new ApiError(404, msg);
  }
  static conflict(msg = 'Conflict', details) {
    return new ApiError(409, msg, details);
  }
}
