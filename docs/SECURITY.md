# Security Documentation

This document outlines the comprehensive security measures implemented in the Recruitment Platform to protect user data, prevent attacks, and ensure system integrity.

## Security Overview

The platform implements a defense-in-depth security strategy with multiple layers of protection:

1. **Authentication & Authorization**
2. **Input Validation & Sanitization**  
3. **Data Protection & Encryption**
4. **Rate Limiting & DDoS Protection**
5. **Secure Communications**
6. **Error Handling & Information Disclosure Prevention**

## Authentication System

### JWT (JSON Web Token) Implementation

**Token Structure:**
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "user@example.com", 
    "role": "candidate",
    "iat": 1640995200,
    "exp": 1641600000
  }
}
```

**Security Features:**
- **Strong Secret Key**: Minimum 256-bit secret for HMAC-SHA256
- **Token Expiration**: Default 7-day expiration with configurable duration
- **Payload Validation**: Verify token structure and required claims
- **Signature Verification**: Prevent token tampering

**Implementation:**
```typescript
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null; // Invalid or expired token
  }
}
```

### Session Management

**Cookie Security:**
- **HTTP-Only**: Prevents XSS access to tokens
- **Secure Flag**: HTTPS-only transmission in production
- **SameSite Policy**: CSRF protection
- **Path Restriction**: Limited to application paths

```typescript
response.cookies.set('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/'
});
```

**Token Storage Strategy:**
- **Browser**: HTTP-only cookies (primary)
- **API Clients**: Bearer token in Authorization header
- **Mobile Apps**: Secure storage mechanisms

## Password Security

### Hashing Strategy

**bcrypt Implementation:**
```typescript
// Registration/Password Update
const saltRounds = 12; // High security level
const hashedPassword = await bcrypt.hash(password, saltRounds);

// Authentication
const isValid = await bcrypt.compare(candidatePassword, hashedPassword);
```

**Security Features:**
- **Salt Rounds**: 12 rounds (recommended for 2025+)
- **Unique Salt**: Each password gets unique salt
- **Time-Constant Comparison**: Prevents timing attacks
- **Memory-Hard Function**: Resistant to GPU/ASIC attacks

### Password Policy

**Strength Requirements:**
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)  
- At least one numeric digit (0-9)
- Optional: Special characters for enhanced security

**Validation Implementation:**
```typescript
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain uppercase, lowercase, and number'
  );
```

**Security Considerations:**
- No password storage in plain text
- No password transmission in URLs
- No password logging or caching
- Secure password reset mechanisms

## Input Validation & Sanitization

### Multi-Layer Validation

**1. Client-Side Validation:**
- Immediate user feedback
- Reduced server load
- Enhanced user experience
- **Note**: Not relied upon for security

**2. API Layer Validation (Zod):**
```typescript
const registerSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(1, 'Email is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
      'Password must contain uppercase, lowercase, and number'),
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name too long')
    .trim(),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name too long')
    .trim()
});
```

**3. Database Layer Validation (Mongoose):**
```typescript
const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    match: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
    lowercase: true,
    trim: true
  }
});
```

### Sanitization Measures

**Data Sanitization:**
- Email normalization (lowercase, trim)
- HTML entity encoding for text fields
- Special character filtering where appropriate
- Length limits on all text inputs

**NoSQL Injection Prevention:**
- Type validation on all inputs
- Mongoose schema enforcement  
- Query parameterization
- Input sanitization middleware

## Rate Limiting & DDoS Protection

### Rate Limiting Implementation

**Custom Rate Limiter:**
```typescript
class RateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>();
  
  check(identifier: string, limit: number, windowMs: number): RateLimitResult {
    // Implementation details...
    return {
      success: count <= limit,
      limit,
      remaining: Math.max(0, limit - count),
      reset: new Date(resetTime)
    };
  }
}
```

**Rate Limit Policies:**
```typescript
export const RATE_LIMITS = {
  AUTH: { limit: 5, windowMs: 15 * 60 * 1000 },    // 5 per 15 minutes
  API: { limit: 100, windowMs: 15 * 60 * 1000 },   // 100 per 15 minutes  
  STRICT: { limit: 3, windowMs: 5 * 60 * 1000 }    // 3 per 5 minutes
};
```

**Rate Limiting Strategy:**
- **IP-based limiting**: Prevent single-source abuse
- **User-based limiting**: Authenticated request limits
- **Endpoint-specific limits**: Sensitive operations
- **Progressive penalties**: Increased restrictions for violations

### DDoS Protection Measures

**Application-Level Protection:**
- Request rate limiting per IP
- Connection throttling
- Request size limits
- Timeout configurations

**Infrastructure Protection:**
- CDN-based DDoS mitigation
- Load balancer configuration
- Auto-scaling policies
- Health monitoring

## Data Protection & Encryption

### Encryption in Transit

**HTTPS Configuration:**
- TLS 1.2+ requirement
- Strong cipher suites
- Perfect forward secrecy
- HSTS headers

**API Security Headers:**
```typescript
// Security headers middleware
response.headers.set('X-Content-Type-Options', 'nosniff');
response.headers.set('X-Frame-Options', 'DENY');
response.headers.set('X-XSS-Protection', '1; mode=block');
response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
```

### Encryption at Rest

**Database Security:**
- MongoDB encryption at rest
- Encrypted database connections
- Secure backup encryption
- Key management systems

**Sensitive Data Handling:**
- Password hashing (never plain text)
- PII data protection
- Secure configuration storage
- Environment variable encryption

### Data Privacy Compliance

**GDPR Considerations:**
- Data minimization principles
- Consent management
- Right to deletion (user account removal)
- Data portability (export functionality)
- Privacy by design

**Data Retention:**
- Configurable retention policies  
- Automatic data purging
- Audit trail maintenance
- Compliance reporting

## Secure Communications

### CORS Configuration

**Cross-Origin Resource Sharing:**
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGINS || "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true"
};
```

