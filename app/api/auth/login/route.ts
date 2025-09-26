import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import User from '@/lib/models/User';
import { loginSchema } from '@/lib/validation';
import { generateToken } from '@/lib/auth';
import { rateLimiter, RATE_LIMITS } from '@/lib/rate-limit';
import { formatErrorResponse, AuthenticationError, ValidationError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.ip || 'anonymous';
    const rateLimitResult = rateLimiter.check(
      `login:${clientIP}`,
      RATE_LIMITS.AUTH.limit,
      RATE_LIMITS.AUTH.windowMs
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many login attempts', 
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: rateLimitResult.reset
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toISOString(),
          }
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      const errors: Record<string, string[]> = {};
      validationResult.error.errors.forEach(error => {
        const path = error.path.join('.');
        if (!errors[path]) errors[path] = [];
        errors[path].push(error.message);
      });
      throw new ValidationError(errors);
    }

    const { email, password } = validationResult.data;

    // Connect to database
    await connectToDatabase();

    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });

    // Return success response
    const response = NextResponse.json({
      message: 'Login successful',
      user: user.toJSON(),
      token
    });

    // Set token as HTTP-only cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });

    return response;

  } catch (error) {
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}