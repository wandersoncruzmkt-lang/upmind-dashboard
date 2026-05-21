import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import QueryProvider from '@/components/providers/QueryProvider';

export const metadata: Metadata = {
  title: 'Upmind OS',
  description: 'Creative Agency Operations Platform',
  manifest: '/manifest.json',
  themeColor: '#080f1a',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-dark-bg text-white">
        <QueryProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#0f2035',
                color: '#fff',
                border: '1px solid #1a2f4a',
              },
              success: {
                iconTheme: { primary: '#C9A44C', secondary: '#080f1a' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#fff' },
              },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
