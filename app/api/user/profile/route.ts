import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import User from '@/lib/models/User';
import { authenticateRequest } from '@/lib/auth';
import { updateProfileSchema } from '@/lib/validation';
import { formatErrorResponse, AuthenticationError, ValidationError, NotFoundError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    const tokenPayload = await authenticateRequest(request);
    if (!tokenPayload) {
      throw new AuthenticationError('Authentication token required');
    }

    // Connect to database
    await connectToDatabase();

    // Find user by ID
    const user = await User.findById(tokenPayload.userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return NextResponse.json({
      message: 'Profile retrieved successfully',
      user: user.toJSON()
    });

  } catch (error) {
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Authenticate request
    const tokenPayload = await authenticateRequest(request);
    if (!tokenPayload) {
      throw new AuthenticationError('Authentication token required');
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateProfileSchema.safeParse(body);

    if (!validationResult.success) {
      const errors: Record<string, string[]> = {};
      validationResult.error.errors.forEach(error => {
        const path = error.path.join('.');
        if (!errors[path]) errors[path] = [];
        errors[path].push(error.message);
      });
      throw new ValidationError(errors);
    }

    // Connect to database
    await connectToDatabase();

    // Update user profile
    const user = await User.findByIdAndUpdate(
      tokenPayload.userId,
      { ...validationResult.data, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: user.toJSON()
    });

  } catch (error) {
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}