export class ApiError extends Error {
  statusCode: number;
  code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  errors: Record<string, string[]>;

  constructor(errors: Record<string, string[]>) {
    super('Validation failed', 400, 'VALIDATION_ERROR');
    this.errors = errors;
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApiError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export function formatErrorResponse(error: any) {
  if (error instanceof ValidationError) {
    return {
      error: 'Validation failed',
      code: error.code,
      details: error.errors,
      statusCode: error.statusCode
    };
  }

  if (error instanceof ApiError) {
    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode
    };
  }

  // Handle Mongoose validation errors
  if (error.name === 'ValidationError') {
    const errors: Record<string, string[]> = {};
    Object.keys(error.errors).forEach(key => {
      errors[key] = [error.errors[key].message];
    });
    return {
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors,
      statusCode: 400
    };
  }

  // Handle MongoDB duplicate key errors
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return {
      error: `${field} already exists`,
      code: 'DUPLICATE_ERROR',
      statusCode: 409
    };
  }

  // Generic server error
  console.error('Unhandled error:', error);
  return {
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    statusCode: 500
  };
}