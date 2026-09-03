/**
 * Stutosed News & Announcements Data
 * Easily add, edit, or remove upcoming platform announcements and course requests.
 */

export interface AnnouncementItem {
  id: string;
  badge: string;
  badgeType: 'upcoming' | 'feature' | 'telegram';
  title: string;
  description: string;
  dateTag?: string;
  actionText?: string;
  actionUrl?: string;
  highlight?: boolean;
}

export const ANNOUNCEMENTS_DATA: AnnouncementItem[] = [
  {
    id: 'upcoming-courses',
    badge: 'Upcoming Batches',
    badgeType: 'upcoming',
    title: 'New SSC & B.Tech Courses Arriving',
    description: 'SSC CGL / CHSL Advanced Practice Batches, Higher Semester B.Tech Core Subjects, and Specialized GK Topic Capsules will be added to the vault.',
    dateTag: 'September 2026',
    actionText: 'Browse Active Batches',
    actionUrl: '#explore-categories',
  },
  {
    id: 'upcoming-features',
    badge: 'In Development',
    badgeType: 'feature',
    title: 'Interactive Quiz & Revision Tools',
    description: 'We are crafting interactive practice quizzes, chapter-wise revision summaries, and smart offline bookmarking to elevate your preparation.',
    dateTag: 'Next Update',
  },
  {
    id: 'telegram-demand',
    badge: 'Student Request • DM Admin',
    badgeType: 'telegram',
    title: 'Koi Course ya Study Material Chahiye?',
    description: 'Agar aapko koi specific course, test series, class notes ya subject chahiye — seedhe Telegram par batayein! Aapke demand par batch live kar diya jayega.',
    actionText: 'Request on Telegram (@bookwormislie)',
    actionUrl: 'https://t.me/bookwormislie',
    highlight: true,
  },
];
