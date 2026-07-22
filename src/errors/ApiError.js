export class ApiError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

export class NotFoundError extends ApiError {
  constructor(entity = "Data") {
    super(`${entity} tidak ditemukan`, 404);
  }
}

export class ValidationError extends ApiError {
  constructor(errors = []) {
    super("Validasi gagal", 422);
    this.errors = errors;
  }
}

export class ConflictError extends ApiError {
  constructor(message = "Data sudah ada") {
    super(message, 409);
  }
}
