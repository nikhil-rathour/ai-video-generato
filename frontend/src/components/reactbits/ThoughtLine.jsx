import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Sparkles } from 'lucide-react';
import './ThoughtLine.css';

const formatSeconds = (seconds) => `${seconds.toFixed(1)}s`;

export default function ThoughtLine({
  working = true,
  steps = [],
  label = 'Thinking…',
  doneLabel = 'Thought for',
  fontSize = 16,
  collapsible = true,
  collapseOnSettle = true,
  showTimer = true,
  onSettle,
  className = '',
}) {
  const [elapsed, setElapsed] = useState(0);
  const [open, setOpen] = useState(true);
  const settledRef = useRef(false);
  const elapsedRef = useRef(0);
  const onSettleRef = useRef(onSettle);

  useEffect(() => {
    onSettleRef.current = onSettle;
  }, [onSettle]);

  useEffect(() => {
    if (working) {
      settledRef.current = false;
      setElapsed(0);
      setOpen(true);
      const startedAt = performance.now();
      const timer = window.setInterval(() => {
        elapsedRef.current = (performance.now() - startedAt) / 1000;
        setElapsed(elapsedRef.current);
      }, 100);
      return () => window.clearInterval(timer);
    }
    if (!settledRef.current) {
      settledRef.current = true;
      onSettleRef.current?.(elapsedRef.current);
    }
    if (collapseOnSettle) setOpen(false);
    return undefined;
  }, [working, collapseOnSettle]);

  const canToggle = collapsible && steps.length > 0;
  return (
    <div className={`thought-line ${className}`} style={{ '--tl-font': `${fontSize}px` }} data-working={working ? '' : undefined}>
      <button type="button" className="thought-line__head" disabled={!canToggle} onClick={() => canToggle && setOpen((value) => !value)} aria-expanded={canToggle ? open : undefined}>
        <Sparkles className="thought-line__glyph" />
        <span className="thought-line__label">{working ? label : doneLabel}</span>
        {showTimer && <span className="thought-line__timer">{formatSeconds(elapsed)}</span>}
        {canToggle && <ChevronDown className={`thought-line__chevron ${open ? 'thought-line__chevron--open' : ''}`} />}
      </button>
      {steps.length > 0 && open && (
        <div className="thought-line__steps">
          {steps.map((step, index) => {
            const active = working && index === steps.length - 1;
            return (
              <div key={`${index}-${step}`} className="thought-line__step" data-active={active ? '' : undefined}>
                <span className="thought-line__mark">{active ? <i className="thought-line__pulse" /> : <Check />}</span>
                <span>{step}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
