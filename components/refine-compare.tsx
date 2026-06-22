"use client";

import { useCallback, useRef, useState } from "react";
import { ArrowLeftRight, Loader2 } from "lucide-react";

type RefineCompareProps = {
  beforeSrc: string;
  afterSrc?: string | null;
  afterLoading?: boolean;
  label?: string;
};

export function RefineCompare({
  beforeSrc,
  afterSrc,
  afterLoading,
  label = "Compare",
}: RefineCompareProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const dragging = useRef(false);

  const onPointerDown = useCallback((event: React.PointerEvent) => {
    dragging.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const onPointerMove = useCallback((event: React.PointerEvent) => {
    if (!dragging.current || !frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    const next = ((event.clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(96, Math.max(4, next)));
  }, []);

  const onPointerUp = useCallback((event: React.PointerEvent) => {
    dragging.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  const showSplit = Boolean(afterSrc) || afterLoading;

  return (
    <div className="gp-refine-compare" ref={frameRef} aria-label={label}>
      <div className="gp-refine-compare__layer gp-refine-compare__before">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={beforeSrc} alt="Reference" draggable={false} />
        <span className="gp-refine-compare__tag">Reference</span>
      </div>

      {showSplit ? (
        <>
          <div
            className="gp-refine-compare__layer gp-refine-compare__after"
            style={{ clipPath: `inset(0 0 0 ${position}%)` }}
          >
            {afterSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={afterSrc} alt="Refined output" draggable={false} />
            ) : (
              <div className="gp-refine-compare__pending">
                <Loader2 className="gp-spin" size={28} aria-hidden="true" />
                <span>Refining…</span>
              </div>
            )}
            <span className="gp-refine-compare__tag">Output</span>
          </div>

          <div
            className="gp-refine-compare__handle"
            style={{ left: `${position}%` }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            role="slider"
            aria-label="Compare reference and output"
            aria-valuemin={4}
            aria-valuemax={96}
            aria-valuenow={Math.round(position)}
          >
            <span className="gp-refine-compare__handle-grip">
              <ArrowLeftRight size={14} aria-hidden="true" />
            </span>
          </div>
        </>
      ) : (
        <div className="gp-refine-compare__hint">
          Send a prompt in chat to generate a refinement.
        </div>
      )}
    </div>
  );
}
