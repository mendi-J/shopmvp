const prisma = require('../config/prisma');

const getProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 12, 50);
    const category = req.query.category;
    const skip = (page - 1) * limit;

    const where = { isActive: true };
    if (category) where.category = category;

    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.product.count({ where }),
    ]);

    const categories = await prisma.product.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });

    res.json({
      success: true,
      data: {
        products,
        categories: categories.map((c) => c.category),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id, isActive: true },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

const searchProducts = async (req, res, next) => {
  try {
    const { q, category } = req.query;

    if (!q || q.trim().length < 1) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    const where = {
      isActive: true,
      OR: [
        { name: { contains: q.trim(), mode: 'insensitive' } },
        { description: { contains: q.trim(), mode: 'insensitive' } },
        { category: { contains: q.trim(), mode: 'insensitive' } },
      ],
    };

    if (category) where.category = category;

    const products = await prisma.product.findMany({
      where,
      take: 20,
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: { products, total: products.length, query: q },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProducts, getProductById, searchProducts };
