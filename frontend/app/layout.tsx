import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
