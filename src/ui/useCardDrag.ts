import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

interface DragClone {
  element: HTMLElement;
  origin: DOMRect;
}

function makeClone(source: HTMLElement): DragClone {
  const origin = source.getBoundingClientRect();
  const element = source.cloneNode(true) as HTMLElement;
  element.classList.add('card-drag-clone');
  element.style.width = `${origin.width}px`;
  element.style.height = `${origin.height}px`;
  element.style.transform = `translate(${origin.left}px, ${origin.top}px)`;
  document.body.append(element);
  return { element, origin };
}

/** Pointer-event drag support shared by the card tables. Click handlers can
 * call `consumeClick` so a completed drag never also becomes a click move. */
export function useCardDrag<T>(onDrop: (data: T, target: string) => boolean) {
  const [data, setData] = useState<T | null>(null);
  const dragRef = useRef<DragClone | null>(null);
  const listenersRef = useRef<AbortController | null>(null);
  const suppressClickRef = useRef(false);

  const finish = useCallback((accepted: boolean, target?: HTMLElement | null) => {
    const drag = dragRef.current;
    if (!drag) return;
    listenersRef.current?.abort();
    listenersRef.current = null;
    dragRef.current = null;
    if (accepted) {
      // The board's FLIP transition now owns the accepted move. Keeping the
      // drag clone alive here made it look like the card travelled twice.
      drag.element.remove();
      setData(null);
      return;
    }
    const targetRect = target?.getBoundingClientRect();
    const x = targetRect ? targetRect.left : drag.origin.left;
    const y = targetRect ? targetRect.top : drag.origin.top;
    const animation = drag.element.animate(
      [{ transform: drag.element.style.transform, opacity: 0.92 }, { transform: `translate(${x}px, ${y}px)`, opacity: 1 }],
      { duration: 240, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    );
    animation.finished.finally(() => drag.element.remove()).catch(() => drag.element.remove());
    setData(null);
  }, []);

  const start = useCallback((nextData: T, event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || dragRef.current) return;
    const clone = makeClone(event.currentTarget);
    dragRef.current = clone;
    setData(nextData);
    event.currentTarget.setPointerCapture(event.pointerId);
    const controller = new AbortController();
    listenersRef.current = controller;
    const signal = controller.signal;
    const move = (moveEvent: PointerEvent) => {
      if (!dragRef.current) return;
      suppressClickRef.current = true;
      dragRef.current.element.style.transform = `translate(${moveEvent.clientX - clone.origin.width / 2}px, ${moveEvent.clientY - clone.origin.height / 2}px)`;
    };
    const up = (upEvent: PointerEvent) => {
      const target = document.elementFromPoint(upEvent.clientX, upEvent.clientY)
        ?.closest<HTMLElement>('[data-drop-target]');
      const targetId = target?.dataset.dropTarget;
      const accepted = targetId ? onDrop(nextData, targetId) : false;
      finish(accepted, target);
    };
    window.addEventListener('pointermove', move, { signal });
    window.addEventListener('pointerup', up, { signal, once: true });
    window.addEventListener('pointercancel', () => finish(false), { signal, once: true });
  }, [finish, onDrop]);

  const consumeClick = useCallback(() => {
    if (!suppressClickRef.current) return false;
    suppressClickRef.current = false;
    return true;
  }, []);

  useEffect(() => () => {
    listenersRef.current?.abort();
    dragRef.current?.element.remove();
  }, []);

  return { data, dragging: data !== null, start, consumeClick };
}
