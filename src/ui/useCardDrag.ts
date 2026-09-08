import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

/**
 * How far the pointer must travel before this counts as a drag.
 *
 * Without a threshold every click spawns and destroys a drag clone, which
 * flickers and makes a plain click feel unreliable. Below this distance the
 * gesture stays a click and the board's click handler deals with it.
 */
const DRAG_THRESHOLD_PX = 5;

interface DragClone {
  element: HTMLElement;
  origin: DOMRect;
  /** Motion ids of every card being dragged, top card first. */
  ids: string[];
}

/**
 * Clones the grabbed card AND everything stacked on top of it, so dragging a
 * run in Klondike or FreeCell shows the whole run rather than a single card
 * with the rest left behind.
 */
function makeClone(source: HTMLElement): DragClone {
  const origin = source.getBoundingClientRect();

  const members: HTMLElement[] = [];
  let node: Element | null = source;
  while (node instanceof HTMLElement && node.hasAttribute('data-card-motion-id')) {
    members.push(node);
    node = node.nextElementSibling;
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'card-drag-clone';
  wrapper.style.width = `${origin.width}px`;
  wrapper.style.height = `${origin.height}px`;
  wrapper.style.transform = `translate(${origin.left}px, ${origin.top}px)`;

  for (const member of members) {
    const rect = member.getBoundingClientRect();
    const copy = member.cloneNode(true) as HTMLElement;
    copy.style.position = 'absolute';
    copy.style.margin = '0';
    copy.style.left = `${rect.left - origin.left}px`;
    copy.style.top = `${rect.top - origin.top}px`;
    copy.style.width = `${rect.width}px`;
    copy.style.height = `${rect.height}px`;
    wrapper.append(copy);
  }

  document.body.append(wrapper);
  return {
    element: wrapper,
    origin,
    ids: members.map((m) => m.dataset['cardMotionId']).filter((id): id is string => !!id),
  };
}

/**
 * Pointer-event drag support shared by the card tables.
 *
 * `onDrop` receives the rect the cards were released at. Pass it to the
 * board's motion controller so the follow-up FLIP animates from the drop
 * point instead of replaying the drag from the card's original slot.
 *
 * Click handlers should call `consumeClick` so a completed drag never also
 * fires as a click move.
 */
export function useCardDrag<T>(
  onDrop: (data: T, target: string, releaseRect: DOMRect, ids: string[]) => boolean,
) {
  const [data, setData] = useState<T | null>(null);
  const dragRef = useRef<DragClone | null>(null);
  const listenersRef = useRef<AbortController | null>(null);
  const suppressClickRef = useRef(false);

  const cleanup = useCallback(() => {
    listenersRef.current?.abort();
    listenersRef.current = null;
  }, []);

  const returnToOrigin = useCallback((drag: DragClone) => {
    const animation = drag.element.animate(
      [
        { transform: drag.element.style.transform, opacity: 0.92 },
        { transform: `translate(${drag.origin.left}px, ${drag.origin.top}px)`, opacity: 1 },
      ],
      { duration: 240, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    );
    animation.finished
      .then(() => drag.element.remove())
      .catch(() => drag.element.remove());
  }, []);

  const start = useCallback(
    (nextData: T, event: ReactPointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0 || dragRef.current || listenersRef.current) return;

      const source = event.currentTarget;
      const startX = event.clientX;
      const startY = event.clientY;
      const pointerId = event.pointerId;

      const controller = new AbortController();
      listenersRef.current = controller;
      const { signal } = controller;

      const move = (moveEvent: PointerEvent) => {
        if (moveEvent.pointerId !== pointerId) return;

        // Below the threshold this is still a click, so do nothing yet.
        if (!dragRef.current) {
          const travelled = Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY);
          if (travelled < DRAG_THRESHOLD_PX) return;
          dragRef.current = makeClone(source);
          suppressClickRef.current = true;
          setData(nextData);
          try {
            source.setPointerCapture(pointerId);
          } catch {
            // Capture is a nicety. If the browser refuses it, the window
            // listeners below still track the pointer to completion.
          }
        }

        const drag = dragRef.current;
        drag.element.style.transform = `translate(${
          moveEvent.clientX - drag.origin.width / 2
        }px, ${moveEvent.clientY - drag.origin.height / 2}px)`;
      };

      const up = (upEvent: PointerEvent) => {
        if (upEvent.pointerId !== pointerId) return;
        cleanup();

        const drag = dragRef.current;
        dragRef.current = null;

        // Never moved far enough to be a drag: leave it to the click handler.
        if (!drag) return;

        const releaseRect = drag.element.getBoundingClientRect();
        const target = document
          .elementFromPoint(upEvent.clientX, upEvent.clientY)
          ?.closest<HTMLElement>('[data-drop-target]');
        const targetId = target?.dataset['dropTarget'];
        const accepted = targetId ? onDrop(nextData, targetId, releaseRect, drag.ids) : false;

        setData(null);
        if (accepted) {
          // The board's FLIP transition takes over from the release point, so
          // the clone must go immediately or the card appears twice.
          drag.element.remove();
        } else {
          returnToOrigin(drag);
        }
      };

      const cancel = () => {
        cleanup();
        const drag = dragRef.current;
        dragRef.current = null;
        setData(null);
        if (drag) returnToOrigin(drag);
      };

      window.addEventListener('pointermove', move, { signal });
      window.addEventListener('pointerup', up, { signal });
      window.addEventListener('pointercancel', cancel, { signal });
    },
    [cleanup, onDrop, returnToOrigin],
  );

  const consumeClick = useCallback(() => {
    if (!suppressClickRef.current) return false;
    suppressClickRef.current = false;
    return true;
  }, []);

  useEffect(
    () => () => {
      listenersRef.current?.abort();
      dragRef.current?.element.remove();
    },
    [],
  );

  return { data, dragging: data !== null, start, consumeClick };
}
