const prisma = require('../config/prisma');
const { sendOrderStatusEmail } = require('../services/emailService');

const getDashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalOrders,
      todayOrders,
      weekOrders,
      ordersByStatus,
      revenueResult,
      weekRevenueResult,
      monthRevenueResult,
      recentOrders,
      totalCustomers,
      topProducts,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.order.count({ where: { createdAt: { gte: startOfWeek } } }),
      prisma.order.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.order.aggregate({
        where: { paymentStatus: 'COMPLETED' },
        _sum: { totalAmount: true },
      }),
      prisma.order.aggregate({
        where: { paymentStatus: 'COMPLETED', createdAt: { gte: startOfWeek } },
        _sum: { totalAmount: true },
      }),
      prisma.order.aggregate({
        where: { paymentStatus: 'COMPLETED', createdAt: { gte: startOfMonth } },
        _sum: { totalAmount: true },
      }),
      prisma.order.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          items: { select: { quantity: true } },
        },
      }),
      prisma.user.count({ where: { role: 'USER', isVerified: true } }),
      prisma.orderItem.groupBy({
        by: ['productId', 'name'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ]);

    const statusMap = Object.fromEntries(
      ordersByStatus.map((s) => [s.status, s._count.id])
    );

    res.json({
      success: true,
      data: {
        stats: {
          totalOrders,
          todayOrders,
          weekOrders,
          totalRevenue: parseFloat(revenueResult._sum.totalAmount || 0),
          weekRevenue: parseFloat(weekRevenueResult._sum.totalAmount || 0),
          monthRevenue: parseFloat(monthRevenueResult._sum.totalAmount || 0),
          totalCustomers,
          pending: statusMap.PENDING || 0,
          processing: statusMap.PROCESSING || 0,
          shipped: statusMap.SHIPPED || 0,
          delivered: statusMap.DELIVERED || 0,
          cancelled: statusMap.CANCELLED || 0,
        },
        recentOrders: recentOrders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          customer: `${o.user.firstName} ${o.user.lastName}`,
          email: o.user.email,
          itemCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
          totalAmount: parseFloat(o.totalAmount),
          status: o.status,
          paymentStatus: o.paymentStatus,
          createdAt: o.createdAt,
        })),
        topProducts: topProducts.map((p) => ({
          productId: p.productId,
          name: p.name,
          totalSold: p._sum.quantity || 0,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getAllOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const status = req.query.status;
    const search = req.query.search;
    const skip = (page - 1) * limit;

    const where = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { shippingName: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          items: { select: { id: true, name: true, quantity: true, price: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        orders: orders.map((o) => ({
          ...o,
          totalAmount: parseFloat(o.totalAmount),
          subtotal: parseFloat(o.subtotal),
          tax: parseFloat(o.tax),
          deliveryFee: parseFloat(o.deliveryFee),
          items: o.items.map((i) => ({ ...i, price: parseFloat(i.price) })),
        })),
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

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, image: true, stock: true, category: true } },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({
      success: true,
      data: {
        ...order,
        totalAmount: parseFloat(order.totalAmount),
        subtotal: parseFloat(order.subtotal),
        tax: parseFloat(order.tax),
        deliveryFee: parseFloat(order.deliveryFee),
        items: order.items.map((i) => ({ ...i, price: parseFloat(i.price) })),
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const validStatuses = ['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Prevent invalid transitions
    if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: `Cannot update a ${order.status.toLowerCase()} order`,
      });
    }

    // If cancelling, restore stock
    if (status === 'CANCELLED' && order.status !== 'CANCELLED') {
      const items = await prisma.orderItem.findMany({ where: { orderId: id } });
      await Promise.all(
        items.map((item) =>
          prisma.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          })
        )
      );
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        items: { select: { name: true, quantity: true, price: true } },
      },
    });

    // Email customer about status change (non-blocking)
    if (updated.user?.email) {
      sendOrderStatusEmail(updated.user.email, updated.user.firstName, updated.orderNumber, status).catch(() => {});
    }

    res.json({
      success: true,
      message: `Order marked as ${status.toLowerCase()}`,
      data: {
        ...updated,
        totalAmount: parseFloat(updated.totalAmount),
        items: updated.items.map((i) => ({ ...i, price: parseFloat(i.price) })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Products ──────────────────────────────────────────────────────────────

const listProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const search = req.query.search;
    const active = req.query.active;
    const skip = (page - 1) * limit;

    const where = {};
    if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { category: { contains: search, mode: 'insensitive' } }];
    if (active === 'true') where.isActive = true;
    if (active === 'false') where.isActive = false;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, description: true, price: true, stock: true, category: true, image: true, isActive: true, createdAt: true, _count: { select: { orderItems: true } } },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        products: products.map((p) => ({ ...p, price: parseFloat(p.price) })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 },
      },
    });
  } catch (error) { next(error); }
};

