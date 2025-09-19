import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { TranslationProvider, useTranslation } from '../src/context/TranslationContext';
import '@testing-library/jest-dom';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('TranslationContext', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it('should add to history and persist to localStorage', async () => {
    const TestComponent = () => {
      const { addToHistory } = useTranslation();
      return (
        <button onClick={() => addToHistory({ query: 'test', language: 'es' })}>
          Add to history
        </button>
      );
    };

    const { getByText } = render(
      <TranslationProvider>
        <TestComponent />
      </TranslationProvider>
    );

    fireEvent.click(getByText('Add to history'));

    await waitFor(() => {
      expect(mockLocalStorage.getItem('translation-history')).toBeTruthy();
    });

    const stored = JSON.parse(mockLocalStorage.getItem('translation-history') || '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].query).toBe('test');
  });

  it('should add to favorites and check if in favorites', async () => {
    const TestComponent = () => {
      const { addToFavorites, isInFavorites } = useTranslation();
      const [isFav, setIsFav] = React.useState(false);

      React.useEffect(() => {
        setIsFav(isInFavorites('test', 'es'));
      }, [isInFavorites]);

      return (
        <div>
          <button onClick={() => addToFavorites({ query: 'test', language: 'es' })}>
            Add to favorites
          </button>
          <p data-testid="is-fav">{isFav.toString()}</p>
        </div>
      );
    };

    const { getByText, getByTestId } = render(
      <TranslationProvider>
        <TestComponent />
      </TranslationProvider>
    );

    fireEvent.click(getByText('Add to favorites'));

    await waitFor(() => {
      expect(getByTestId('is-fav')).toHaveTextContent('true');
    });
  });

  it('should load from localStorage on mount', async () => {
    mockLocalStorage.setItem('translation-history', JSON.stringify([{ id: '1', query: 'saved', language: 'es', timestamp: new Date().toISOString() }]));
    mockLocalStorage.setItem('translation-favorites', JSON.stringify([]));

    const TestComponent = () => {
      const { state } = useTranslation();
      return <p data-testid="history-length">{state.history.length}</p>;
    };

    const { getByTestId } = render(
      <TranslationProvider>
        <TestComponent />
      </TranslationProvider>
    );

    await waitFor(() => {
      expect(getByTestId('history-length')).toHaveTextContent('1');
    });
  });
});