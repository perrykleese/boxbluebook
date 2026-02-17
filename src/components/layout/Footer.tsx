import Link from 'next/link';
import { Github, Twitter } from 'lucide-react';

const FOOTER_LINKS = {
  'Price Guide': [
    { href: '/search', label: 'Search Cigars' },
    { href: '/trending', label: 'Trending' },
    { href: '/brands', label: 'All Brands' },
    { href: '/recent-sales', label: 'Recent Sales' },
  ],
  Resources: [
    { href: '/about', label: 'About Us' },
    { href: '/methodology', label: 'Pricing Methodology' },
    { href: '/faq', label: 'FAQ' },
    { href: '/api-docs', label: 'API Documentation' },
  ],
  Account: [
    { href: '/login', label: 'Sign In' },
    { href: '/register', label: 'Create Account' },
    { href: '/pricing', label: 'Pro Membership' },
    { href: '/dashboard', label: 'My Dashboard' },
  ],
  Legal: [
    { href: '/terms', label: 'Terms of Service' },
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/disclaimer', label: 'Disclaimer' },
    { href: '/contact', label: 'Contact Us' },
  ],
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">B</span>
              </div>
              <span className="font-bold text-xl">BoxBlueBook</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              The authoritative price guide for collectible cigars. Track market values, discover trends, and manage your collection.
            </p>
            <div className="flex gap-4">
              <a
                href="https://twitter.com/boxbluebook"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a
                href="https://github.com/boxbluebook"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </a>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold mb-3">{category}</h3>
              <ul className="space-y-2">
                {links.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} BoxBlueBook. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              Prices are estimates based on recent market transactions. Not financial advice.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
