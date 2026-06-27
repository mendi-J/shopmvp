const prisma = require('../config/prisma');

const list = async (req, res, next) => {
  try {
    const items = await prisma.wishlist.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: { id: true, name: true, price: true, image: true, category: true, stock: true, isActive: true },
        },
      },
    });

    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

const add = async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'productId is required' });
    }

    const product = await prisma.product.findFirst({ where: { id: productId, isActive: true } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const existing = await prisma.wishlist.findUnique({
      where: { userId_productId: { userId: req.user.id, productId } },
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Already in wishlist' });
    }

    const item = await prisma.wishlist.create({
      data: { userId: req.user.id, productId },
      include: {
        product: { select: { id: true, name: true, price: true, image: true, category: true } },
      },
    });

    res.status(201).json({ success: true, message: 'Added to wishlist', data: item });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const existing = await prisma.wishlist.findFirst({
      where: { productId: req.params.productId, userId: req.user.id },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Item not in wishlist' });
    }

    await prisma.wishlist.delete({ where: { id: existing.id } });

    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (error) {
    next(error);
  }
};

module.exports = { list, add, remove };
