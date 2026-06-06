import type { Metadata } from 'next';
import { IBM_Plex_Sans } from 'next/font/google';
import { buildFaviconUri } from '@/lib/build-favicon-uri';
import { inter, FONT_CLASS_MAP } from '@/lib/fonts';
import { TemplateLayout } from '@/components/custom/template-layout';
import { LogoSrcProvider } from '@/components/custom/logo-src-provider';
import '@/app/globals.css';
import './globals.css';
import '@deriv/deriv-charts/dist/smartcharts.css';
import './custom.css';

// SmartCharts declares `font-family: IBM Plex Sans, sans-serif` internally.
const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-ibm-plex-sans',
  display: 'swap',
});

export function generateMetadata(): Metadata {
  const faviconUri = buildFaviconUri();
  return {
    title: 'Binary Matix — Accumulators',
    description: 'Binary Matix accumulators trading',
    ...(faviconUri ? { icons: { icon: faviconUri } } : {}),
  };
}

const fontClass =
  FONT_CLASS_MAP[process.env.NEXT_PUBLIC_FONT_FAMILY ?? 'Inter'] ??
  inter.className;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const logoSrc = '/bm-logo-w.jpeg'
  return (
    <html lang="en" className="h-full lg:h-auto" suppressHydrationWarning>
      <body
        className={`${fontClass} ${ibmPlexSans.variable} bg-background`}
      >
        <TemplateLayout>
          <LogoSrcProvider logoSrc={logoSrc}>{children}</LogoSrcProvider>
        </TemplateLayout>
      </body>
    </html>
  );
}
