// src/viz/engine/Player.tsx — 放映机：一次只现一拍，叠在 Stage 之上。
// 设/揭/悟点"继续"推进；赌(Predict)必须先承诺才解锁，承诺即推进到"揭"。
import { useEffect, useState } from 'react';
import type { ConceptScript, Directive } from './types';
import { initialConcept, advance as doAdvance, commit as doCommit, atLast, resolveSay } from './progress';

export function Player({
  script, onBeatEnter, onComplete,
}: {
  script: ConceptScript;
  onBeatEnter: (directives: Directive[]) => void;
  onComplete: () => void;
}) {
  const beats = script.beats;
  const [state, setState] = useState(initialConcept);
  const [ctaReady, setCtaReady] = useState(true);
  const beat = beats[state.index];

  // 进入一拍：向 Stage 发指令；Reveal 有 hold 则让揭晓先呼吸再现 cta。
  useEffect(() => {
    onBeatEnter(beat.enter ?? []);
    if (beat.kind === 'reveal' && beat.hold) {
      setCtaReady(false);
      const id = setTimeout(() => setCtaReady(true), beat.hold);
      return () => clearTimeout(id);
    }
    setCtaReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.index]);

  const next = () => {
    if (atLast(state, beats)) { onComplete(); return; }
    setState((s) => doAdvance(s, beats));
  };
  const pick = (value: string) => {
    if (beat.kind !== 'predict') return;
    setState((s) => doAdvance(doCommit(s, beat.commit.id, value), beats));
  };

  const text = resolveSay(beat.say, state.ledger);
  const lastBeat = atLast(state, beats);
  const ctaLabel = beat.kind === 'reveal' || beat.kind === 'reflect'
    ? (beat.cta ?? (lastBeat ? '完成 →' : '继续 →'))
    : (beat.kind === 'frame' ? (beat.cta ?? '继续 →') : '');

  return (
    <div
      style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        padding: 'var(--vz-s4) var(--vz-s4) var(--vz-s6)',
        background: 'linear-gradient(to top, hsl(var(--background)) 35%, hsl(var(--background) / 0))',
        pointerEvents: 'none',
      }}
    >
      <div key={state.index} className="vz-beat-in" style={{ maxWidth: 'var(--vz-measure)', margin: '0 auto', pointerEvents: 'auto' }}>
        {/* 极淡的方位点 */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 'var(--vz-s2)' }}>
          {beats.map((_, i) => (
            <span key={i} style={{
              width: 6, height: 6, borderRadius: 999,
              background: i === state.index ? 'hsl(var(--vz-accent))' : 'hsl(var(--foreground) / 0.18)',
            }} />
          ))}
        </div>

        <p style={{ fontSize: 'var(--vz-text-xl)', lineHeight: 1.5, margin: 0, color: 'hsl(var(--foreground))' }}>
          {text}
        </p>

        {/* 赌：必须选一个 */}
        {beat.kind === 'predict' && (
          <div style={{ display: 'flex', gap: 'var(--vz-s2)', marginTop: 'var(--vz-s3)', flexWrap: 'wrap' }}>
            {beat.commit.options.map((o) => (
              <button
                key={o.value}
                onClick={() => pick(o.value)}
                style={{
                  fontSize: 'var(--vz-text-base)', padding: '0.6rem 1.4rem', borderRadius: 999,
                  border: '1px solid hsl(var(--foreground) / 0.3)', background: 'transparent',
                  color: 'hsl(var(--foreground))', cursor: 'pointer',
                  transition: 'border-color var(--vz-dur-quick) var(--vz-ease), background var(--vz-dur-quick) var(--vz-ease)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--vz-accent))'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--foreground) / 0.3)'; }}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}

        {/* 设/揭/悟：一个克制的继续键 */}
        {ctaLabel && (
          <div style={{ marginTop: 'var(--vz-s3)', minHeight: 32 }}>
            {ctaReady && (
              <button
                onClick={next}
                className="vz-beat-in"
                style={{
                  fontSize: 'var(--vz-text-base)', padding: '0.5rem 0', border: 'none', background: 'transparent',
                  color: 'hsl(var(--vz-accent))', cursor: 'pointer', fontWeight: 500,
                }}
              >
                {ctaLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