**Security Features:**
- Origin whitelist configuration
- Credential inclusion control
- Method restriction
- Header validation

### API Security

**Request Validation:**
- Content-Type verification
- Request size limits
- Method validation
- Header sanitization

**Response Security:**
- Information disclosure prevention
- Error message sanitization
- Debug information filtering
- Consistent response formats

## Error Handling & Security

### Secure Error Handling

**Error Information Disclosure Prevention:**
```typescript
export function formatErrorResponse(error: any) {
  // Never expose sensitive information
  if (error instanceof ApiError) {
    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode
    };
  }
  
  // Generic response for unknown errors
  console.error('Unhandled error:', error); // Log internally
  return {
    error: 'Internal server error',
    code: 'INTERNAL_ERROR', 
    statusCode: 500
  };
}
```

**Security Logging:**
- Failed authentication attempts
- Rate limit violations
- Suspicious activity patterns
- Security event correlation

### Error Response Strategy

**Safe Error Messages:**
- No stack traces in production
- No internal paths or configuration
- No database schema information  
- Consistent error formats

**Security Event Logging:**
```typescript
// Security event structure
{
  timestamp: "2025-01-01T12:00:00.000Z",
  event: "authentication_failure",
  severity: "warning",
  source_ip: "192.168.1.100",
  user_agent: "Mozilla/5.0...",
  attempted_email: "user@example.com",
  reason: "invalid_password"
}
```

## Security Monitoring & Incident Response

### Real-time Monitoring

**Security Metrics:**
- Authentication failure rates
- Rate limit violations
- Unusual access patterns
- Error rate spikes

**Alerting Thresholds:**
- Multiple failed login attempts
- Rate limit violations
- Unusual geographic access
- System error increases

### Incident Response Plan

**Detection Phase:**
1. Automated monitoring alerts
2. Log analysis and correlation  
3. User reports and feedback
4. Security scan results

**Response Phase:**
1. Incident classification
2. Immediate containment
3. Investigation and analysis
4. Communication plan
5. Recovery procedures

**Recovery Phase:**
1. System restoration
2. Security patch deployment
3. Monitoring enhancement
4. Post-incident review

## Security Testing & Validation

### Vulnerability Assessment

**Regular Security Testing:**
- Automated vulnerability scans
- Dependency security audits
- Code security reviews
- Penetration testing

**Testing Tools & Methods:**
- Static Application Security Testing (SAST)
- Dynamic Application Security Testing (DAST)  
- Interactive Application Security Testing (IAST)
- Software Composition Analysis (SCA)

### Security Validation

**Authentication Testing:**
```typescript
// Example security test
describe('Authentication Security', () => {
  it('should reject weak passwords', async () => {
    const weakPasswords = ['123', 'password', 'qwerty'];
    for (const password of weakPasswords) {
      const result = await registerUser({ password });
      expect(result.status).toBe(400);
    }
  });
  
  it('should rate limit login attempts', async () => {
    // Test multiple failed attempts
    for (let i = 0; i < 6; i++) {
      await loginUser({ email: 'test@example.com', password: 'wrong' });
    }
    const result = await loginUser({ email: 'test@example.com', password: 'wrong' });
    expect(result.status).toBe(429);
  });
});
```

## Security Best Practices

### Development Security

**Secure Coding Practices:**
- Input validation on all data
- Output encoding for user data
- Proper error handling
- Security-focused code reviews

**Dependency Management:**
- Regular dependency updates
- Security vulnerability scanning
- License compliance checking
- Supply chain security

### Deployment Security

**Production Hardening:**
- Environment variable security
- Database access restrictions
- Network security configuration
- Monitoring and logging setup

**Security Maintenance:**
- Regular security updates
- Vulnerability patching
- Security configuration review
- Incident response testing

### User Security Education

**Security Communications:**
- Password best practices
- Phishing awareness
- Account security features
- Incident reporting procedures

This comprehensive security implementation provides multiple layers of protection while maintaining usability and performance. Regular security reviews and updates ensure the platform remains secure against evolving threats.