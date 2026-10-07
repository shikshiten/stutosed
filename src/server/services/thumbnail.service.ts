import 'server-only';
import { generateDynamicSvgThumbnail } from '@/lib/dynamicThumbnail';
import { ThumbnailQueryInput } from '@/schemas/thumbnail.schema';

export function getDynamicThumbnailSvg(input: ThumbnailQueryInput): string {
  const title = input.title || 'Study Lecture';
  const category = input.category || input.subject || '';
  const subtitle = input.subtitle || '';
  const theme = input.theme === 'dark' ? 'dark' : 'light';

  return generateDynamicSvgThumbnail({
    title,
    category,
    subtitle,
    theme,
  });
}
