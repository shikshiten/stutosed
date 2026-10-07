import { z } from 'zod';

export const hlsProxyQuerySchema = z.object({
  url: z.string().min(1, 'Target URL is required'),
  provider: z.string().optional(),
});

export type HlsProxyQueryInput = z.infer<typeof hlsProxyQuerySchema>;
