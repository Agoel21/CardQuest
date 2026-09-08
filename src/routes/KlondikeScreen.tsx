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

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const newGame = useCallback(() => {
    const next = new SolitaireBoard(randomSeed());
    next.generate();
    boardRef.current = next;
    setSelection(null);
    setMoves(0);
    refresh();
  }, [refresh]);

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
    [selection, refresh],
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
        selection.source.takeFrom(selection.card);
        setSelection(null);
        setMoves((m) => m + 1);
        refresh();
      }
    },
    [board, selection, refresh],
  );

  const handleStock = useCallback(() => {
    board.flipFromStock();
    setSelection(null);
    setMoves((m) => m + 1);
    refresh();
  }, [board, refresh]);

  const handleEmptyColumn = useCallback(
    (column: TableauColumn) => {
      if (!selection) return;
      const run = selection.source.active
        .toArray()
        .slice(selection.source.active.indexOf(selection.card));
      if (column.canAccept(run)) {
        selection.source.takeFrom(selection.card);
        column.tryAdd(run);
        setSelection(null);
        setMoves((m) => m + 1);
        refresh();
      }
    },
    [selection, refresh],
  );

  const won = board.isWon;
  const stuck = useMemo(
    () => !won && !board.hasAnyMove(),
    // version is the dependency that actually matters: the board mutates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [board, won, version],
  );

  const wasteTop = board.waste.active.peek();

  return (
    <div className="game">
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
        <div className="klondike__stock-group">
          {/* Either a clickable card or a clickable slot, never one nested
              inside the other: nesting fires both handlers on a single click
              and flips the stock twice. */}
          {board.stock.isEmpty ? (
            <CardSlot label="Recycle" onClick={handleStock} />
          ) : (
            <PlayingCard faceDown onClick={handleStock} />
          )}

          {wasteTop ? (
            <PlayingCard
              card={wasteTop}
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
                playable={!!selection && foundation.canAccept(selection.card)}
                onClick={() => handleFoundationDrop(foundation.suit)}
              />
            ) : (
              <CardSlot
                key={foundation.suit}
                label={SUIT_GLYPH[foundation.suit]}
                srLabel={`${suitName(foundation.suit)} foundation`}
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
              <CardSlot label="King" onClick={() => handleEmptyColumn(column)} />
            ) : (
              <>
                {column.reserve.toArray().map((_, i) => (
                  <PlayingCard key={`r${i}`} faceDown />
                ))}
                {column.active.toArray().map((card) => (
                  <PlayingCard
                    key={`${card.suit}-${card.rank}`}
                    card={card}
                    selected={!!selection && selection.source === column && sameCard(selection.card, card)}
                    onClick={() => handleCardClick(column, card)}
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
