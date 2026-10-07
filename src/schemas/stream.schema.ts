import { z } from 'zod';

export const streamQuerySchema = z
  .object({
    url: z.string().optional(),
    code: z.string().optional(),
    provider: z.enum(['vidmoly', 'earnvids']).optional().default('vidmoly'),
  })
  .refine((data) => Boolean(data.url || data.code), {
    message: 'Must provide either "url" or "code" parameter',
  });

export type StreamQueryInput = z.infer<typeof streamQuerySchema>;
