import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'stutosed — Study Portal',
    short_name: 'stutosed',
    description: 'Complete study portal for BEU B.Tech engineering & competitive exams.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#cc785c',
    icons: [
      {
        src: '/icons/icon-192.png?v=stutosed-white',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png?v=stutosed-white',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512.png?v=stutosed-white',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/favicon.svg?v=stutosed-white',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
