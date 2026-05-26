import type { Metadata } from 'next';
import './globals.css';
import AuthProvider from '@/lib/components/AuthProvider';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VTSC PaintPro | Quản lý Sơn Tĩnh Điện',
  description: 'Hệ thống quản lý kinh doanh sơn tĩnh điện VTSC — Dashboard, R&D Tracking, Smart Contract & B2C Portal',
  keywords: ['VTSC', 'sơn tĩnh điện', 'Akzonobel', 'Interpon', 'paint management'],
  icons: {
    icon: '/vtsc.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={inter.className}>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
