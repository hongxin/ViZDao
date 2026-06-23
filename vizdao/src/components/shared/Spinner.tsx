import { useState, useEffect } from 'react';

const BRAILLE_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

/** TUI-style braille spinner (⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏) — reusable across components. */
export function BrailleSpinner({ className }: { className?: string }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFrame(f => (f + 1) % BRAILLE_FRAMES.length), 80);
    return () => clearInterval(id);
  }, []);
  return <span className={className}>{BRAILLE_FRAMES[frame]}</span>;
}
