import { Providers } from './providers';
import { DerivWSProvider } from './deriv-ws-provider';
import { Toaster } from '@/components/ui/sonner';
import { EnvCheck } from './env-check';
import { ThemeBridge } from './theme-bridge';
import { RouterBridge } from './router-bridge';

export function TemplateLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <DerivWSProvider>
        {children}
      </DerivWSProvider>
      <ThemeBridge />
      <RouterBridge />
      <Toaster />
      <EnvCheck />
    </Providers>
  );
}
