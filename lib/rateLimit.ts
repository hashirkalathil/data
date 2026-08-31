interface RateLimitRecord {
  count: number;
  firstAttemptAt: number;
  lockedUntil: number;
}

const loginAttempts = new Map<string, RateLimitRecord>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout after max attempts exceeded

// Periodic cleanup of stale records every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of loginAttempts.entries()) {
      if (now > record.lockedUntil && now - record.firstAttemptAt > WINDOW_MS) {
        loginAttempts.delete(key);
      }
    }
  }, 10 * 60 * 1000);
}

export function checkLoginRateLimit(identifier: string): {
  allowed: boolean;
  remainingAttempts: number;
  lockoutMinutesLeft: number;
} {
  const now = Date.now();
  const record = loginAttempts.get(identifier);

  if (!record) {
    return {
      allowed: true,
      remainingAttempts: MAX_ATTEMPTS,
      lockoutMinutesLeft: 0,
    };
  }

  // If locked out
  if (record.lockedUntil > now) {
    const minutesLeft = Math.ceil((record.lockedUntil - now) / 60000);
    return {
      allowed: false,
      remainingAttempts: 0,
      lockoutMinutesLeft: Math.max(1, minutesLeft),
    };
  }

  // If window expired and not locked, reset
  if (now - record.firstAttemptAt > WINDOW_MS) {
    loginAttempts.delete(identifier);
    return {
      allowed: true,
      remainingAttempts: MAX_ATTEMPTS,
      lockoutMinutesLeft: 0,
    };
  }

  return {
    allowed: record.count < MAX_ATTEMPTS,
    remainingAttempts: Math.max(0, MAX_ATTEMPTS - record.count),
    lockoutMinutesLeft: 0,
  };
}

export function recordFailedLoginAttempt(identifier: string): {
  remainingAttempts: number;
  lockedOut: boolean;
  lockoutMinutes: number;
} {
  const now = Date.now();
  const record = loginAttempts.get(identifier);

  if (!record || now - record.firstAttemptAt > WINDOW_MS) {
    loginAttempts.set(identifier, {
      count: 1,
      firstAttemptAt: now,
      lockedUntil: 0,
    });
    return {
      remainingAttempts: MAX_ATTEMPTS - 1,
      lockedOut: false,
      lockoutMinutes: 0,
    };
  }

  record.count += 1;

  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS;
    return {
      remainingAttempts: 0,
      lockedOut: true,
      lockoutMinutes: Math.ceil(LOCKOUT_MS / 60000),
    };
  }

  return {
    remainingAttempts: Math.max(0, MAX_ATTEMPTS - record.count),
    lockedOut: false,
    lockoutMinutes: 0,
  };
}

export function resetLoginRateLimit(identifier: string): void {
  loginAttempts.delete(identifier);
}
