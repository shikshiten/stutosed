/**
 * Stutosed Centralized Subject Thumbnail Architecture
 * Dynamically generates unified high-aesthetic Mithila-infused vector SVGs based on title and category.
 */

export const PROTECTED_THUMBNAILS: Record<string, string> = {
  'ee-ece-eee': '/thumbnails/beu_ece_ee_eee.jpg',
  'ece-ee-eee': '/thumbnails/beu_ece_ee_eee.jpg',
  'mechanical-umeed': '/thumbnails/beu_mech_umeed.jpg',
  'civil-umeed': '/thumbnails/beu_civil_umeed.jpg',
  'cse-umeed': '/thumbnails/beu_cse_umeed.jpg',
  'parmar-gk-3-0': '/thumbnails/parmar_gk_3.jpg',
  'parmar': '/thumbnails/parmar_gk_3.jpg',
};

export function getDynamicThumbnailUrl(
  title?: string | null,
  category?: string | null,
  theme?: 'light' | 'dark'
): string {
  const cleanTitle = (title || 'Study Lecture').trim();
  const cleanCategory = (category || '').trim();
  const mode = theme === 'dark' ? 'dark' : 'light';
  return `/api/thumbnail?title=${encodeURIComponent(cleanTitle)}&category=${encodeURIComponent(cleanCategory)}&theme=${mode}`;
}

/**
 * Normalizes title / subject string and resolves the exact canonical thumbnail asset.
 * Always generates dynamic, topic-specific Mithila SVG thumbnails matching the lecture or folder name.
 */
export function getSubjectThumbnail(
  subjectName?: string | null,
  fallbackThumb?: string | null,
  tabIdOrName?: string | null,
  theme?: 'light' | 'dark'
): string {
  const title = (subjectName || tabIdOrName || '').trim();
  const category = (tabIdOrName || subjectName || '').trim();

  if (title) {
    return getDynamicThumbnailUrl(title, category, theme);
  }

  if (fallbackThumb && fallbackThumb.endsWith('.svg')) {
    if (theme && !fallbackThumb.includes('_light.svg') && !fallbackThumb.includes('_dark.svg')) {
      return fallbackThumb.replace('.svg', `_${theme}.svg`);
    }
    return fallbackThumb;
  }

  return fallbackThumb || '/thumbnails/all_lecture_thumbnail.jpg';
}
