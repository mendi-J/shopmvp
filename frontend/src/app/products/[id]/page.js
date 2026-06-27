'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { productsAPI } from '../../../lib/api';
import { useCart } from '../../../contexts/CartContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useTrackLens } from '../../../hooks/useTrackLens';
import {
  ShoppingCart,
  ArrowLeft,
  Star,
  Truck,
  ShieldCheck,
  Package,
  Minus,
  Plus,
  Loader,
  RefreshCw,
} from 'lucide-react';

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const { track, page } = useTrackLens();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    productsAPI
      .getById(id)
      .then((res) => {
        const p = res.data.data;
        setProduct(p);
        page('Product Detail', { url: window.location.href, productId: id });
        track('Product Viewed', { productId: p.id, name: p.name, category: p.category, price: parseFloat(p.price) });
      })
      .catch(() => router.push('/products'))
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    try {
      setAdding(true);
      await addItem(product.id, quantity);
      track('Add To Cart', { productId: product.id, name: product.name, price: parseFloat(product.price), quantity, category: product.category });
      toast.success(`${quantity} × ${product.name} added to cart!`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!product) return null;

  const isOutOfStock = product.stock === 0;
  const price = parseFloat(product.price);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/products"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Products
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Image */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-sm">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
              <Package className="w-24 h-24 text-indigo-200" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <span className="inline-block bg-indigo-100 text-indigo-700 text-sm font-semibold px-3 py-1 rounded-full mb-4 w-fit">
            {product.category}
          </span>

          <h1 className="text-3xl font-extrabold text-gray-900 mb-3 leading-tight">
            {product.name}
          </h1>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-current" />
              ))}
            </div>
            <span className="text-sm text-gray-500">4.5 · 128 reviews</span>
          </div>

          <p className="text-3xl font-bold text-indigo-600 mb-5">${price.toFixed(2)}</p>

          <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>

          {/* Stock status */}
          <div className="flex items-center gap-2 mb-6">
            <div
              className={`w-2.5 h-2.5 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}
            />
            <span
              className={`text-sm font-medium ${product.stock > 0 ? 'text-green-700' : 'text-red-600'}`}
            >
              {product.stock > 0
                ? `In Stock (${product.stock} available)`
                : 'Out of Stock'}
            </span>
          </div>

          {/* Quantity selector */}
          {!isOutOfStock && (
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm font-semibold text-gray-700">Quantity:</span>
              <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2.5 hover:bg-gray-100 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-5 py-2 font-bold text-gray-900 min-w-[3rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="px-3 py-2.5 hover:bg-gray-100 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-sm text-gray-500">
                Total: <span className="font-bold text-gray-800">${(price * quantity).toFixed(2)}</span>
              </span>
            </div>
          )}

          {/* Add to cart button */}
          <button
            onClick={handleAddToCart}
            disabled={adding || isOutOfStock}
            className="flex items-center justify-center gap-3 bg-indigo-600 text-white font-bold py-4 px-8 rounded-xl hover:bg-indigo-700 active:bg-indigo-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4 text-base shadow-lg shadow-indigo-100"
          >
            <ShoppingCart className="w-5 h-5" />
            {adding ? 'Adding...' : isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </button>

          {/* Feature chips */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Truck, text: 'Free delivery over $50' },
              { icon: ShieldCheck, text: 'Secure checkout' },
              { icon: RefreshCw, text: '30-day returns' },
              { icon: Package, text: 'Quality guaranteed' },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-2.5 p-3 bg-gray-50 border border-gray-100 rounded-xl"
              >
                <Icon className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span className="text-xs text-gray-600 font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
