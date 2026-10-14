import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rally – Support the Favorites you love',
  description: 'Turn passive fandom into active, recognized, and sustainable support.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="header">
          <a href="/" className="logo">Rally</a>
          <nav>
            <a href="/explore">Explore</a>
            <a href="/login">Log in</a>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
