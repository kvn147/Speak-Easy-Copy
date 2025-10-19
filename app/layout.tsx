import type { Metadata } from 'next';
import { AuthProvider } from './lib/firebase/AuthContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'Markdown Viewer - Notion Clone',
  description: 'Secure markdown conversation viewer with Firebase authentication',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
