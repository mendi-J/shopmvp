'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useTrackLens } from '../../hooks/useTrackLens';
import { wishlistAPI } from '../../lib/api';
import { Heart, ShoppingCart, Loader, Package, Trash2 } from 'lucide-react';

export default function WishlistPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { addItem } = useCart();
  const router = useRouter();
  const { track, page } = useTrackLens();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      page('Wishlist', { url: window.location.href });
      track('Page Viewed', { page: 'wishlist' });
      wishlistAPI.list()
        .then((res) => setItems(res.data.data))
        .catch(() => toast.error('Failed to load wishlist'))
        .finally(() => setLoading(false));
    }
  }, [authLoading, isAuthenticated]);

  const handleAddToCart = async (product) => {
    setAddingId(product.id);
    try {
      await addItem(product.id, 1);
      track('Add To Cart', { productId: product.id, name: product.name, price: parseFloat(product.price), source: 'wishlist' });
      toast.success(`${product.name} added to cart!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAddingId(null);
    }
  };

  const handleRemove = async (productId, productName) => {
    setRemovingId(productId);
    try {
      await wishlistAPI.remove(productId);
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      track('Wishlist Item Removed', { productId, name: productName });
      toast.success('Removed from wishlist');
    } catch {
      toast.error('Failed to remove item');
    } finally {
      setRemovingId(null);
    }
  };

  if (authLoading || loading) {
    return <div className="flex justify-center py-24"><Loader className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Wishlist
          {items.length > 0 && <span className="text-gray-400 font-normal text-lg ml-2">({items.length})</span>}
        </h1>
      </div>

      {items.length === 0 ? (
        <div className="card p-16 text-center">
          <Heart className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">Your wishlist is empty</h2>
          <p className="text-gray-400 mb-8 text-sm">Save products you love and come back to them later</p>
          <Link href="/products" className="btn-primary inline-flex items-center gap-2 py-3 px-8">
            <Package className="w-4 h-4" /> Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(({ productId, product, id }) => (
            <div key={id} className="card overflow-hidden group">
              <Link href={`/products/${product.id}`} className="block relative aspect-square bg-gray-100 dark:bg-gray-800">
                {product.image ? (
                  <Image src={product.image} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                  </div>
                )}
                {!product.isActive || product.stock === 0 ? (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-xs font-bold px-3 py-1 rounded-full">Out of Stock</span>
                  </div>
                ) : null}
              </Link>
              <div className="p-4">
                <Link href={`/products/${product.id}`} className="font-semibold text-sm text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 line-clamp-2 mb-1 block">
                  {product.name}
                </Link>
                <p className="text-xs text-gray-400 mb-3">{product.category}</p>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-indigo-600 dark:text-indigo-400">${parseFloat(product.price).toFixed(2)}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRemove(product.id, product.name)}
                      disabled={removingId === product.id}
                      className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={addingId === product.id || !product.isActive || product.stock === 0}
                      className="flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      {addingId === product.id ? 'Adding...' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
