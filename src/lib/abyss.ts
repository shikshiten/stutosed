/**
 * Abyss.to API Client & Video Service
 * Endpoints: https://api.abyss.to
 * Embed Player: https://player.abyssplayer.com/:fileId
 */

export const ABYSS_API_ENDPOINT = 'https://api.abyss.to';
export const ABYSS_PLAYER_BASE = 'https://player.abyssplayer.com';
export const ABYSS_API_KEY = process.env.ABYSS_API_KEY || '9eca85398fadd20ed00d21aec0740818';

export interface AbyssResourceItem {
  id: string;
  name: string;
  isDir?: boolean;
  size?: number;
  status?: string;
  resolutions?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AbyssFolderResponse {
  name: string;
  items: AbyssResourceItem[];
  breadcrumbs: { id: string; name: string }[];
  pageToken?: string;
}

/**
 * Generates official Abyss native player embed URL
 */
export function getAbyssEmbedUrl(fileIdOrUrl: string): string {
  if (!fileIdOrUrl) return '';
  if (fileIdOrUrl.includes('player.abyssplayer.com')) {
    return fileIdOrUrl;
  }
  const match = fileIdOrUrl.match(/(?:abyss\.to\/|abyssplayer\.com\/|files\/)([a-zA-Z0-9_-]{8,15})/);
  const id = match ? match[1] : fileIdOrUrl;
  return `${ABYSS_PLAYER_BASE}/${id}`;
}

/**
 * Checks if a given URL is an Abyss video
 */
export function isAbyssVideo(url: string): boolean {
  if (!url) return false;
  return url.includes('abyssplayer.com') || url.includes('abyss.to');
}

/**
 * Query resources inside a folder from Abyss API
 */
export async function fetchAbyssFolder(folderId?: string, pageToken?: string): Promise<AbyssFolderResponse> {
  const url = new URL(`${ABYSS_API_ENDPOINT}/v1/resources`);
  url.searchParams.set('key', ABYSS_API_KEY);
  if (folderId) url.searchParams.set('folderId', folderId);
  if (pageToken) url.searchParams.set('pageToken', pageToken);

  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
    next: { revalidate: 300 }, // 5 min cache
  });

  if (!res.ok) {
    throw new Error(`Abyss API error: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as AbyssFolderResponse;
}

/**
 * Get single file metadata from Abyss API
 */
export async function fetchAbyssFile(fileId: string): Promise<AbyssResourceItem> {
  const url = `${ABYSS_API_ENDPOINT}/v1/files/${fileId}?key=${encodeURIComponent(ABYSS_API_KEY)}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`Abyss API error: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as AbyssResourceItem;
}
