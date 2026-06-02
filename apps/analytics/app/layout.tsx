import type { Metadata } from 'next';
import { inter, FONT_CLASS_MAP } from '@/lib/fonts';
import { TemplateLayout } from '@/components/custom/template-layout';
import '@/app/globals.css';
import './custom.css';

export const metadata: Metadata = {
  title: 'Binary Matix — Analytics',
  description: 'Binary Matix market analytics',
  icons: { icon: '/bm-logo-w.jpeg' },
};

const fontClass =
  FONT_CLASS_MAP[process.env.NEXT_PUBLIC_FONT_FAMILY ?? 'Inter'] ??
  inter.className;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontClass} bg-background flex min-h-dvh flex-col overflow-x-hidden overflow-y-auto`}
      >
        <TemplateLayout>{children}</TemplateLayout>
      </body>
    </html>
  );
}
