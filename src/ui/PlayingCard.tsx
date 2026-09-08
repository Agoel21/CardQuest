/**
 * A single rendered playing card.
 *
 * Card faces come from the project's own 52 PNG assets. They are resolved
 * eagerly through import.meta.glob so Vite fingerprints and bundles them
 * rather than us hand-writing 52 imports.
 */
import { Card, assetName, cardLabel } from '../engine';
import './PlayingCard.css';

const faces = import.meta.glob<string>('../assets/cards/*.png', {
  eager: true,
  import: 'default',
});

function faceUrl(name: string): string | undefined {
  return faces[`../assets/cards/${name}.png`];
}

export interface PlayingCardProps {
  card?: Card | undefined;
  faceDown?: boolean;
  selected?: boolean;
  playable?: boolean;
  dragging?: boolean;
  flipIn?: boolean;
  motionId?: string | undefined;
  dropTarget?: string | undefined;
  onClick?: (() => void) | undefined;
  onPointerDown?: ((event: React.PointerEvent<HTMLButtonElement>) => void) | undefined;
}

export function PlayingCard({
  card,
  faceDown = false,
  selected = false,
  playable = false,
  dragging = false,
  flipIn = false,
  motionId,
  dropTarget,
  onClick,
  onPointerDown,
}: PlayingCardProps) {
  const showBack = faceDown || !card;
  const frontSrc = card ? faceUrl(assetName(card)) : faceUrl('card_back');
  const label = showBack ? 'Face-down card' : cardLabel(card);

  const className = [
    'playing-card',
    showBack ? 'is-facedown' : 'is-faceup',
    selected ? 'is-selected' : '',
    playable ? 'is-playable' : '',
    dragging ? 'is-dragging' : '',
    flipIn ? 'is-flip-in' : '',
    onClick || onPointerDown ? 'is-interactive' : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (!onClick && !onPointerDown) {
    return (
      <div className={className} data-card-motion-id={motionId} data-drop-target={dropTarget}>
        <div className="playing-card__flip">
          <img className="playing-card__face playing-card__face--front" src={frontSrc} alt={label} draggable={false} />
          <img className="playing-card__face playing-card__face--back" src={faceUrl('card_back')} alt="" draggable={false} />
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={className}
      data-card-motion-id={motionId}
      data-drop-target={dropTarget}
      onClick={onClick}
      onPointerDown={onPointerDown}
    >
      <div className="playing-card__flip">
        <img className="playing-card__face playing-card__face--front" src={frontSrc} alt="" draggable={false} />
        <img className="playing-card__face playing-card__face--back" src={faceUrl('card_back')} alt="" draggable={false} />
      </div>
      <span className="visually-hidden">{label}</span>
    </button>
  );
}

/** An empty drop target, e.g. a foundation slot or a cleared column. */
export function CardSlot({
  label,
  srLabel,
  onClick,
  children,
  dropTarget,
  playable = false,
}: {
  /** Short visible label. Keep it to a glyph or one word so it fits. */
  label: string;
  /** Fuller name announced to screen readers when `label` is only a glyph. */
  srLabel?: string;
  onClick?: (() => void) | undefined;
  children?: React.ReactNode;
  dropTarget?: string;
  playable?: boolean;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      className={`card-slot${playable ? ' is-playable' : ''}`}
      onClick={onClick}
      data-drop-target={dropTarget}
      {...(onClick ? { type: 'button' as const } : {})}
      {...(srLabel ? { 'aria-label': srLabel } : {})}
    >
      {children ?? (
        <span className="card-slot__label" aria-hidden={srLabel ? true : undefined}>
          {label}
        </span>
      )}
    </Tag>
  );
}
