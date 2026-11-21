/**
 * Ícones do jogo por conceito, numa tabela só (a mesma escolha do `GAME_ICONS` do app nativo): Phosphor no estilo cheio
 * (MIT) e a lápide do cemitério do Material Design Icons (`grave-stone`, Apache 2.0), porque o Phosphor não tem uma.
 * As telas pedem o conceito (`<GameIcon name="dp" />`), nunca o desenho.
 *
 * `big`: o tratamento do *Duel Links* para ícones grandes e sozinhos (degradê branco → ciano, contorno marinho e um
 * brilho fraco). Ao lado de texto, o ícone fica numa cor só, a do texto (`currentColor`).
 *
 * Os ícones das ações de carta (Invocar, Baixar...) ficam no `CardSheet`: foram escolhidos um a um no labeler.
 */
import { useId, type ComponentType } from 'react';
import {
  ArrowCircleRight, ArrowCounterClockwise, ArrowsDownUp, Books, CalendarBlank, CardsThree, CaretLeft, CaretRight, Cards,
  ChatCircleDots, Check, CheckFat, ClockCounterClockwise, Coins, Crown, DotsThreeCircle, Eye, Flag, GameController,
  GearSix, Gift, GraduationCap, Hamburger, Heart, IdentificationCard, List, Lock, MagnifyingGlass, MapPin, MapTrifold,
  Minus, MusicNotes, Package, Plus, Question, ShoppingCart, SpeakerHigh, SpeakerSlash, Spade, Sparkle, Stack, Storefront,
  SkipForward, Sword, Trash, Tree, Trophy, User, Warning, X, CaretDown, Shield, MagicWand, Mountains, Spiral, type IconProps,
} from '@phosphor-icons/react';
import './icons.css';

/** A lápide do cemitério (Material Design Icons `grave-stone`, Apache 2.0), no mesmo formato dos ícones do Phosphor. */
function GraveStone({ size = 24, color = 'currentColor', ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color} {...(rest as object)}>
      <path d="M10,2H14C17.31,2 19,4.69 19,8V18.66C16.88,17.63 15.07,17 12,17C8.93,17 7.12,17.63 5,18.66V8C5,4.69 6.69,2 10,2M8,8V9.5H16V8H8M9,12V13.5H15V12H9M3,22V21.31C5.66,19.62 13.23,15.84 21,21.25V22H3Z" />
    </svg>
  );
}

/** Conceito → desenho. Um conceito tem sempre o mesmo ícone em todas as telas. */
export const GAME_ICONS = {
  // Jogo
  duel: Sword, deck: Stack, extraDeck: CardsThree, graveyard: GraveStone, hand: Cards, collection: Books,
  shop: Storefront, buy: ShoppingCart, pack: Cards, box: Package, gift: Gift, dp: Coins,
  campaign: MapTrifold, history: ClockCounterClockwise, calendar: CalendarBlank,
  boss: Crown, trophy: Trophy, lock: Lock, status: IdentificationCard, profile: User,
  settings: GearSix, soundOn: SpeakerHigh, soundOff: SpeakerSlash, music: MusicNotes, logo: Spade,
  heart: Heart, talk: ChatCircleDots,
  // Lugares do campo (zonas vazias e pilhas do duelo)
  monsterZone: Shield, spellZone: MagicWand, fieldZone: Mountains, banished: Spiral,
  // Lugares
  school: GraduationCap, burger: Hamburger, arcade: GameController, park: Tree, mapPin: MapPin,
  // Controles e avisos
  close: X, chevron: CaretRight, back: CaretLeft, check: Check, deckReady: CheckFat, plus: Plus, minus: Minus,
  delete: Trash, warning: Warning, search: MagnifyingGlass, sort: ArrowsDownUp, more: DotsThreeCircle, menu: List,
  newGame: ArrowCounterClockwise, start: ArrowCircleRight, viewField: Eye, revealAll: Sparkle, surrender: Flag,
  question: Question, skip: SkipForward, next: CaretDown,
} satisfies Record<string, ComponentType<IconProps>>;

export type GameIconName = keyof typeof GAME_ICONS;

/** Ícone de um conceito do jogo. `label` dá nome ao ícone sozinho (sem texto ao lado); sem ele, é decorativo. */
export function GameIcon({ name, size = 20, big = false, label, className }: { name: GameIconName; size?: number; big?: boolean; label?: string; className?: string }) {
  const Icon = GAME_ICONS[name];
  const gid = `gi-${useId().replace(/:/g, '')}`;
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };
  if (!big) return <Icon size={size} weight="fill" className={`game-icon${className ? ` ${className}` : ''}`} {...a11y} />;
  // O degradê precisa de um <defs> próprio: o Phosphor pinta com `color`, que aceita `url(#id)`.
  return (
    <span className={`game-icon big${className ? ` ${className}` : ''}`} style={{ width: size, height: size }} {...a11y}>
      <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" /><stop offset=".55" stopColor="#9fe3ff" /><stop offset="1" stopColor="#2ab8ff" />
          </linearGradient>
        </defs>
      </svg>
      <Icon size={size} weight="fill" color={`url(#${gid})`} />
    </span>
  );
}
