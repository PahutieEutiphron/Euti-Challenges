const rateLimits = new Map();

function getClientIp(req) {
  // Determine client IP from proxy headers
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.connection.remoteAddress;
}

function loginRateLimit(req, res, next) {
  const ip = getClientIp(req);
  const now = Date.now();

  let record = rateLimits.get(ip);

  if (record && record.blockedUntil && record.blockedUntil > now) {
    const remaining = Math.ceil((record.blockedUntil - now) / 1000);
    return res.status(429).json({
      error: 'Too many requests',
      message: `Your IP has been temporarily blocked due to too many failed login attempts. Please try again in ${remaining} seconds.`,
      retryAfter: remaining
    });
  }

  if (record && record.blockedUntil && record.blockedUntil <= now) {
    rateLimits.delete(ip);
  }

  req._rateLimitIp = ip;
  next();
}

function recordFailedAttempt(ip) {
  let record = rateLimits.get(ip) || { attempts: 0, blockedUntil: null };
  record.attempts += 1;

  if (record.attempts >= 5) {
    record.blockedUntil = Date.now() + 3 * 60 * 1000;
    record.attempts = 0;
  }

  rateLimits.set(ip, record);
}

function clearAttempts(ip) {
  rateLimits.delete(ip);
}

module.exports = { loginRateLimit, recordFailedAttempt, clearAttempts };
