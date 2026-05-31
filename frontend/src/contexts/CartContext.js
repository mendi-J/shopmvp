'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartAPI } from '../lib/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const EMPTY_SUMMARY = { subtotal: 0, tax: 0, deliveryFee: 0, total: 0, itemCount: 0 };

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState({ items: [] });
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart({ items: [] });
      setSummary(EMPTY_SUMMARY);
      return;
    }
    try {
      setLoading(true);
      const res = await cartAPI.get();
      if (res.data.success) {
        setCart(res.data.data.cart);
        setSummary(res.data.data.summary);
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItem = async (productId, quantity = 1) => {
    const res = await cartAPI.addItem(productId, quantity);
    await fetchCart();
    return res;
  };

  const updateItem = async (productId, quantity) => {
    const res = await cartAPI.updateItem(productId, quantity);
    await fetchCart();
    return res;
  };

  const removeItem = async (productId) => {
    const res = await cartAPI.removeItem(productId);
    await fetchCart();
    return res;
  };

  const clearCart = async () => {
    await cartAPI.clear();
    setCart({ items: [] });
    setSummary(EMPTY_SUMMARY);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        summary,
        loading,
        fetchCart,
        addItem,
        updateItem,
        removeItem,
        clearCart,
        itemCount: summary.itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
