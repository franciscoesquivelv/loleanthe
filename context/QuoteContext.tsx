'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { QuoteItem } from '@/lib/types';

interface QuoteContextType {
  items: QuoteItem[];
  addToQuote: (item: QuoteItem) => void;
  removeFromQuote: (flowerId: string) => void;
  clearQuote: () => void;
  isInQuote: (flowerId: string) => boolean;
  count: number;
}

const QuoteContext = createContext<QuoteContextType | null>(null);

export function QuoteProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<QuoteItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('loleanthe_quote');
    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('loleanthe_quote', JSON.stringify(items));
  }, [items]);

  const addToQuote = (item: QuoteItem) => {
    setItems((prev) => {
      if (prev.find((i) => i.flowerId === item.flowerId)) return prev;
      return [...prev, item];
    });
  };

  const removeFromQuote = (flowerId: string) => {
    setItems((prev) => prev.filter((i) => i.flowerId !== flowerId));
  };

  const clearQuote = () => setItems([]);

  const isInQuote = (flowerId: string) => items.some((i) => i.flowerId === flowerId);

  return (
    <QuoteContext.Provider value={{ items, addToQuote, removeFromQuote, clearQuote, isInQuote, count: items.length }}>
      {children}
    </QuoteContext.Provider>
  );
}

export function useQuote() {
  const ctx = useContext(QuoteContext);
  if (!ctx) throw new Error('useQuote must be used within QuoteProvider');
  return ctx;
}
