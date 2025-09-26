import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

// Enforce string type for secrets
const JWT_SECRET: string = process.env.JWT_SECRET || "insecure_default_secret";
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || "7d";

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET as jwt.Secret, {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET as jwt.Secret) as TokenPayload;
  } catch {
    return null;
  }
}

export function extractTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // fallback to cookies
  return request.cookies.get("token")?.value || null;
}

export async function authenticateRequest(
  request: NextRequest
): Promise<TokenPayload | null> {
  const token = extractTokenFromRequest(request);
  if (!token) return null;

  return verifyToken(token);
}
