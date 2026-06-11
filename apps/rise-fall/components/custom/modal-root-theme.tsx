'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';

/**
 * SmartCharts toolbar dialogs portal their content into #modal_root, which lives
 * at the body level — OUTSIDE the chart's `.smartcharts smartcharts-{theme}`
 * wrapper. The dialog's background/text styles are theme-scoped
 * (`.smartcharts-dark .sc-dialog { background: #181c25 }`), so without a theme
 * class on #modal_root the dialog renders with no background and looks empty.
 *
 * Mirror the active theme onto #modal_root (and tag it `.smartcharts` so any
 * wrapper-scoped rules also match) so portalled dialogs are styled correctly.
 */
export function ModalRootTheme() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const el = document.getElementById('modal_root');
    if (!el) return;
    const dark =
      (resolvedTheme ??
        (document.documentElement.classList.contains('dark') ? 'dark' : 'light')) ===
      'dark';
    el.classList.add('smartcharts');
    el.classList.toggle('smartcharts-dark', dark);
    el.classList.toggle('smartcharts-light', !dark);
  }, [resolvedTheme]);

  return null;
}