const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, stock, category, image } = req.body;
    if (!name?.trim() || !description?.trim() || !price || !category?.trim()) {
      return res.status(400).json({ success: false, message: 'name, description, price and category are required' });
    }
    const product = await prisma.product.create({
      data: { name: name.trim(), description: description.trim(), price: parseFloat(price), stock: parseInt(stock) || 0, category: category.trim(), image: image || null },
    });
    res.status(201).json({ success: true, data: { ...product, price: parseFloat(product.price) } });
  } catch (error) { next(error); }
};

const updateProduct = async (req, res, next) => {
  try {
    const { name, description, price, stock, category, image } = req.body;
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description && { description: description.trim() }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(stock !== undefined && { stock: parseInt(stock) }),
        ...(category && { category: category.trim() }),
        ...(image !== undefined && { image: image || null }),
      },
    });
    res.json({ success: true, data: { ...updated, price: parseFloat(updated.price) } });
  } catch (error) { next(error); }
};

const toggleProduct = async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const updated = await prisma.product.update({ where: { id: req.params.id }, data: { isActive: !product.isActive } });
    res.json({ success: true, data: { id: updated.id, isActive: updated.isActive } });
  } catch (error) { next(error); }
};

const deleteProduct = async (req, res, next) => {
  try {
    const activeOrders = await prisma.orderItem.count({
      where: { productId: req.params.id, order: { status: { notIn: ['DELIVERED', 'CANCELLED'] } } },
    });
    if (activeOrders > 0) return res.status(409).json({ success: false, message: 'Cannot delete a product with active orders' });
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) { next(error); }
};

// ─── Users ────────────────────────────────────────────────────────────────

const listUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const search = req.query.search;
    const role = req.query.role;
    const skip = (page - 1) * limit;

    const where = {};
    if (search) where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
    if (role === 'ADMIN' || role === 'USER') where.role = role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        select: {
          id: true, firstName: true, lastName: true, email: true, phone: true,
          role: true, isVerified: true, avatar: true, createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 },
      },
    });
  } catch (error) { next(error); }
};

const getUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, firstName: true, lastName: true, email: true, phone: true,
        role: true, isVerified: true, avatar: true, createdAt: true,
        orders: { orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, orderNumber: true, totalAmount: true, status: true, createdAt: true } },
        _count: { select: { orders: true, wishlist: true } },
      },
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const spend = await prisma.order.aggregate({ where: { userId: req.params.id, paymentStatus: 'COMPLETED' }, _sum: { totalAmount: true } });
    res.json({ success: true, data: { ...user, totalSpend: parseFloat(spend._sum.totalAmount || 0) } });
  } catch (error) { next(error); }
};

const toggleUserRole = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ success: false, message: 'Cannot change your own role' });
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    await prisma.user.update({ where: { id: req.params.id }, data: { role: newRole } });
    res.json({ success: true, data: { id: user.id, role: newRole } });
  } catch (error) { next(error); }
};

module.exports = {
  getDashboard, getAllOrders, getOrderById, updateOrderStatus,
  listProducts, createProduct, updateProduct, toggleProduct, deleteProduct,
  listUsers, getUser, toggleUserRole,
};
