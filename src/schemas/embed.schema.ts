import { z } from 'zod';

export const embedQuerySchema = z.object({
  url: z.string().optional(),
});

export type EmbedQueryInput = z.infer<typeof embedQuerySchema>;
