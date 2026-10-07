import 'server-only';
import { NextResponse } from 'next/server';

export interface ApiResponseSuccess<T> {
  data: T;
}

export interface ApiResponseFailure {
  error: {
    code: string;
    message: string;
  };
}

export function ok<T>(data: T, status = 200, headers?: HeadersInit): NextResponse<ApiResponseSuccess<T>> {
  return NextResponse.json({ data }, { status, headers });
}

export function fail(
  message: string,
  status = 500,
  code = 'INTERNAL_ERROR',
  headers?: HeadersInit
): NextResponse<ApiResponseFailure> {
  return NextResponse.json(
    {
      error: {
        code,
        message,
      },
    },
    { status, headers }
  );
}
