import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { config } from '@/config';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: config.brand.name,
  description: config.brand.tagline,
  icons: {
    icon: [
      { url: '/icon-light.svg', media: '(prefers-color-scheme: light)', type: 'image/svg+xml' },
      { url: '/icon-dark.svg', media: '(prefers-color-scheme: dark)', type: 'image/svg+xml' },
    ],
    shortcut: '/icon-light.svg',
    apple: '/icon-light.svg',
  },
};

// Default to dark mode. Respect explicit user preference saved in localStorage.
const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('proxymobile-theme');
    if (t === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  } catch(e) {
    document.documentElement.classList.add('dark');
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
