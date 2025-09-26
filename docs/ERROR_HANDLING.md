# Error Handling Strategy Documentation

This document outlines the comprehensive error handling approach implemented across the Recruitment Platform, covering both user-facing error management and system error logging.

## Error Handling Philosophy

The platform follows a **graceful degradation** approach where:
- Users receive clear, actionable error messages
- System errors are logged for debugging without exposing sensitive information
- The application continues to function even when components fail
- Recovery mechanisms are provided where possible

## Error Classification System

### 1. User Errors (4xx Status Codes)

**Client-side errors that users can resolve:**

#### Validation Errors (400)
- Invalid input format
- Missing required fields  
- Data constraint violations
- Business rule violations

#### Authentication Errors (401)
- Invalid credentials
- Expired tokens
- Missing authentication

#### Authorization Errors (403)
- Insufficient permissions
- Resource access denied
- Role-based restrictions

#### Not Found Errors (404)
- Resource doesn't exist
- Invalid endpoints
- Deleted resources

#### Conflict Errors (409)
- Duplicate resources
- Concurrent modification
- State conflicts

### 2. System Errors (5xx Status Codes)

**Server-side errors requiring technical intervention:**

#### Internal Server Errors (500)
- Unhandled exceptions
- Database connection failures
- Third-party service failures
- Configuration errors

#### Rate Limiting Errors (429)
- Request rate exceeded
- Quota limitations
- DDoS protection triggers

## Error Response Architecture

### Standardized Error Format

All API errors follow this consistent structure:

```typescript
interface ErrorResponse {
  error: string;           // Human-readable message
  code: string;           // Machine-readable error code
  statusCode: number;     // HTTP status code
  details?: object;       // Additional context (validation errors)
  timestamp?: string;     // Error occurrence time
  requestId?: string;     // Request tracking ID
}
```

### Error Response Examples

