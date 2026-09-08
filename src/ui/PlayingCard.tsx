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
  onClick?: (() => void) | undefined;
}

export function PlayingCard({
  card,
  faceDown = false,
  selected = false,
  playable = false,
  onClick,
}: PlayingCardProps) {
  const showBack = faceDown || !card;
  const src = showBack ? faceUrl('card_back') : faceUrl(assetName(card));
  const label = showBack ? 'Face-down card' : cardLabel(card);

  const className = [
    'playing-card',
    showBack ? 'is-facedown' : 'is-faceup',
    selected ? 'is-selected' : '',
    playable ? 'is-playable' : '',
    onClick ? 'is-interactive' : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (!onClick) {
    return (
      <div className={className}>
        <img src={src} alt={label} draggable={false} />
      </div>
    );
  }

  return (
    <button type="button" className={className} onClick={onClick}>
      <img src={src} alt="" draggable={false} />
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
}: {
  /** Short visible label. Keep it to a glyph or one word so it fits. */
  label: string;
  /** Fuller name announced to screen readers when `label` is only a glyph. */
  srLabel?: string;
  onClick?: (() => void) | undefined;
  children?: React.ReactNode;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      className="card-slot"
      onClick={onClick}
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
