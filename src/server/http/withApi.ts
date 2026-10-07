import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { ZodError, ZodSchema } from 'zod';
import { User } from '@supabase/supabase-js';
import { AppError, UnauthorizedError, ValidationError } from './errors';
import { fail, ApiResponseFailure, ApiResponseSuccess } from './response';
import { getUser } from '@/server/auth/getUser';
import { enforceRateLimit, getClientIp, RateLimitResult } from '@/server/security/rateLimit';

export interface ApiHandlerContext<TQuery = unknown, TBody = unknown> {
  req: NextRequest;
  query: TQuery;
  body: TBody;
  user: User | null;
  params: Record<string, string | string[]>;
}

export interface WithApiOptions<TQuery, TBody> {
  requireAuth?: boolean;
  querySchema?: ZodSchema<TQuery>;
  bodySchema?: ZodSchema<TBody>;
  rateLimit?: {
    limit: number;
    windowSeconds: number;
    keyGenerator?: (req: NextRequest) => string;
  };
}

type NextRouteParams = { params: Promise<Record<string, string | string[] | undefined>> };

export function withApi<TData, TQuery = unknown, TBody = unknown>(
  handler: (ctx: ApiHandlerContext<TQuery, TBody>) => Promise<NextResponse<ApiResponseSuccess<TData>> | NextResponse<unknown>>,
  options: WithApiOptions<TQuery, TBody> = {}
) {
  return async (
    req: NextRequest,
    context: NextRouteParams
  ): Promise<NextResponse<ApiResponseSuccess<TData>> | NextResponse<ApiResponseFailure> | NextResponse<unknown>> => {
    try {
      // 1. Resolve Next.js 15 route params (which is a Promise in Next.js 15)
      let resolvedParams: Record<string, string | string[]> = {};
      if (context && context.params) {
        const rawParams = await context.params;
        if (rawParams && typeof rawParams === 'object') {
          for (const [key, val] of Object.entries(rawParams)) {
            if (val !== undefined) {
              resolvedParams[key] = val;
            }
          }
        }
      }

      // 2. Authentication check (if required)
      let user: User | null = null;
      if (options.requireAuth) {
        user = await getUser();
        if (!user) {
          throw new UnauthorizedError('Authentication required');
        }
      } else {
        user = await getUser();
      }

      // 3. Rate limiting check (if configured)
      let rateLimitInfo: RateLimitResult | null = null;
      if (options.rateLimit) {
        const key = options.rateLimit.keyGenerator
          ? options.rateLimit.keyGenerator(req)
          : user ? `user:${user.id}` : `ip:${getClientIp(req)}`;
        rateLimitInfo = enforceRateLimit(
          key,
          options.rateLimit.limit,
          options.rateLimit.windowSeconds
        );
      }

      // 4. Query validation
      let validatedQuery = {} as TQuery;
      if (options.querySchema) {
        const searchParamsObj: Record<string, string> = {};
        req.nextUrl.searchParams.forEach((value, key) => {
          searchParamsObj[key] = value;
        });

        const parseResult = options.querySchema.safeParse(searchParamsObj);
        if (!parseResult.success) {
          const firstIssue = parseResult.error.issues[0];
          const errorMsg = firstIssue
            ? `${firstIssue.path.join('.') || 'query'}: ${firstIssue.message}`
            : 'Invalid query parameters';
          throw new ValidationError(errorMsg);
        }
        validatedQuery = parseResult.data;
      }

      // 5. Body validation (for POST, PUT, PATCH, DELETE)
      let validatedBody = {} as TBody;
      if (options.bodySchema) {
        let rawBody: unknown;
        try {
          rawBody = await req.json();
        } catch {
          throw new ValidationError('Invalid or missing JSON body');
        }

        const parseResult = options.bodySchema.safeParse(rawBody);
        if (!parseResult.success) {
          const firstIssue = parseResult.error.issues[0];
          const errorMsg = firstIssue
            ? `${firstIssue.path.join('.') || 'body'}: ${firstIssue.message}`
            : 'Invalid request body';
          throw new ValidationError(errorMsg);
        }
        validatedBody = parseResult.data;
      }

      // 6. Delegate to handler
      const res = await handler({
        req,
        query: validatedQuery,
        body: validatedBody,
        user,
        params: resolvedParams,
      });

      if (rateLimitInfo) {
        res.headers.set('X-RateLimit-Limit', rateLimitInfo.limit.toString());
        res.headers.set('X-RateLimit-Remaining', rateLimitInfo.remaining.toString());
        res.headers.set('X-RateLimit-Reset', rateLimitInfo.reset.toString());
      }

      return res;
    } catch (err: unknown) {
      if (err instanceof ZodError) {
        const firstIssue = err.issues[0];
        const msg = firstIssue ? `${firstIssue.path.join('.')}: ${firstIssue.message}` : 'Validation error';
        return fail(msg, 422, 'VALIDATION_ERROR');
      }

      if (err instanceof AppError) {
        return fail(err.message, err.statusCode, err.code);
      }

      const message = err instanceof Error ? err.message : 'Internal Server Error';
      console.error('[API Error]:', err);
      return fail(message, 500, 'INTERNAL_SERVER_ERROR');
    }
  };
}
