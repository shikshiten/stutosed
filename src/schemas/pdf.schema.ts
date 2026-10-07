import { z } from 'zod';

export const pdfQuerySchema = z.object({
  url: z.string().url('A valid URL query parameter is required'),
});

export type PdfQueryInput = z.infer<typeof pdfQuerySchema>;
