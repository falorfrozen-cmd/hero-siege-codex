import type { Metadata } from 'next';
import './globals.css';
import './scholar/panels.css';
import './scholar/scholar.css';
import './scholar/refinement.css';
export const metadata: Metadata = {
  title: 'Hero Siege Codex — The Scholar’s Index',
  description:
    'Explore Hero Siege items, classes, original stat descriptions, creatures, relics and world records in the Scholar’s Index.',
  icons: { icon: '/favicon.svg' },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
