/**
 * Klondike Solitaire.
 *
 * Interaction is click-to-select then click-to-place, which works with a
 * mouse, on touch, and from the keyboard alike. Drag-and-drop is layered on
 * top for pointer users rather than being the only way to play.
 *
 * The board is a mutable engine object held in a ref; `version` forces the
 * re-render. Cloning the whole board on every move would be tidier in
 * principle but pointless work for a 52-card game.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { Card, randomSeed, sameCard, Suit, suitName, TableauColumn } from '../engine';
import { SolitaireBoard } from '../games/solitaire/board';
import { CardSlot, PlayingCard } from '../ui/PlayingCard';
import { cardMotionId, useCardMotion } from '../ui/useCardMotion';
import { useCardDrag } from '../ui/useCardDrag';
import './GameScreen.css';

interface Selection {
  source: TableauColumn;
  card: Card;
}

const SUIT_GLYPH: Record<Suit, string> = {
  [Suit.Clubs]: '♣',
  [Suit.Diamonds]: '♦',
  [Suit.Hearts]: '♥',
  [Suit.Spades]: '♠',
};

export function KlondikeScreen() {
  const boardRef = useRef<SolitaireBoard | null>(null);
  const [version, setVersion] = useState(0);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [moves, setMoves] = useState(0);

  if (!boardRef.current) {
    const board = new SolitaireBoard(randomSeed());
    board.generate();
    boardRef.current = board;
  }
  const board = boardRef.current;
  const motion = useCardMotion(version);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const newGame = useCallback(() => {
    motion.queueDeal();
    const next = new SolitaireBoard(randomSeed());
    next.generate();
    boardRef.current = next;
    setSelection(null);
    setMoves(0);
    refresh();
  }, [motion, refresh]);

  const handleCardClick = useCallback(
    (source: TableauColumn, card: Card) => {
      // Clicking the selected card again clears the selection.
      if (selection && selection.source === source && sameCard(selection.card, card)) {
        setSelection(null);
        return;
      }

      // With something already selected, try to drop it onto this column.
      if (selection && selection.source !== source) {
        const run = selection.source.active.toArray().slice(
          selection.source.active.indexOf(selection.card),
        );
        if (source.canAccept(run)) {
          motion.capture();
          selection.source.takeFrom(selection.card);
          source.tryAdd(run);
          setSelection(null);
          setMoves((m) => m + 1);
          refresh();
          return;
        }
      }

      setSelection({ source, card });
    },
    [selection, refresh, motion],
  );

  const handleAutoMove = useCallback(
    (source: TableauColumn, card: Card) => {
      if (board.tryAutoMove(source, card)) {
        setSelection(null);
        setMoves((m) => m + 1);
        refresh();
      }
    },
    [board, refresh],
  );

  const handleFoundationDrop = useCallback(
    (suit: Suit) => {
      if (!selection) return;
      const foundation = board.foundationFor(suit);
      if (foundation.tryStack(selection.card)) {
        motion.capture();
        selection.source.takeFrom(selection.card);
        setSelection(null);
        setMoves((m) => m + 1);
        refresh();
      }
    },
    [board, selection, refresh, motion],
  );

  const handleStock = useCallback(() => {
    motion.capture();
    board.flipFromStock();
    setSelection(null);
    setMoves((m) => m + 1);
    refresh();
  }, [board, refresh, motion]);

  const handleEmptyColumn = useCallback(
    (column: TableauColumn) => {
      if (!selection) return;
      const run = selection.source.active
        .toArray()
        .slice(selection.source.active.indexOf(selection.card));
      if (column.canAccept(run)) {
        motion.capture();
        selection.source.takeFrom(selection.card);
        column.tryAdd(run);
        setSelection(null);
        setMoves((m) => m + 1);
        refresh();
      }
    },
    [selection, refresh, motion],
  );

  const won = board.isWon;
  const drag = useCardDrag<Selection>(useCallback((dragged, target) => {
    const run = dragged.source.active.toArray().slice(dragged.source.active.indexOf(dragged.card));
    if (run.length === 0) return false;
    if (target.startsWith('foundation-')) {
      if (run.length !== 1) return false;
      const suit = Number(target.slice('foundation-'.length)) as Suit;
      const foundation = board.foundationFor(suit);
      if (!foundation.tryStack(dragged.card)) return false;
      motion.capture();
      dragged.source.takeFrom(dragged.card);
      setSelection(null);
      setMoves((moves) => moves + 1);
      refresh();
      return true;
    }
    if (!target.startsWith('column-')) return false;
    const columnIndex = Number(target.slice('column-'.length));
    const destination = board.columns[columnIndex];
    if (!destination || destination === dragged.source || !destination.canAccept(run)) return false;
    motion.capture();
    dragged.source.takeFrom(dragged.card);
    destination.tryAdd(run);
    setSelection(null);
    setMoves((moves) => moves + 1);
    refresh();
    return true;
  }, [board, motion, refresh]));
  const stuck = useMemo(
    () => !won && !board.hasAnyMove(),
    // version is the dependency that actually matters: the board mutates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [board, won, version],
  );

  const wasteTop = board.waste.active.peek();

  return (
    <div className="game" ref={motion.rootRef}>
      <div className="game__header">
        <div>
          <h1 className="game__title">Klondike</h1>
          <p className="game__subtitle">
            Build the four foundations from ace to king.
          </p>
        </div>
        <div className="game__controls">
          <span className="game__stat">
            <span className="game__stat-value">{moves}</span> moves
          </span>
          <button type="button" className="btn btn--primary" onClick={newGame}>
            New game
          </button>
        </div>
      </div>

      {won && (
        <p className="banner banner--win" role="status">
          Solved in {moves} moves.
        </p>
      )}
      {stuck && (
        <p className="banner banner--stuck" role="status">
          No moves left. Start a new game.
        </p>
      )}

      <section className="klondike__top" aria-label="Stock, waste and foundations">
        <div className="klondike__stock-group" data-card-motion-source>
          {/* Either a clickable card or a clickable slot, never one nested
              inside the other: nesting fires both handlers on a single click
              and flips the stock twice. */}
          {board.stock.isEmpty ? (
            <CardSlot label="Recycle" onClick={handleStock} />
          ) : (
            <PlayingCard card={board.stock.peek()} faceDown motionId={board.stock.peek() ? cardMotionId(board.stock.peek()!) : undefined} onClick={handleStock} />
          )}

          {wasteTop ? (
            <PlayingCard
              key={cardMotionId(wasteTop)}
              card={wasteTop}
              motionId={cardMotionId(wasteTop)}
              flipIn
              selected={!!selection && sameCard(selection.card, wasteTop)}
              onClick={() => handleCardClick(board.waste, wasteTop)}
            />
          ) : (
            /* An empty dashed slot reads as "nothing here" on its own; a
               visible word would only truncate at narrow widths. */
            <CardSlot label="" srLabel="Waste pile, empty" />
          )}
        </div>

        <div className="klondike__foundations">
          {board.foundations.map((foundation) => {
            const top = foundation.pile.peek();
            return top ? (
              <PlayingCard
                key={foundation.suit}
                card={top}
                motionId={cardMotionId(top)}
                dropTarget={`foundation-${foundation.suit}`}
                playable={!!selection && foundation.canAccept(selection.card) || !!drag.data && drag.data.source.active.toArray().slice(drag.data.source.active.indexOf(drag.data.card)).length === 1 && foundation.canAccept(drag.data.card)}
                onClick={() => { if (!drag.consumeClick()) handleFoundationDrop(foundation.suit); }}
              />
            ) : (
              <CardSlot
                key={foundation.suit}
                label={SUIT_GLYPH[foundation.suit]}
                srLabel={`${suitName(foundation.suit)} foundation`}
                dropTarget={`foundation-${foundation.suit}`}
                playable={!!drag.data && drag.data.source.active.toArray().slice(drag.data.source.active.indexOf(drag.data.card)).length === 1 && foundation.canAccept(drag.data.card)}
                onClick={() => handleFoundationDrop(foundation.suit)}
              />
            );
          })}
        </div>
      </section>

      <section
        className="klondike__tableau"
        aria-label="Tableau columns"
        onDoubleClick={() => {
          if (selection) handleAutoMove(selection.source, selection.card);
        }}
      >
        {board.columns.map((column, columnIndex) => (
          <div className="klondike__column" key={columnIndex}>
            {column.isEmpty ? (
              <CardSlot label="King" dropTarget={`column-${columnIndex}`} playable={!!drag.data && column.canAccept(drag.data.source.active.toArray().slice(drag.data.source.active.indexOf(drag.data.card)))} onClick={() => handleEmptyColumn(column)} />
            ) : (
              <>
                {column.reserve.toArray().map((card) => (
                  <PlayingCard key={cardMotionId(card)} card={card} faceDown motionId={cardMotionId(card)} />
                ))}
                {column.active.toArray().map((card) => (
                  <PlayingCard
                    key={`${card.suit}-${card.rank}`}
                    card={card}
                    motionId={cardMotionId(card)}
                    dropTarget={`column-${columnIndex}`}
                    dragging={!!drag.data && drag.data.source === column && sameCard(drag.data.card, card)}
                    selected={!!selection && selection.source === column && sameCard(selection.card, card)}
                    onClick={() => { if (!drag.consumeClick()) handleCardClick(column, card); }}
                    onPointerDown={(event) => drag.start({ source: column, card }, event)}
                  />
                ))}
              </>
            )}
          </div>
        ))}
      </section>

      <p className="game__hint">
        Click a card to pick it up, then click where it should go. Double-click sends
        a card straight to its foundation.
      </p>
    </div>
  );
}
