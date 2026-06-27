import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../contexts/AuthContext';
import { CartProvider } from '../contexts/CartContext';
import Navbar from '../components/Navbar';
import TrackLensProvider from '../components/TrackLensProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'ShopMVP — Your One-Stop Shop',
  description: 'Discover amazing products at great prices with fast delivery and easy returns.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TrackLensProvider />
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main className="min-h-screen">{children}</main>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: { borderRadius: '10px', background: '#1f2937', color: '#f9fafb' },
                success: { iconTheme: { primary: '#4f46e5', secondary: '#f9fafb' } },
              }}
            />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
