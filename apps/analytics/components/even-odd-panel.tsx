'use client';

import type { EvenOddStats, OverUnderStats, MatchDifferStats } from '@deriv/core';

interface Props {
  evenOdd: EvenOddStats;
  overUnder: OverUnderStats;
  matchDiffer: MatchDifferStats;
  barrier: number;
  onBarrierChange: (v: number) => void;
  matchDigit: number;
  onMatchDigitChange: (v: number) => void;
}

function StatBar({ leftLabel, leftPct, rightLabel, rightPct, leftColor, rightColor }: {
  leftLabel: string; leftPct: number;
  rightLabel: string; rightPct: number;
  leftColor: string; rightColor: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{leftLabel} <span className="font-semibold text-foreground">{leftPct.toFixed(1)}%</span></span>
        <span>{rightLabel} <span className="font-semibold text-foreground">{rightPct.toFixed(1)}%</span></span>
      </div>
      <div className="flex h-3 rounded-full overflow-hidden gap-px">
        <div className={`${leftColor} transition-all duration-500`} style={{ width: `${leftPct}%` }} />
        <div className={`${rightColor} flex-1 transition-all duration-500`} />
      </div>
    </div>
  );
}

function DigitPicker({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
          <button
            key={d}
            onClick={() => onChange(d)}
            className={`w-6 h-6 rounded text-[11px] font-bold transition-colors ${value === d ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}

export function EvenOddPanel({ evenOdd, overUnder, matchDiffer, barrier, onBarrierChange, matchDigit, onMatchDigitChange }: Props) {
  return (
    <div className="flex flex-col gap-5">
      {/* Even / Odd */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Even / Odd</span>
        <StatBar
          leftLabel="Even"
          leftPct={evenOdd.evenPercent}
          rightLabel="Odd"
          rightPct={evenOdd.oddPercent}
          leftColor="bg-emerald-500"
          rightColor="bg-orange-500"
        />
      </div>

      {/* Over / Under */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Over / Under</span>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Barrier</span>
          <div className="flex items-center gap-1">
            {[3, 4, 5, 6, 7].map((d) => (
              <button
                key={d}
                onClick={() => onBarrierChange(d)}
                className={`w-7 h-7 rounded text-xs font-bold transition-colors ${barrier === d ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <StatBar
          leftLabel={`Over ${barrier}`}
          leftPct={overUnder.overPercent}
          rightLabel={`Under ${barrier}`}
          rightPct={overUnder.underPercent}
          leftColor="bg-blue-500"
          rightColor="bg-pink-500"
        />
        {overUnder.equalCount > 0 && (
          <p className="text-[11px] text-muted-foreground">
            Equal to {barrier}: {overUnder.equalCount} ({((overUnder.equalCount / overUnder.totalTicks) * 100).toFixed(1)}%)
          </p>
        )}
      </div>

      {/* Match / Differ */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Match / Differ</span>
        <DigitPicker value={matchDigit} onChange={onMatchDigitChange} label="Digit" />
        <StatBar
          leftLabel={`Match ${matchDigit}`}
          leftPct={matchDiffer.matchPercent}
          rightLabel={`Differ ${matchDigit}`}
          rightPct={matchDiffer.differPercent}
          leftColor="bg-violet-500"
          rightColor="bg-zinc-400"
        />
        <p className="text-[11px] text-muted-foreground">
          {matchDiffer.matchCount} matches · expected ~{(matchDiffer.totalTicks / 10).toFixed(0)} (10%)
        </p>
      </div>
    </div>
  );
}
