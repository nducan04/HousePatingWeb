import type { Metadata } from 'next';
import './globals.css';
import AuthProvider from '@/lib/components/AuthProvider';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import AlertOverride from '@/components/AlertOverride';
import GlobalChatbot from '@/components/GlobalChatbot';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VTSC PaintPro | Quản lý Sơn Tĩnh Điện',
  description: 'Hệ thống quản lý kinh doanh sơn tĩnh điện VTSC — Dashboard, R&D Tracking, Smart Contract & B2C Portal',
  keywords: ['VTSC', 'sơn tĩnh điện', 'Akzonobel', 'Interpon', 'paint management'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={inter.className}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('unhandledrejection', function(event) {
                if (event.reason && String(event.reason).includes('MetaMask')) {
                  event.preventDefault();
                }
              });
            `,
          }}
        />
      </head>
      <body>
        <AuthProvider>
          <AlertOverride />
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              className: 'font-bold text-sm',
              duration: 4000,
              style: {
                background: '#333',
                color: '#fff',
                borderRadius: '12px',
                padding: '16px 24px',
              },
              success: {
                style: {
                  background: '#059669',
                  color: 'white',
                },
                iconTheme: {
                  primary: 'white',
                  secondary: '#059669',
                },
              },
              error: {
                style: {
                  background: '#e11d48',
                  color: 'white',
                },
                iconTheme: {
                  primary: 'white',
                  secondary: '#e11d48',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
