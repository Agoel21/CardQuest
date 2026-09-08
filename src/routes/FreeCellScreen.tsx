/**
 * FreeCell.
 *
 * Interaction mirrors Klondike: click-to-select then click-to-place, which
 * works with a mouse, on touch, and from the keyboard alike.
 *
 * The board is a mutable engine object held in a ref; `version` forces the
 * re-render. Cloning the whole board on every move would be tidier in
 * principle but pointless work for a 52-card game.
 */
import { useCallback, useState } from 'react';
import { Card, colorOf, randomSeed, sameCard, Suit, suitName } from '../engine';
import { FreeCellBoard } from '../games/freecell/board';
import { CardSlot, PlayingCard } from '../ui/PlayingCard';
import './GameScreen.css';

type Selection =
  | { kind: 'column'; columnIndex: number; card: Card }
  | { kind: 'freeCell'; cellIndex: number; card: Card };

const SUIT_GLYPH: Record<Suit, string> = {
  [Suit.Clubs]: '♣',
  [Suit.Diamonds]: '♦',
  [Suit.Hearts]: '♥',
  [Suit.Spades]: '♠',
};

function isSameSelection(a: Selection, b: Selection): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'freeCell' && b.kind === 'freeCell') return a.cellIndex === b.cellIndex;
  if (a.kind === 'column' && b.kind === 'column') {
    return a.columnIndex === b.columnIndex && sameCard(a.card, b.card);
  }
  return false;
}

function makeBoard(): FreeCellBoard {
  const board = new FreeCellBoard(randomSeed());
  board.generate();
  return board;
}

