export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
}

class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  
  check(identifier: string, limit: number, windowMs: number): RateLimitResult {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean up old entries
    this.cleanup(windowStart);
    
    const key = identifier;
    const current = this.requests.get(key) || { count: 0, resetTime: now + windowMs };
    
    if (now > current.resetTime) {
      // Window has expired, reset
      current.count = 0;
      current.resetTime = now + windowMs;
    }
    
    current.count++;
    this.requests.set(key, current);
    
    return {
      success: current.count <= limit,
      limit,
      remaining: Math.max(0, limit - current.count),
      reset: new Date(current.resetTime)
    };
  }
  
  private cleanup(windowStart: number) {
    for (const [key, data] of this.requests.entries()) {
      if (data.resetTime < windowStart) {
        this.requests.delete(key);
      }
    }
  }
}

export const rateLimiter = new RateLimiter();

// Rate limit configurations
export const RATE_LIMITS = {
  AUTH: { limit: 5, windowMs: 15 * 60 * 1000 }, // 5 requests per 15 minutes
  API: { limit: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes
  STRICT: { limit: 3, windowMs: 5 * 60 * 1000 }, // 3 requests per 5 minutes
};