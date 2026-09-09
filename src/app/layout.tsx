import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-brand',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://stutosed.vercel.app'),
  title: 'stutosed',
  description: 'Your complete study portal for SSC, Competitive Exams and Bihar Engineering University (BEU) B.Tech courses, lectures, notes, and PDF resources.',
  icons: {
    icon: [
      { url: '/favicon.svg?v=stutosed-red', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png?v=stutosed-red', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico?v=stutosed-red' },
      { url: '/icons/icon-192.png?v=stutosed-red', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.ico?v=stutosed-red',
    apple: '/apple-touch-icon.png?v=stutosed-red',
  },
  verification: {
    google: 'google32c778425d2b60c3',
  },
  openGraph: {
    title: 'stutosed — Engineering & Competitive Exam Courses',
    description: 'Free high-speed video lectures, notes & study portal for BEU B.Tech and Government exams.',
    url: 'https://stutosed.vercel.app',
    siteName: 'stutosed',
    type: 'website',
    images: [
      {
        url: '/thumbnails/default_course_dark.svg',
        width: 1280,
        height: 720,
        alt: 'stutosed learning portal',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'stutosed — Engineering & Competitive Exam Courses',
    description: 'Free high-speed video lectures, notes & study portal for BEU B.Tech and Government exams.',
    images: ['/thumbnails/default_course_dark.svg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning className={spaceGrotesk.variable}>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=stutosed-red" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=stutosed-red" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=stutosed-red" />
        <link rel="shortcut icon" href="/favicon.ico?v=stutosed-red" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=stutosed-red" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('stutosed-theme') || 'light';
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased font-sans">
        {children}
        <Analytics />
      </body>
    </html>
  );
}

