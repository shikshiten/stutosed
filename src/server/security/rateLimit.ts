import 'server-only';
import { NextRequest } from 'next/server';
import { TooManyRequestsError } from '@/server/http/errors';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory fallback store for local dev or when Upstash Redis is not configured / unavailable
const memoryStore = new Map<string, RateLimitRecord>();

// Periodically clean up stale memory records every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryStore.entries()) {
      if (record.resetAt <= now) {
        memoryStore.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in seconds
}

/**
 * In-memory rate limiting check (used for local development and fallback).
 */
export function checkRateLimitMemory(
  identifier: string,
  limit: number = 60,
  windowSeconds: number = 60
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const existing = memoryStore.get(identifier);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    memoryStore.set(identifier, { count: 1, resetAt });
    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - 1),
      reset: Math.ceil(resetAt / 1000),
    };
  }

  existing.count += 1;
  const allowed = existing.count <= limit;
  const remaining = Math.max(0, limit - existing.count);

  return {
    allowed,
    limit,
    remaining,
    reset: Math.ceil(existing.resetAt / 1000),
  };
}

/**
 * Upstash Redis / Vercel KV REST-based rate limiting.
 * Executes atomic INCR + EXPIRE via HTTP pipeline without extra dependencies.
 */
async function checkRateLimitUpstash(
  identifier: string,
  limit: number,
  windowSeconds: number,
  apiUrl: string,
  apiToken: string
): Promise<RateLimitResult> {
  const cleanUrl = apiUrl.replace(/\/+$/, '');
  const key = `ratelimit:${identifier}`;

  // Use AbortSignal to ensure rate limit calls never hang upstream requests (max 1200ms)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1200);

  try {
    const response = await fetch(`${cleanUrl}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, windowSeconds, 'NX'],
        ['TTL', key],
      ]),
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Upstash returned HTTP ${response.status}`);
    }

    const data = (await response.json()) as Array<{ result?: number; error?: string }>;
    const count = typeof data[0]?.result === 'number' ? data[0].result : 1;
    const ttlSeconds = typeof data[2]?.result === 'number' && data[2].result > 0 ? data[2].result : windowSeconds;

    const allowed = count <= limit;
    const remaining = Math.max(0, limit - count);
    const reset = Math.floor(Date.now() / 1000) + ttlSeconds;

    return { allowed, limit, remaining, reset };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Universal rate limit checker:
 * 1. Checks for Upstash / Vercel KV REST credentials.
 * 2. If present, calls Redis atomically over HTTPS.
 * 3. Gracefully falls back to in-memory sliding window on missing config or network failure.
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = 60,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const apiUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const apiToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (apiUrl && apiToken) {
    try {
      return await checkRateLimitUpstash(identifier, limit, windowSeconds, apiUrl, apiToken);
    } catch (err) {
      console.warn('[RateLimit] Upstash Redis request failed, falling back to memory store:', err);
    }
  }

  return checkRateLimitMemory(identifier, limit, windowSeconds);
}

export async function enforceRateLimit(
  identifier: string,
  limit: number = 60,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const result = await checkRateLimit(identifier, limit, windowSeconds);
  if (!result.allowed) {
    throw new TooManyRequestsError('Rate limit exceeded. Please try again later.');
  }
  return result;
}

export function getClientIp(req: NextRequest): string {
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();

  const xRealIp = req.headers.get('x-real-ip');
  if (xRealIp) return xRealIp.trim();

  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(',')[0];
    if (firstIp) return firstIp.trim();
  }

  return '127.0.0.1';
}
