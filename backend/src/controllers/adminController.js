const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

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

module.exports = { getDashboard, getAllOrders, getOrderById, updateOrderStatus };
