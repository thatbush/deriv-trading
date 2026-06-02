import { Providers } from './providers';
import { AnalyticsWSProvider } from './deriv-ws-provider';
import { Toaster } from '@/components/ui/sonner';
import { EnvCheck } from './env-check';
import { ThemeBridge } from './theme-bridge';
import { RouterBridge } from './router-bridge';

// Analytics is a scrollable page — no ViewportScaler (which clips height and
// kills scroll on mobile, as it was designed for fixed-layout trading apps).
export function TemplateLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AnalyticsWSProvider>
        {children}
      </AnalyticsWSProvider>
      <ThemeBridge />
      <RouterBridge />
      <Toaster />
      <EnvCheck />
    </Providers>
  );
}
