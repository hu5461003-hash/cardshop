const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export function rateLimit(
  identifier: string,
  config: RateLimitConfig = { maxRequests: 10, windowMs: 60000 }
): { success: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const envMax = parseInt(process.env.RATE_LIMIT_MAX || "10", 10);
  const envWindow = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10);
  const cfg: RateLimitConfig = {
    maxRequests: config.maxRequests ?? envMax,
    windowMs: config.windowMs ?? envWindow,
  };

  const record = rateLimitMap.get(identifier);

  if (!record || now - record.lastReset > cfg.windowMs) {
    rateLimitMap.set(identifier, { count: 1, lastReset: now });
    return { success: true, remaining: cfg.maxRequests - 1, resetAt: now + cfg.windowMs };
  }

  if (record.count >= cfg.maxRequests) {
    return { success: false, remaining: 0, resetAt: record.lastReset + cfg.windowMs };
  }

  record.count++;
  return { success: true, remaining: cfg.maxRequests - record.count, resetAt: record.lastReset + cfg.windowMs };
}
