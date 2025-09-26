# API Documentation

This document provides comprehensive documentation for the Recruitment Platform API endpoints.

## Base URL

```
http://localhost:3000/api
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Alternatively, tokens are automatically included via HTTP-only cookies for browser requests.

## Rate Limiting

- **Authentication endpoints**: 5 requests per 15 minutes
- **General API endpoints**: 100 requests per 15 minutes
- **Strict endpoints**: 3 requests per 5 minutes

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit for the time window
- `X-RateLimit-Remaining`: Remaining requests in the current window
- `X-RateLimit-Reset`: Time when the rate limit resets

## Authentication Endpoints

### Register User

**POST** `/api/auth/register`

Creates a new user account.

#### Request Body

```json
{
  "email": "john@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "candidate"
}
```

#### Request Validation

- `email`: Valid email format, required
- `password`: Minimum 8 characters, must contain uppercase, lowercase, and number
- `firstName`: 1-50 characters, required
- `lastName`: 1-50 characters, required
- `role`: Either "candidate" or "recruiter", defaults to "candidate"

#### Response (201 Created)

```json
{
  "message": "Registration successful",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "candidate",
    "createdAt": "2025-01-01T12:00:00.000Z",
    "updatedAt": "2025-01-01T12:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Error Responses

**400 Bad Request** - Validation Error
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "email": ["Invalid email format"],
    "password": ["Password must contain at least one uppercase letter"]
  },
  "statusCode": 400
}
```

**409 Conflict** - User Already Exists
```json
{
  "error": "User with this email already exists",
  "code": "CONFLICT",
  "statusCode": 409
}
```

**429 Too Many Requests** - Rate Limited
```json
{
  "error": "Too many registration attempts",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": "2025-01-01T12:15:00.000Z"
}
```

### Login User

**POST** `/api/auth/login`

Authenticates a user and returns a JWT token.

#### Request Body

```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

#### Response (200 OK)

```json
{
  "message": "Login successful",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "candidate",
    "createdAt": "2025-01-01T12:00:00.000Z",
    "updatedAt": "2025-01-01T12:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Error Responses

**401 Unauthorized** - Invalid Credentials
```json
{
  "error": "Invalid email or password",
  "code": "AUTHENTICATION_ERROR",
  "statusCode": 401
}
```

### Logout User

**POST** `/api/auth/logout`

Logs out the user by clearing the authentication cookie.

#### Response (200 OK)

```json
{
  "message": "Logout successful"
}
```

## User Endpoints

### Get User Profile

**GET** `/api/user/profile`

Retrieves the authenticated user's profile information.

#### Headers

```
Authorization: Bearer <token>
```

#### Response (200 OK)

```json
{
  "message": "Profile retrieved successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "candidate",
    "phone": "+1 (555) 123-4567",
    "bio": "Experienced software developer with 5 years in full-stack development.",
    "skills": ["JavaScript", "React", "Node.js", "MongoDB"],
    "experience": "Senior Software Developer at TechCorp (2020-2025)...",
    "createdAt": "2025-01-01T12:00:00.000Z",
    "updatedAt": "2025-01-01T12:30:00.000Z"
  }
}
```

#### Error Responses

**401 Unauthorized** - Missing or Invalid Token
```json
{
  "error": "Authentication token required",
  "code": "AUTHENTICATION_ERROR",
  "statusCode": 401
}
```

**404 Not Found** - User Not Found
```json
{
  "error": "User not found",
  "code": "NOT_FOUND",
  "statusCode": 404
}
```

### Update User Profile

**PUT** `/api/user/profile`

Updates the authenticated user's profile information.

#### Headers

```
Authorization: Bearer <token>
```

#### Request Body (All fields optional)

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1 (555) 123-4567",
  "bio": "Updated bio information",
  "skills": ["JavaScript", "React", "Node.js", "Python"],
  "experience": "Updated experience information"
}
```

#### Request Validation

- `firstName`: 1-50 characters
- `lastName`: 1-50 characters
- `phone`: Valid phone number format
- `bio`: Maximum 500 characters
- `skills`: Array of strings
- `experience`: Maximum 2000 characters

#### Response (200 OK)

```json
{
  "message": "Profile updated successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "candidate",
    "phone": "+1 (555) 123-4567",
    "bio": "Updated bio information",
    "skills": ["JavaScript", "React", "Node.js", "Python"],
    "experience": "Updated experience information",
    "createdAt": "2025-01-01T12:00:00.000Z",
    "updatedAt": "2025-01-01T13:00:00.000Z"
  }
}
```

## Error Handling

### Standard Error Response Format

All error responses follow this structure:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "statusCode": 400,
  "details": {} // Optional, for validation errors
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (resource already exists)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

### Error Codes

- `VALIDATION_ERROR` - Request validation failed
- `AUTHENTICATION_ERROR` - Authentication required or failed
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `NOT_FOUND` - Requested resource not found
- `CONFLICT` - Resource already exists
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

## Security Considerations

### Password Security
- Passwords are hashed using bcrypt with salt rounds of 12
- Minimum password requirements enforced
- Password not included in API responses

### JWT Tokens
- Tokens expire after 7 days by default
- Tokens include user ID, email, and role
- Tokens are signed with a secret key

### Rate Limiting
- Implemented to prevent abuse
- Different limits for different endpoint types
- Headers provided to inform clients of limits

### Input Validation
- All inputs validated using Zod schemas
- Mongoose schema validation at database level
- SQL injection prevention through parameterized queries

### CORS Configuration
- Configurable origin restrictions
- Proper headers for cross-origin requests
- Preflight request handling

## Examples

### Complete Registration Flow

```javascript
// 1. Register
const registerResponse = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'SecurePass123',
    firstName: 'John',
    lastName: 'Doe',
    role: 'candidate'
  })
});

const { user, token } = await registerResponse.json();

// 2. Use token for authenticated requests
const profileResponse = await fetch('/api/user/profile', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const profileData = await profileResponse.json();
```

### Error Handling Example

```javascript
try {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (!response.ok) {
    if (data.code === 'VALIDATION_ERROR') {
      // Handle validation errors
      console.log('Validation errors:', data.details);
    } else if (data.code === 'AUTHENTICATION_ERROR') {
      // Handle authentication errors
      console.log('Authentication failed:', data.error);
    } else {
      // Handle other errors
      console.log('Error:', data.error);
    }
    return;
  }

  // Success
  console.log('Login successful:', data.user);
} catch (error) {
  console.error('Network error:', error);
}
```