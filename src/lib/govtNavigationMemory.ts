'use client';

/**
 * Stores a user's Government Exams folder-opening activity locally so the
 * folders they use most often can be shown first. The guest scope is also
 * persistent, so this works before authentication as well.
 */
export interface GovtFolderActivity {
  count: number;
  lastOpened: number;
}

const STORAGE_KEY = 'stutosed_govt_folder_activity_v1';
const ACTIVITY_EVENT = 'stutosed_govt_folder_activity_updated';

type ActivityStore = Record<string, Record<string, GovtFolderActivity>>;

function getScope(userId?: string | null): string {
  return userId ? `user:${userId}` : 'guest';
}

function readStore(): ActivityStore {
  if (typeof window === 'undefined') return {};

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as ActivityStore) : {};
  } catch {
    return {};
  }
}

export function getGovtFolderActivity(userId?: string | null): Record<string, GovtFolderActivity> {
  const scopeActivity = readStore()[getScope(userId)];
  return scopeActivity && typeof scopeActivity === 'object' && !Array.isArray(scopeActivity) ? scopeActivity : {};
}

export function recordGovtFolderOpen(folderKey: string, userId?: string | null): void {
  if (typeof window === 'undefined' || !folderKey) return;

  try {
    const store = readStore();
    const scope = getScope(userId);
    const current = store[scope]?.[folderKey] || { count: 0, lastOpened: 0 };

    store[scope] = {
      ...(store[scope] || {}),
      [folderKey]: {
        count: current.count + 1,
        lastOpened: Date.now(),
      },
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    window.dispatchEvent(new Event(ACTIVITY_EVENT));
  } catch {
    // Keep navigation working if browser storage is unavailable.
  }
}

export { ACTIVITY_EVENT as GOVT_FOLDER_ACTIVITY_EVENT };
