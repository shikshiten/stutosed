import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
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
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'stutosed — Engineering & Competitive Exam Courses',
    description: 'Free high-speed video lectures, notes & study portal for BEU B.Tech and Government exams.',
    url: 'https://stutosed.vercel.app',
    siteName: 'stutosed',
    type: 'website',
    images: [
      {
        url: '/thumbnails/stutosed_thumbnail.jpg',
        width: 1200,
        height: 630,
        alt: 'stutosed learning portal',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'stutosed — Engineering & Competitive Exam Courses',
    description: 'Free high-speed video lectures, notes & study portal for BEU B.Tech and Government exams.',
    images: ['/thumbnails/stutosed_thumbnail.jpg'],
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
      </body>
    </html>
  );
}

