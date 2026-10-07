export interface ApiResponseSuccess<T> {
  data: T;
}

export interface ApiResponseFailure {
  error: {
    code: string;
    message: string;
  };
}

export class ApiClientError extends Error {
  public readonly code: string;
  public readonly status: number;

  constructor(message: string, code = 'API_ERROR', status = 500) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!response.ok) {
    if (isJson) {
      const errorJson = (await response.json()) as ApiResponseFailure;
      throw new ApiClientError(
        errorJson.error?.message || `Request failed with status ${response.status}`,
        errorJson.error?.code || 'HTTP_ERROR',
        response.status
      );
    }
    const errorText = await response.text();
    throw new ApiClientError(errorText || `Request failed with status ${response.status}`, 'HTTP_ERROR', response.status);
  }

  if (isJson) {
    const json = await response.json();
    if (json && typeof json === 'object' && 'data' in json) {
      return json.data as T;
    }
    return json as T;
  }

  return (await response.text()) as unknown as T;
}
