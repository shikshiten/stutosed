import { z } from 'zod';

export const thumbnailQuerySchema = z.object({
  title: z.string().optional().default('Study Lecture'),
  category: z.string().optional(),
  subject: z.string().optional(),
  subtitle: z.string().optional().default(''),
  theme: z.enum(['light', 'dark']).optional().default('light'),
});

export type ThumbnailQueryInput = z.infer<typeof thumbnailQuerySchema>;
