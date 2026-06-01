import type { Metadata } from 'next';
import { buildFaviconUri } from '@/lib/build-favicon-uri';
import { inter, FONT_CLASS_MAP } from '@/lib/fonts';
import { TemplateLayout } from '@/components/custom/template-layout';
import { LogoSrcProvider } from '@/components/custom/logo-src-provider';
import '@/app/globals.css';
import './globals.css';
import './custom.css';

export function generateMetadata(): Metadata {
  const faviconUri = buildFaviconUri();
  return {
    title: 'Binarymatix — Digits',
    description: 'Binarymatix digits trading',
    ...(faviconUri ? { icons: { icon: faviconUri } } : {}),
  };
}

const fontClass =
  FONT_CLASS_MAP[process.env.NEXT_PUBLIC_FONT_FAMILY ?? 'Inter'] ??
  inter.className;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const logoSrc = '/bm-logo-w.jpeg';
  return (
    <html lang="en" className="h-full lg:h-auto" suppressHydrationWarning>
      <body
        className={`${fontClass} bg-background flex min-h-dvh flex-col overflow-hidden max-lg:h-dvh max-lg:overflow-hidden lg:block lg:h-auto lg:min-h-screen lg:overflow-x-hidden lg:overflow-y-auto`}
      >
        <TemplateLayout>
          <LogoSrcProvider logoSrc={logoSrc}>{children}</LogoSrcProvider>
        </TemplateLayout>
      </body>
    </html>
  );
}
