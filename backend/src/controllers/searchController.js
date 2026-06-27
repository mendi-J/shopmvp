const prisma = require('../config/prisma');

const globalSearch = async (req, res, next) => {
  try {
    const { q, types } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Query must be at least 2 characters' });
    }

    const query = q.trim();
    const searchTypes = types ? types.split(',') : ['products', 'orders'];
    const userId = req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    const results = {};

    if (searchTypes.includes('products')) {
      results.products = await prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 8,
        select: { id: true, name: true, price: true, category: true, image: true },
      });
    }

    if (searchTypes.includes('orders')) {
      const orderWhere = {
        OR: [
          { orderNumber: { contains: query, mode: 'insensitive' } },
          { shippingName: { contains: query, mode: 'insensitive' } },
        ],
        ...(isAdmin ? {} : { userId }),
      };

      results.orders = await prisma.order.findMany({
        where: orderWhere,
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, orderNumber: true, status: true, totalAmount: true, createdAt: true },
      });
    }

    res.json({ success: true, data: { query, results } });
  } catch (error) {
    next(error);
  }
};

const getSavedSearches = async (req, res, next) => {
  try {
    const searches = await prisma.savedSearch.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json({ success: true, data: searches });
  } catch (error) {
    next(error);
  }
};

const saveSearch = async (req, res, next) => {
  try {
    const { query, filters } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ success: false, message: 'Query is required' });
    }

    const count = await prisma.savedSearch.count({ where: { userId: req.user.id } });
    if (count >= 10) {
      // Remove oldest to make room
      const oldest = await prisma.savedSearch.findFirst({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'asc' },
      });
      await prisma.savedSearch.delete({ where: { id: oldest.id } });
    }

    const saved = await prisma.savedSearch.create({
      data: { userId: req.user.id, query: query.trim(), filters: filters || null },
    });

    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    next(error);
  }
};

const deleteSavedSearch = async (req, res, next) => {
  try {
    const existing = await prisma.savedSearch.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Saved search not found' });
    }

    await prisma.savedSearch.delete({ where: { id: req.params.id } });

    res.json({ success: true, message: 'Saved search deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { globalSearch, getSavedSearches, saveSearch, deleteSavedSearch };
