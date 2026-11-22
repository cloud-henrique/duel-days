// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { useCardDrag, type DropZone } from './useCardDrag';
import { DECK_PACING } from './pacing';

function Harness({ onDrop }: { onDrop: (c: number, f: DropZone, t: DropZone) => boolean }) {
  const { bind, dragging } = useCardDrag(onDrop, true);
  return <div><button data-testid="card" {...bind(7, 'trunk')}>carta</button><i data-testid="state">{dragging ?? 'nada'}</i></div>;
}
const move = (x: number, y: number) => act(() => { window.dispatchEvent(new PointerEvent('pointermove', { clientX: x, clientY: y, pointerId: 1 })); });

afterEach(() => { cleanup(); vi.useRealTimers(); document.getElementById('drag-layer')?.remove(); });

describe('arrastar cartas', () => {
  it('com mouse, arma ao mover, sem esperar', () => {
    const { getByTestId } = render(<Harness onDrop={() => true} />);
    fireEvent.pointerDown(getByTestId('card'), { button: 0, pointerType: 'mouse', pointerId: 1, clientX: 10, clientY: 10 });
    move(10 + DECK_PACING.mouseSlopPx + 2, 10);
    expect(getByTestId('state').textContent).toBe('trunk');
  });

  it('com mouse, um clique sem mover não arma', () => {
    vi.useFakeTimers();
    const { getByTestId } = render(<Harness onDrop={() => true} />);
    fireEvent.pointerDown(getByTestId('card'), { button: 0, pointerType: 'mouse', pointerId: 1, clientX: 10, clientY: 10 });
    act(() => { vi.advanceTimersByTime(DECK_PACING.holdMs + 50); });
    expect(getByTestId('state').textContent).toBe('nada');
  });

  it('com dedo, continua esperando segurar; mexer antes é rolagem', () => {
    vi.useFakeTimers();
    const { getByTestId } = render(<Harness onDrop={() => true} />);
    fireEvent.pointerDown(getByTestId('card'), { button: 0, pointerType: 'touch', pointerId: 1, clientX: 10, clientY: 10 });
    move(10 + DECK_PACING.mouseSlopPx + 2, 10); // menos que o slop do toque: nada ainda
    expect(getByTestId('state').textContent).toBe('nada');
    act(() => { vi.advanceTimersByTime(DECK_PACING.holdMs); });
    expect(getByTestId('state').textContent).toBe('trunk');
  });
});
