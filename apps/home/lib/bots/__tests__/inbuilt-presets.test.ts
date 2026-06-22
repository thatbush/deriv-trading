import { describe, it, expect } from 'vitest';
import { INBUILT_PRESETS, hasBarrier } from '@/lib/bots/inbuilt-presets';

describe('INBUILT_PRESETS', () => {
  it('contains the seeded presets with correct contract types/barriers', () => {
    const byLabel = Object.fromEntries(INBUILT_PRESETS.map((p) => [p.label, p]));
    expect(byLabel['Under 9']).toMatchObject({ contractType: 'DIGITUNDER', barrier: 9 });
    expect(byLabel['Over 5']).toMatchObject({ contractType: 'DIGITOVER', barrier: 5 });
    expect(byLabel['Even']).toMatchObject({ contractType: 'DIGITEVEN' });
    expect(byLabel['Even'].barrier).toBeUndefined();
  });

  it('has unique ids', () => {
    const ids = INBUILT_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('hasBarrier', () => {
  it('true for over/under, false for even/odd', () => {
    expect(hasBarrier({ id: 'a', label: 'Over 5', contractType: 'DIGITOVER', barrier: 5 })).toBe(true);
    expect(hasBarrier({ id: 'b', label: 'Even', contractType: 'DIGITEVEN' })).toBe(false);
  });
});
