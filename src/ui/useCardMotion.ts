import { RefObject, useCallback, useEffect, useLayoutEffect, useRef } from 'react';

export function cardMotionId(card: { suit: number; rank: number }): string {
  return `${card.suit}-${card.rank}`;
}

interface CardPosition {
  left: number;
  top: number;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function cardPositions(root: HTMLElement): Map<string, CardPosition> {
  const positions = new Map<string, CardPosition>();
  root.querySelectorAll<HTMLElement>('[data-card-motion-id]').forEach((element) => {
    const id = element.dataset.cardMotionId;
    if (!id) return;
    const rect = element.getBoundingClientRect();
    positions.set(id, { left: rect.left, top: rect.top });
  });
  return positions;
}

/**
 * A small, dependency-free FLIP controller for a game board. Call `capture`
 * immediately before mutating the board. The following render then animates
 * cards with the same identity from their former position to their new one.
 */
export function useCardMotion(version: number) {
  const rootRef = useRef<HTMLDivElement>(null);
  const beforeRef = useRef<Map<string, CardPosition> | null>(null);
  /**
   * Cards the player physically dragged, and where they let go.
   *
   * Without this, FLIP replays the whole journey the player just made by
   * hand: it captures the card at its ORIGINAL slot, so on release the card
   * snaps back to where it started and flies across again. Overriding the
   * start position with the release point turns that into a short settle
   * from wherever the card was dropped into its final resting slot.
   */
  const releasedRef = useRef<Map<string, CardPosition>>(new Map());
  const dealPendingRef = useRef(true);
  const animationsRef = useRef<Animation[]>([]);

  const stopAnimations = useCallback(() => {
    for (const animation of animationsRef.current) animation.cancel();
    animationsRef.current = [];
  }, []);

  const capture = useCallback(() => {
    const root = rootRef.current;
    if (root) beforeRef.current = cardPositions(root);
  }, []);

  /** Record where a dragged card was released, so FLIP starts from there. */
  const noteRelease = useCallback((ids: string[], rect: DOMRect) => {
    for (const id of ids) releasedRef.current.set(id, { left: rect.left, top: rect.top });
  }, []);

  const queueDeal = useCallback(() => {
    dealPendingRef.current = true;
    beforeRef.current = null;
  }, []);

  const animateLeaving = useCallback((id: string, target?: HTMLElement | null) => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;
    const source = root.querySelector<HTMLElement>(`[data-card-motion-id="${id}"]`);
    if (!source) return;
    const sourceRect = source.getBoundingClientRect();
    const targetRect = target?.getBoundingClientRect();
    const clone = source.cloneNode(true) as HTMLElement;
    clone.classList.add('card-motion-clone');
    clone.style.width = `${sourceRect.width}px`;
    clone.style.height = `${sourceRect.height}px`;
    clone.style.transform = `translate(${sourceRect.left}px, ${sourceRect.top}px)`;
    document.body.append(clone);

    const destination = targetRect
      ? `translate(${targetRect.left - sourceRect.left}px, ${targetRect.top - sourceRect.top}px) scale(0.62)`
      : 'translate(0, -18px) scale(0.8)';
    const animation = clone.animate(
      [{ transform: clone.style.transform, opacity: 1 }, { transform: destination, opacity: 0 }],
      { duration: 320, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    );
    animationsRef.current.push(animation);
    animation.finished.finally(() => clone.remove()).catch(() => clone.remove());
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) {
      beforeRef.current = null;
      releasedRef.current.clear();
      dealPendingRef.current = false;
      return;
    }

    const before = beforeRef.current;
    const source = root.querySelector<HTMLElement>('[data-card-motion-source]');
    const sourceRect = source?.getBoundingClientRect();
    const additions = !before && dealPendingRef.current;
    const started: Animation[] = [];

    root.querySelectorAll<HTMLElement>('[data-card-motion-id]').forEach((element, index) => {
      const id = element.dataset.cardMotionId;
      if (!id) return;
      const rect = element.getBoundingClientRect();
      // A card the player dragged starts from where they let go of it, not
      // from the slot it used to occupy.
      const first = releasedRef.current.get(id) ?? before?.get(id);
      const dx = first ? first.left - rect.left : sourceRect ? sourceRect.left - rect.left : 0;
      const dy = first ? first.top - rect.top : sourceRect ? sourceRect.top - rect.top : 0;
      if (!first && !additions) return;
      if (!first && !sourceRect) return;
      if (dx === 0 && dy === 0 && !additions) return;
      const animation = element.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) scale(${additions ? 0.74 : 1})`, opacity: additions ? 0.2 : 1 },
          { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        ],
        {
          duration: additions ? 360 : 260,
          delay: additions ? Math.min(index * 28, 520) : 0,
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        },
      );
      started.push(animation);
    });

    animationsRef.current.push(...started);
    beforeRef.current = null;
    releasedRef.current.clear();
    dealPendingRef.current = false;
  }, [version]);

  useEffect(() => stopAnimations, [stopAnimations]);

  return { rootRef: rootRef as RefObject<HTMLDivElement>, capture, noteRelease, queueDeal, animateLeaving };
}
