export type DigitContractType = 'DIGITOVER' | 'DIGITUNDER' | 'DIGITEVEN' | 'DIGITODD';

export interface DigitPreset {
  id: string;
  label: string;
  contractType: DigitContractType;
  barrier?: number;
}

export const INBUILT_PRESETS: DigitPreset[] = [
  { id: 'over-0', label: 'Over 0', contractType: 'DIGITOVER', barrier: 0 },
  { id: 'over-5', label: 'Over 5', contractType: 'DIGITOVER', barrier: 5 },
  { id: 'under-9', label: 'Under 9', contractType: 'DIGITUNDER', barrier: 9 },
  { id: 'under-5', label: 'Under 5', contractType: 'DIGITUNDER', barrier: 5 },
  { id: 'even', label: 'Even', contractType: 'DIGITEVEN' },
  { id: 'odd', label: 'Odd', contractType: 'DIGITODD' },
];

export function hasBarrier(p: DigitPreset): boolean {
  return p.contractType === 'DIGITOVER' || p.contractType === 'DIGITUNDER';
}