#### Validation Error Response
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR", 
  "statusCode": 400,
  "details": {
    "email": ["Invalid email format"],
    "password": [
      "Password must be at least 8 characters",
      "Password must contain at least one uppercase letter"
    ]
  },
  "timestamp": "2025-01-01T12:00:00.000Z",
  "requestId": "req_abc123"
}
```

#### Authentication Error Response
```json
{
  "error": "Invalid email or password",
  "code": "AUTHENTICATION_ERROR",
  "statusCode": 401,
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

#### Rate Limiting Error Response
```json
{
  "error": "Too many requests",
  "code": "RATE_LIMIT_EXCEEDED", 
  "statusCode": 429,
  "details": {
    "retryAfter": "2025-01-01T12:15:00.000Z",
    "limit": 5,
    "remaining": 0
  }
}
```

## Server-Side Error Handling

### Custom Error Classes

```typescript
// Base API error class
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

// Specific error types
export class ValidationError extends ApiError {
  errors: Record<string, string[]>;

  constructor(errors: Record<string, string[]>) {
    super('Validation failed', 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

export class AuthenticationError extends ApiError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}
```

### Error Handling Middleware

```typescript
export function formatErrorResponse(error: any): ErrorResponse {
  // Handle custom API errors
  if (error instanceof ValidationError) {
    return {
      error: 'Validation failed',
      code: error.code,
      details: error.errors,
      statusCode: error.statusCode,
      timestamp: new Date().toISOString()
    };
  }

  if (error instanceof ApiError) {
    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
      timestamp: new Date().toISOString()
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
      statusCode: 400,
      timestamp: new Date().toISOString()
    };
  }

  // Handle MongoDB duplicate key errors
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return {
      error: `${field} already exists`,
      code: 'DUPLICATE_ERROR',
      statusCode: 409,
      timestamp: new Date().toISOString()
    };
  }

  // Generic server error (log but don't expose details)
  console.error('Unhandled error:', {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  
  return {
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    statusCode: 500,
    timestamp: new Date().toISOString()
  };
}
```

### API Route Error Handling Pattern

```typescript
// Standard error handling in API routes
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = checkRateLimit(request);
    if (!rateLimitResult.success) {
      throw new ApiError(
        'Too many requests',
        429,
        'RATE_LIMIT_EXCEEDED'
      );
    }

    // Validation
    const body = await request.json();
    const validationResult = schema.safeParse(body);
    if (!validationResult.success) {
      const errors: Record<string, string[]> = {};
      validationResult.error.errors.forEach(error => {
        const path = error.path.join('.');
        if (!errors[path]) errors[path] = [];
        errors[path].push(error.message);
      });
      throw new ValidationError(errors);
    }

    // Business logic
    const result = await processRequest(validationResult.data);
    
    return NextResponse.json({ success: true, data: result });

  } catch (error) {
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(errorResponse, { 
      status: errorResponse.statusCode 
    });
  }
}
```

## Client-Side Error Handling

### React Error Boundaries

```tsx
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Something went wrong</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                We encountered an unexpected error. Please try refreshing the page.
              </p>
              <Button 
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Refresh Page
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### API Error Handling in React Components

```tsx
// Custom hook for API error handling
export function useApiCall<T>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async (apiCall: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiCall();
      return result;
    } catch (error: any) {
      let errorMessage = 'An unexpected error occurred';
      
      if (error.response?.data) {
        const { error: apiError, details } = error.response.data;
        
        if (details) {
          // Handle validation errors
          const validationMessages = Object.values(details).flat();
          errorMessage = validationMessages.join(', ');
        } else {
          errorMessage = apiError || errorMessage;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { execute, loading, error };
}

// Usage in component
function LoginForm() {
  const { execute, loading } = useApiCall<LoginResponse>();
  const { login } = useAuth();

  const handleSubmit = async (formData: LoginData) => {
    const result = await execute(() => login(formData));
    if (result) {
      router.push('/dashboard');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <Button type="submit" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  );
}
```

### Network Error Handling

```typescript
// Enhanced fetch wrapper with retry logic
async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
  retries = 3
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.error || `HTTP ${response.status}`,
        response.status,
        errorData.code
      );
    }

    return await response.json();

  } catch (error: any) {
    clearTimeout(timeoutId);

    // Retry on network errors
    if (retries > 0 && (
      error.name === 'AbortError' ||
      error.name === 'TypeError' ||
      error.code === 'NETWORK_ERROR'
    )) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay
      return apiRequest<T>(url, options, retries - 1);
    }

    throw error;
  }
}
```

## Error Recovery Mechanisms

### Automatic Recovery Strategies

#### 1. Retry Logic for Transient Failures
```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry client errors (4xx)
      if (error.statusCode >= 400 && error.statusCode < 500) {
        throw error;
      }

      if (attempt < maxRetries) {
        await new Promise(resolve => 
          setTimeout(resolve, delay * Math.pow(2, attempt))
        );
      }
    }
  }

  throw lastError!;
}
```

#### 2. Fallback Data Mechanisms
```typescript
// Fallback to cached data when API fails
async function getUserProfile(userId: string): Promise<UserProfile> {
  try {
    const profile = await apiRequest<UserProfile>(`/api/user/${userId}`);
    localStorage.setItem(`user_${userId}`, JSON.stringify(profile));
    return profile;
  } catch (error) {
    // Fallback to cached data
    const cached = localStorage.getItem(`user_${userId}`);
    if (cached) {
      toast.info('Using cached data due to connection issues');
      return JSON.parse(cached);
    }
    throw error;
  }
}
```

#### 3. Optimistic Updates with Rollback
```typescript
function useOptimisticUpdate<T>() {
  const [data, setData] = useState<T>();
  const [originalData, setOriginalData] = useState<T>();

  const updateOptimistically = async (
    newData: T,
    apiCall: () => Promise<T>
  ) => {
    setOriginalData(data);
    setData(newData);

    try {
      const result = await apiCall();
      setData(result);
    } catch (error) {
      // Rollback on failure
      setData(originalData);
      throw error;
    }
  };

  return { data, updateOptimistically };
}
```

## User-Friendly Error Messages

### Error Message Guidelines

**Clear and Actionable:**
- Explain what went wrong
- Provide steps to resolve
- Use plain language
- Be specific when possible

**Examples of Good Error Messages:**

```typescript
const ERROR_MESSAGES = {
  // Instead of: "Validation failed"
  WEAK_PASSWORD: "Your password needs to be stronger. Please include at least 8 characters with uppercase, lowercase, and numbers.",
  
  // Instead of: "User not found"  
  INVALID_CREDENTIALS: "The email or password you entered doesn't match our records. Please double-check and try again.",
  
  // Instead of: "Server error"
  SERVICE_UNAVAILABLE: "We're experiencing high traffic right now. Please wait a moment and try again.",
  
  // Instead of: "Rate limit exceeded"
  TOO_MANY_ATTEMPTS: "Too many login attempts. Please wait 15 minutes before trying again, or reset your password."
};
```

### Contextual Error Handling

```tsx
function FormField({ 
  name, 
  error, 
  children 
}: { 
  name: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      {children}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

// Usage with specific field errors
<FormField name="email" error={errors.email}>
  <Input 
    type="email"
    placeholder="Enter your email"
    className={errors.email ? 'border-red-500' : ''}
  />
</FormField>
```

## Error Monitoring and Logging

### Structured Error Logging

```typescript
interface ErrorLog {
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  context?: {
    userId?: string;
    sessionId?: string;
    userAgent?: string;
    ip?: string;
    url?: string;
    method?: string;
  };
  metadata?: Record<string, any>;
}

function logError(error: Error, context?: Partial<ErrorLog['context']>) {
  const errorLog: ErrorLog = {
    timestamp: new Date().toISOString(),
    level: 'error',
    message: error.message,
    error: {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    },
    context,
  };

  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Send to monitoring service (e.g., Sentry, DataDog)
    monitoringService.captureException(errorLog);
  } else {
    console.error('Error logged:', errorLog);
  }
}
```

### Error Metrics and Alerting

```typescript
// Error tracking metrics
const errorMetrics = {
  // Track error rates by endpoint
  '/api/auth/login': { count: 0, rate: 0 },
  '/api/user/profile': { count: 0, rate: 0 },
  
  // Track error types
  VALIDATION_ERROR: { count: 0, rate: 0 },
  AUTHENTICATION_ERROR: { count: 0, rate: 0 },
  INTERNAL_ERROR: { count: 0, rate: 0 },
  
  // Track user impact
  affectedUsers: new Set<string>(),
  totalRequests: 0
};

function trackError(error: ApiError, context: { endpoint?: string; userId?: string }) {
  // Update endpoint metrics
  if (context.endpoint && errorMetrics[context.endpoint]) {
    errorMetrics[context.endpoint].count++;
  }
  
  // Update error type metrics
  if (error.code && errorMetrics[error.code]) {
    errorMetrics[error.code].count++;
  }
  
  // Track affected users
  if (context.userId) {
    errorMetrics.affectedUsers.add(context.userId);
  }
  
  errorMetrics.totalRequests++;
  
  // Alert if error rate exceeds threshold
  const errorRate = errorMetrics.totalRequests > 0 
    ? (errorMetrics.affectedUsers.size / errorMetrics.totalRequests) * 100 
    : 0;
    
  if (errorRate > 5) { // 5% error rate threshold
    alertingService.sendAlert({
      level: 'warning',
      message: `High error rate detected: ${errorRate.toFixed(2)}%`,
      metrics: errorMetrics
    });
  }
}
```

## Testing Error Scenarios

### Unit Tests for Error Handling

```typescript
describe('Error Handling', () => {
  describe('API Error Responses', () => {
    it('should return validation error for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'invalid-email' });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: {
          email: expect.arrayContaining(['Invalid email format'])
        }
      });
    });

    it('should handle rate limiting', async () => {
      // Make multiple requests to trigger rate limit
      const promises = Array(6).fill(null).map(() =>
        request(app).post('/api/auth/login').send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
      );

      const responses = await Promise.all(promises);
      const lastResponse = responses[responses.length - 1];

      expect(lastResponse.status).toBe(429);
      expect(lastResponse.body.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('Database Error Handling', () => {
    it('should handle duplicate email registration', async () => {
      // Create user first
      await createTestUser({ email: 'test@example.com' });

      // Attempt to create duplicate
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'ValidPass123',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(response.status).toBe(409);
      expect(response.body.code).toBe('CONFLICT');
    });
  });
});
```

This comprehensive error handling strategy ensures that users receive helpful feedback while maintaining system security and providing developers with the information needed to resolve issues efficiently.