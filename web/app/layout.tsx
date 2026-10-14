import type { Metadata } from 'next';
import './globals.css';
import { Nav } from '@/components/Nav';

export const metadata: Metadata = {
  title: 'Rally – Support the Favorites you love',
  description: 'Turn passive fandom into active, recognized, and sustainable support.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main className="main">{children}</main>
        <footer className="footer">
          <a href="/how-to-use">How to use</a>
          <a href="/faq">FAQ</a>
          <a href="/support">Support</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="/about">About</a>
        </footer>
      </body>
    </html>
  );
}
