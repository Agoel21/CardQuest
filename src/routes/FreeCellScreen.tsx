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
import { cardMotionId, useCardMotion } from '../ui/useCardMotion';
import { useCardDrag } from '../ui/useCardDrag';
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
  const [version, setVersion] = useState(0);
  const motion = useCardMotion(version);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const newGame = useCallback(() => {
    motion.queueDeal();
    setBoard(makeBoard());
    setSelection(null);
    setMoves(0);
  }, [motion]);

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
          motion.capture();
          if (board.moveFromFreeCell(selection.cellIndex, columnIndex)) {
            commit();
            return;
          }
        } else if (selection.columnIndex !== columnIndex) {
          const run = runFrom(selection.columnIndex, selection.card);
          motion.capture();
          if (board.moveToColumn(run, selection.columnIndex, columnIndex)) {
            commit();
            return;
          }
        }
      }

      setSelection(clicked);
    },
    [selection, board, runFrom, commit, motion],
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
          motion.capture();
          if (run.length === 1 && board.moveToFreeCell(selection.card, selection.columnIndex)) {
            commit();
          }
        }
        return;
      }

      setSelection({ kind: 'freeCell', cellIndex, card });
    },
    [board, selection, runFrom, commit, motion],
  );

  const handleFoundationClick = useCallback(
    (suit: Suit) => {
      if (!selection) return;
      if (selection.kind === 'freeCell') {
        const cell = board.freeCells[selection.cellIndex];
        motion.capture();
        if (cell && cell.suit === suit && board.moveFreeCellToFoundation(selection.cellIndex)) {
          commit();
        }
        return;
      }
      motion.capture();
      if (board.moveToFoundation(selection.card, selection.columnIndex)) {
        commit();
      }
    },
    [board, selection, commit, motion],
  );

  const handleEmptyColumnClick = useCallback(
    (columnIndex: number) => {
      if (!selection) return;
      if (selection.kind === 'freeCell') {
        motion.capture();
        if (board.moveFromFreeCell(selection.cellIndex, columnIndex)) {
          commit();
        }
        return;
      }
      const run = runFrom(selection.columnIndex, selection.card);
      motion.capture();
      if (board.moveToColumn(run, selection.columnIndex, columnIndex)) {
        commit();
      }
    },
    [board, selection, runFrom, commit, motion],
  );

  /**
   * Double-click auto move: foundation first, then any other column, then a
   * free cell. Mirrors Klondike's double-click shortcut.
   */
  const handleAutoMove = useCallback(
    (columnIndex: number, card: Card) => {
      motion.capture();
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
    [board, runFrom, refresh, motion],
  );

  const won = board.isWon;
  const drag = useCardDrag<Selection>(useCallback((dragged, target) => {
    const run = dragged.kind === 'column' ? runFrom(dragged.columnIndex, dragged.card) : [dragged.card];
    if (run.length === 0) return false;
    const commitDrag = () => {
      setSelection(null);
      setMoves((moves) => moves + 1);
      refresh();
    };
    motion.capture();
    if (target.startsWith('foundation-')) {
      const suit = Number(target.slice('foundation-'.length)) as Suit;
      if (dragged.kind === 'freeCell') {
        if (dragged.card.suit !== suit || !board.moveFreeCellToFoundation(dragged.cellIndex)) return false;
      } else if (dragged.card.suit !== suit || !board.moveToFoundation(dragged.card, dragged.columnIndex)) return false;
      commitDrag();
      return true;
    }
    if (target.startsWith('freecell-')) {
      if (run.length !== 1 || dragged.kind !== 'column') return false;
      if (!board.moveToFreeCell(dragged.card, dragged.columnIndex)) return false;
      commitDrag();
      return true;
    }
    if (!target.startsWith('column-')) return false;
    const destination = Number(target.slice('column-'.length));
    if (dragged.kind === 'freeCell') {
      if (!board.moveFromFreeCell(dragged.cellIndex, destination)) return false;
    } else {
      if (destination === dragged.columnIndex || !board.moveToColumn(run, dragged.columnIndex, destination)) return false;
    }
    commitDrag();
    return true;
  }, [board, motion, refresh, runFrom]));

  return (
    <div className="game" ref={motion.rootRef}>
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

      <section className="freecell__top" data-card-motion-source aria-label="Free cells and foundations">
        <div className="freecell__cells">
          {board.freeCells.map((card, cellIndex) =>
            card ? (
              <PlayingCard
                key={cellIndex}
                card={card}
                motionId={cardMotionId(card)}
                dropTarget={`freecell-${cellIndex}`}
                dragging={!!drag.data && drag.data.kind === 'freeCell' && drag.data.cellIndex === cellIndex}
                selected={
                  !!selection && selection.kind === 'freeCell' && selection.cellIndex === cellIndex
                }
                onClick={() => { if (!drag.consumeClick()) handleFreeCellClick(cellIndex); }}
                onPointerDown={(event) => drag.start({ kind: 'freeCell', cellIndex, card }, event)}
              />
            ) : (
              <CardSlot
                key={cellIndex}
                label=""
                srLabel="Empty free cell"
                dropTarget={`freecell-${cellIndex}`}
                playable={!!drag.data && drag.data.kind === 'column' && runFrom(drag.data.columnIndex, drag.data.card).length === 1}
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
                motionId={cardMotionId(top)}
                dropTarget={`foundation-${foundation.suit}`}
                playable={
                  !!selection &&
                  (selection.kind === 'freeCell'
                    ? board.freeCells[selection.cellIndex]?.suit === foundation.suit
                    : foundation.canAccept(selection.card))
                }
                onClick={() => { if (!drag.consumeClick()) handleFoundationClick(foundation.suit); }}
              />
            ) : (
              <CardSlot
                key={foundation.suit}
                label={SUIT_GLYPH[foundation.suit]}
                srLabel={`${suitName(foundation.suit)} foundation`}
                dropTarget={`foundation-${foundation.suit}`}
                playable={!!drag.data && drag.data.card.suit === foundation.suit && foundation.canAccept(drag.data.card)}
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
              <CardSlot label="" srLabel="Empty column" dropTarget={`column-${columnIndex}`} playable={!!drag.data && (drag.data.kind === 'freeCell' ? board.canMoveToColumn([drag.data.card], columnIndex) : board.canMoveToColumn(runFrom(drag.data.columnIndex, drag.data.card), columnIndex))} onClick={() => handleEmptyColumnClick(columnIndex)} />
            ) : (
              column.active.toArray().map((card) => (
                <PlayingCard
                  key={`${card.suit}-${card.rank}`}
                  card={card}
                  motionId={cardMotionId(card)}
                  dropTarget={`column-${columnIndex}`}
                  dragging={!!drag.data && drag.data.kind === 'column' && drag.data.columnIndex === columnIndex && sameCard(drag.data.card, card)}
                  selected={
                    !!selection &&
                    selection.kind === 'column' &&
                    selection.columnIndex === columnIndex &&
                    sameCard(selection.card, card)
                  }
                  playable={
                    !!drag.data
                    && (drag.data.kind === 'freeCell'
                      ? board.canMoveToColumn([drag.data.card], columnIndex)
                      : drag.data.columnIndex !== columnIndex
                        && board.canMoveToColumn(runFrom(drag.data.columnIndex, drag.data.card), columnIndex))
                  }
                  onClick={() => { if (!drag.consumeClick()) handleColumnCardClick(columnIndex, card); }}
                  onPointerDown={(event) => drag.start({ kind: 'column', columnIndex, card }, event)}
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

      <section className="game__how-to" aria-labelledby="freecell-how-to">
        <h2 id="freecell-how-to">How to play</h2>
        <ol>
          <li>Move every card to its matching foundation, ace through king.</li>
          <li>Build tableau runs down by rank with alternating colours.</li>
          <li>Use free cells as temporary parking spaces and empty columns to move longer runs.</li>
          <li>Click to place a selected card or run, or drag it to a highlighted legal destination.</li>
        </ol>
      </section>
    </div>
  );
}

/* colorOf is imported for future rendering needs; referenced to keep the
   import intentional and satisfy strict unused-import checks if enabled. */
void colorOf;
