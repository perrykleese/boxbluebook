import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'BoxBlueBook - Cigar Price Guide',
    template: '%s | BoxBlueBook',
  },
  description: 'The authoritative price guide for collectible cigars. Track market values, discover trends, and manage your collection.',
  keywords: ['cigar', 'price guide', 'collectible cigars', 'cigar values', 'cigar market', 'opus x', 'padron', 'liga privada'],
  authors: [{ name: 'BoxBlueBook' }],
  creator: 'BoxBlueBook',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://boxbluebook.com',
    siteName: 'BoxBlueBook',
    title: 'BoxBlueBook - Cigar Price Guide',
    description: 'The authoritative price guide for collectible cigars.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'BoxBlueBook - Cigar Price Guide',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BoxBlueBook - Cigar Price Guide',
    description: 'The authoritative price guide for collectible cigars.',
    images: ['/og-image.png'],
    creator: '@boxbluebook',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="relative flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