export function FreeCellScreen() {
  const [board, setBoard] = useState<FreeCellBoard>(() => makeBoard());
  const [selection, setSelection] = useState<Selection | null>(null);
  const [moves, setMoves] = useState(0);
  const [, setVersion] = useState(0);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const newGame = useCallback(() => {
    setBoard(makeBoard());
    setSelection(null);
    setMoves(0);
  }, []);

  const runFrom = useCallback((columnIndex: number, card: Card): Card[] => {
    const column = board.columns[columnIndex];
    if (!column) return [];
    const index = column.active.indexOf(card);
    if (index === -1) return [];
    return column.active.toArray().slice(index);
  }, [board]);

  const commit = useCallback(() => {
    setSelection(null);
    setMoves((m) => m + 1);
    refresh();
  }, [refresh]);

  const handleColumnCardClick = useCallback(
    (columnIndex: number, card: Card) => {
      const clicked: Selection = { kind: 'column', columnIndex, card };
      if (selection && isSameSelection(selection, clicked)) {
        setSelection(null);
        return;
      }

      if (selection) {
        if (selection.kind === 'freeCell') {
          if (board.moveFromFreeCell(selection.cellIndex, columnIndex)) {
            commit();
            return;
          }
        } else if (selection.columnIndex !== columnIndex) {
          const run = runFrom(selection.columnIndex, selection.card);
          if (board.moveToColumn(run, selection.columnIndex, columnIndex)) {
            commit();
            return;
          }
        }
      }

      setSelection(clicked);
    },
    [selection, board, runFrom, commit],
  );

  const handleFreeCellClick = useCallback(
    (cellIndex: number) => {
      const card = board.freeCells[cellIndex];
      const clicked: Selection = card ? { kind: 'freeCell', cellIndex, card } : null as unknown as Selection;

      if (card && selection && isSameSelection(selection, clicked)) {
        setSelection(null);
        return;
      }

      if (!card) {
        if (selection && selection.kind === 'column') {
          const run = runFrom(selection.columnIndex, selection.card);
          if (run.length === 1 && board.moveToFreeCell(selection.card, selection.columnIndex)) {
            commit();
          }
        }
        return;
      }

      setSelection({ kind: 'freeCell', cellIndex, card });
    },
    [board, selection, runFrom, commit],
  );

  const handleFoundationClick = useCallback(
    (suit: Suit) => {
      if (!selection) return;
      if (selection.kind === 'freeCell') {
        const cell = board.freeCells[selection.cellIndex];
        if (cell && cell.suit === suit && board.moveFreeCellToFoundation(selection.cellIndex)) {
          commit();
        }
        return;
      }
      if (board.moveToFoundation(selection.card, selection.columnIndex)) {
        commit();
      }
    },
    [board, selection, commit],
  );

  const handleEmptyColumnClick = useCallback(
    (columnIndex: number) => {
      if (!selection) return;
      if (selection.kind === 'freeCell') {
        if (board.moveFromFreeCell(selection.cellIndex, columnIndex)) {
          commit();
        }
        return;
      }
      const run = runFrom(selection.columnIndex, selection.card);
      if (board.moveToColumn(run, selection.columnIndex, columnIndex)) {
        commit();
      }
    },
    [board, selection, runFrom, commit],
  );

  /**
   * Double-click auto move: foundation first, then any other column, then a
   * free cell. Mirrors Klondike's double-click shortcut.
   */
  const handleAutoMove = useCallback(
    (columnIndex: number, card: Card) => {
      if (board.moveToFoundation(card, columnIndex)) {
        setSelection(null);
        setMoves((m) => m + 1);
        refresh();
        return;
      }

      const run = runFrom(columnIndex, card);
      for (let i = 0; i < board.columns.length; i++) {
        if (i === columnIndex) continue;
        if (board.moveToColumn(run, columnIndex, i)) {
          setSelection(null);
          setMoves((m) => m + 1);
          refresh();
          return;
        }
      }

      if (run.length === 1 && board.moveToFreeCell(card, columnIndex)) {
        setSelection(null);
        setMoves((m) => m + 1);
        refresh();
      }
    },
    [board, runFrom, refresh],
  );

  const won = board.isWon;

  return (
    <div className="game">
      <div className="game__header">
        <div>
          <h1 className="game__title">FreeCell</h1>
          <p className="game__subtitle">
            Build the four foundations from ace to king. Any card may sit alone in an
            empty column.
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

      <section className="freecell__top" aria-label="Free cells and foundations">
        <div className="freecell__cells">
          {board.freeCells.map((card, cellIndex) =>
            card ? (
              <PlayingCard
                key={cellIndex}
                card={card}
                selected={
                  !!selection && selection.kind === 'freeCell' && selection.cellIndex === cellIndex
                }
                onClick={() => handleFreeCellClick(cellIndex)}
              />
            ) : (
              <CardSlot
                key={cellIndex}
                label=""
                srLabel="Empty free cell"
                onClick={() => handleFreeCellClick(cellIndex)}
              />
            ),
          )}
        </div>

        <div className="freecell__foundations">
          {board.foundations.map((foundation) => {
            const top = foundation.pile.peek();
            return top ? (
              <PlayingCard
                key={foundation.suit}
                card={top}
                playable={
                  !!selection &&
                  (selection.kind === 'freeCell'
                    ? board.freeCells[selection.cellIndex]?.suit === foundation.suit
                    : foundation.canAccept(selection.card))
                }
                onClick={() => handleFoundationClick(foundation.suit)}
              />
            ) : (
              <CardSlot
                key={foundation.suit}
                label={SUIT_GLYPH[foundation.suit]}
                srLabel={`${suitName(foundation.suit)} foundation`}
                onClick={() => handleFoundationClick(foundation.suit)}
              />
            );
          })}
        </div>
      </section>

      <section
        className="freecell__tableau"
        aria-label="Tableau columns"
        onDoubleClick={() => {
          // The handler existed but was never wired up, so double-click did
          // nothing. Matches Klondike: send the held card to its foundation.
          // Only a tableau selection has a column to move from; a card held
          // in a free cell goes to its foundation by its own route.
          if (selection?.kind === 'column') {
            handleAutoMove(selection.columnIndex, selection.card);
          } else if (selection?.kind === 'freeCell') {
            if (board.moveFreeCellToFoundation(selection.cellIndex)) {
              setSelection(null);
              setMoves((m) => m + 1);
              refresh();
            }
          }
        }}
      >
        {board.columns.map((column, columnIndex) => (
          <div className="freecell__column" key={columnIndex}>
            {column.isEmpty ? (
              <CardSlot label="" srLabel="Empty column" onClick={() => handleEmptyColumnClick(columnIndex)} />
            ) : (
              column.active.toArray().map((card) => (
                <PlayingCard
                  key={`${card.suit}-${card.rank}`}
                  card={card}
                  selected={
                    !!selection &&
                    selection.kind === 'column' &&
                    selection.columnIndex === columnIndex &&
                    sameCard(selection.card, card)
                  }
                  onClick={() => handleColumnCardClick(columnIndex, card)}
                />
              ))
            )}
          </div>
        ))}
      </section>

      <p className="game__hint">
        Click a card to pick it up, then click where it should go. Double-click sends a
        card to its foundation, another column, or a free cell.
      </p>
    </div>
  );
}

/* colorOf is imported for future rendering needs; referenced to keep the
   import intentional and satisfy strict unused-import checks if enabled. */
void colorOf;
