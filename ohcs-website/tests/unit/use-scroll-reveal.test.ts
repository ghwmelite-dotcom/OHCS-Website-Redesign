import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';

describe('useScrollReveal', () => {
  let observeMock: ReturnType<typeof vi.fn>;
  let disconnectMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    observeMock = vi.fn();
    disconnectMock = vi.fn();

    vi.stubGlobal(
      'IntersectionObserver',
      vi.fn(function (this: unknown, callback: IntersectionObserverCallback) {
        (globalThis as Record<string, unknown>).__ioCallback = callback;
        return { observe: observeMock, disconnect: disconnectMock };
      }),
    );
  });

  it('returns ref and isVisible (initially false)', () => {
    const { result } = renderHook(() => useScrollReveal());
    expect(result.current.isVisible).toBe(false);
    expect(result.current.ref).toBeDefined();
  });

  it('uses the provided threshold', () => {
    renderHook(() => useScrollReveal(0.3));
    expect(IntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      { threshold: 0.3 },
    );
  });

  it('disconnects on unmount', () => {
    const { unmount } = renderHook(() => useScrollReveal());
    unmount();
    expect(disconnectMock).toHaveBeenCalled();
  });
});
