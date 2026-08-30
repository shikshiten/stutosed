import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'stutosed — Study Portal',
    short_name: 'stutosed',
    description: 'Complete study portal for BEU B.Tech engineering & competitive exams.',
    start_url: '/',
    display: 'standalone',
    background_color: '#121110',
    theme_color: '#ff6b4a',
    icons: [
      {
        src: '/icon.jpg',
        sizes: '192x192',
        type: 'image/jpeg',
      },
      {
        src: '/apple-icon.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
      },
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
