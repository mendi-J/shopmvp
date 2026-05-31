const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const products = [
  {
    name: 'Premium Wireless Headphones',
    description: 'Experience crystal-clear audio with our premium wireless headphones. Features active noise cancellation, 30-hour battery life, and comfortable over-ear design perfect for work and travel.',
    price: 89.99,
    stock: 50,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
  },
  {
    name: 'Mechanical Gaming Keyboard',
    description: 'Tactile feedback mechanical switches with RGB backlit keys, anti-ghosting technology, and USB-C connectivity. Perfect for gaming and professional typing with 100% key rollover.',
    price: 119.99,
    stock: 30,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500&q=80',
  },
  {
    name: 'Smart Watch Pro',
    description: 'Track your fitness, receive notifications, and monitor your health with this advanced smartwatch. Features heart rate monitoring, GPS, sleep tracking, and water-resistance up to 50m.',
    price: 199.99,
    stock: 25,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80',
  },
  {
    name: 'Wireless Charging Pad',
    description: 'Fast 15W wireless charging pad compatible with all Qi-enabled devices. Ultra-slim design with LED indicator and foreign object detection for safe charging.',
    price: 24.99,
    stock: 75,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1586816879360-004f5b0c51e3?w=500&q=80',
  },
  {
    name: 'Bluetooth Speaker',
    description: 'Portable 360° surround sound speaker with 20-hour battery life, IPX7 waterproof rating, and built-in microphone for hands-free calls. Perfect for outdoor adventures.',
    price: 49.99,
    stock: 45,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&q=80',
  },
  {
    name: 'Leather Crossbody Bag',
    description: 'Handcrafted genuine leather crossbody bag with multiple compartments, adjustable strap, and magnetic closure. Fits a tablet and all your daily essentials in style.',
    price: 59.99,
    stock: 40,
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&q=80',
  },
  {
    name: 'Running Shoes Pro',
    description: 'Lightweight, breathable running shoes with advanced cushioning technology and responsive foam midsole for maximum comfort on long runs. Available in multiple colors.',
    price: 79.99,
    stock: 60,
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
  },
  {
    name: 'Laptop Backpack',
    description: 'Water-resistant laptop backpack with USB charging port, fits up to 17-inch laptops, 30L capacity with multiple organizational pockets and padded shoulder straps.',
    price: 54.99,
    stock: 40,
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80',
  },
  {
    name: 'Stainless Steel Water Bottle',
    description: 'Vacuum-insulated stainless steel bottle keeps drinks cold for 24 hours or hot for 12 hours. BPA-free, leak-proof lid with carry handle. Fits most cup holders.',
    price: 29.99,
    stock: 100,
    category: 'Home & Kitchen',
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&q=80',
  },
  {
    name: 'Ceramic Coffee Mug Set',
    description: 'Set of 4 handcrafted ceramic mugs with 14oz capacity each. Beautiful matte finish available in earthy tones. Microwave and dishwasher safe. Perfect housewarming gift.',
    price: 39.99,
    stock: 45,
    category: 'Home & Kitchen',
    image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=500&q=80',
  },
  {
    name: 'Scented Soy Candle Set',
    description: 'Set of 3 hand-poured soy candles in relaxing lavender, warm vanilla, and refreshing eucalyptus scents. Burns for 45+ hours each with cotton wicks for a clean flame.',
    price: 34.99,
    stock: 55,
    category: 'Home & Kitchen',
    image: 'https://images.unsplash.com/photo-1603905839741-a5d7fc2cbe66?w=500&q=80',
  },
  {
    name: 'Organic Cotton Yoga Mat',
    description: 'Eco-friendly, non-slip yoga mat made from organic cotton and natural rubber. 6mm thickness for joint support. Perfect for yoga, pilates, and stretching exercises.',
    price: 45.99,
    stock: 35,
    category: 'Sports',
    image: 'https://images.unsplash.com/photo-1601925228689-b0d9eed1cf56?w=500&q=80',
  },
  {
    name: 'Resistance Band Set',
    description: 'Set of 5 heavy-duty resistance bands with varying resistance levels (10-50 lbs). Includes door anchor, ankle straps, and handles. Perfect for full-body home workouts.',
    price: 19.99,
    stock: 80,
    category: 'Sports',
    image: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=500&q=80',
  },
  {
    name: 'Adjustable Dumbbells',
    description: 'Space-saving adjustable dumbbells that replace 15 sets of weights. Quick-select dial from 5-52.5 lbs in 2.5 lb increments. Ergonomic handle with secure weight system.',
    price: 299.99,
    stock: 15,
    category: 'Sports',
    image: 'https://images.unsplash.com/photo-1638805981949-26c10f4b44e4?w=500&q=80',
  },
  {
    name: 'Wireless Earbuds Pro',
    description: 'True wireless earbuds with hybrid active noise cancellation, 8-hour battery life (32 hours with case), IPX4 water resistance, and adaptive transparency mode.',
    price: 149.99,
    stock: 38,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&q=80',
  },
  {
    name: 'Minimalist Analog Watch',
    description: 'Elegant minimalist watch with genuine leather strap, Japanese quartz movement, and scratch-resistant sapphire crystal. Water resistant to 30m. Timeless design for any occasion.',
    price: 129.99,
    stock: 20,
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500&q=80',
  },
];

async function seed() {
  console.log('🌱 Starting database seed...\n');

  console.log('Clearing existing data...');
  await prisma.oTP.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  console.log(`Creating ${products.length} products...`);
  const createdProducts = [];
  for (const p of products) {
    const created = await prisma.product.create({ data: p });
    createdProducts.push(created);
  }
  console.log(`✅ Created ${createdProducts.length} products`);

  const hashedPassword = await bcrypt.hash('password123', 12);
  const testUser = await prisma.user.create({
    data: {
      email: 'test@example.com',
      phone: '+1234567890',
      firstName: 'John',
      lastName: 'Doe',
      password: hashedPassword,
      isVerified: true,
      role: 'USER',
    },
  });
  console.log(`✅ Created test user: ${testUser.email} / password123`);

  const adminPassword = await bcrypt.hash('admin123', 12);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@shopmvp.com',
      firstName: 'Shop',
      lastName: 'Admin',
      password: adminPassword,
      isVerified: true,
      role: 'ADMIN',
    },
  });
  console.log(`✅ Created admin user: ${adminUser.email} / admin123`);

  console.log('\n🎉 Seed complete!\n');
  console.log('Test credentials:');
  console.log('  Customer — Email: test@example.com / password123');
  console.log('  Admin    — Email: admin@shopmvp.com / admin123\n');
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
