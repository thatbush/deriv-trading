import type { Metadata } from 'next';
import { inter, FONT_CLASS_MAP } from '@/lib/fonts';
import { TemplateLayout } from '@/components/custom/template-layout';
import '@/app/globals.css';
import './custom.css';

export const metadata: Metadata = {
  title: 'Binarymatix — Analytics',
  description: 'Binarymatix market analytics',
  icons: { icon: '/bm-logo-w.jpeg' },
};

const fontClass =
  FONT_CLASS_MAP[process.env.NEXT_PUBLIC_FONT_FAMILY ?? 'Inter'] ??
  inter.className;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full lg:h-auto" suppressHydrationWarning>
      <body
        className={`${fontClass} bg-background flex min-h-dvh flex-col overflow-hidden max-lg:h-dvh max-lg:overflow-hidden lg:block lg:h-auto lg:min-h-screen lg:overflow-x-hidden lg:overflow-y-auto`}
      >
        <TemplateLayout>{children}</TemplateLayout>
      </body>
    </html>
  );
}
