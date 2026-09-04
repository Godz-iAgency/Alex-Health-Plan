import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.PUBLIC_SITE_URL || 'https://alex-health-plan.splitmic.chatgpt.site'),
  title: 'Alex Health Plan',
  description: 'A simple, supportive daily wellness coach for Alex.',
  applicationName: 'Alex Health Plan',
  icons: { icon: '/alex-logo.png', apple: '/alex-logo.png' },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Alex Health' },
  openGraph: {
    type: 'website',
    title: 'Alex Health Plan',
    description: 'One good choice at a time.',
    images: [{ url: '/og.png', width: 1536, height: 1024, alt: 'Alex Health Plan — One good choice at a time.' }],
  },
  twitter: { card: 'summary_large_image', title: 'Alex Health Plan', description: 'One good choice at a time.', images: ['/og.png'] },
};

export const viewport: Viewport = { themeColor: '#083f36', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
