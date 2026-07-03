import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'A Song For Your Best Friend',
  description:
    'A real song about your pet — their name, their quirks, their story. Written and sung in minutes.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
