const prisma = require('../config/prisma');

const getStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    if (isAdmin) {
      const [totalOrders, totalRevenue, totalUsers, totalProducts, recentOrders, ordersByDay] = await Promise.all([
        prisma.order.count(),
        prisma.order.aggregate({
          _sum: { totalAmount: true },
          where: { paymentStatus: 'COMPLETED' },
        }),
        prisma.user.count({ where: { role: 'USER' } }),
        prisma.product.count({ where: { isActive: true } }),
        prisma.order.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            items: { select: { name: true, quantity: true, price: true } },
          },
        }),
        prisma.$queryRaw`
          SELECT
            DATE(created_at) as date,
            COUNT(*) as orders,
            SUM(total_amount) as revenue
          FROM "Order"
          WHERE created_at >= ${sevenDaysAgo}
          GROUP BY DATE(created_at)
          ORDER BY date ASC
        `,
      ]);

      return res.json({
        success: true,
        data: {
          totalOrders,
          totalRevenue: parseFloat(totalRevenue._sum.totalAmount || 0),
          totalUsers,
          totalProducts,
          recentOrders,
          revenueChart: ordersByDay.map((r) => ({
            date: r.date,
            orders: Number(r.orders),
            revenue: parseFloat(r.revenue || 0),
          })),
        },
      });
    }

    // Non-admin: user's own stats
    const [myOrders, mySpend, recentOrders, wishlistCount, cartCount] = await Promise.all([
      prisma.order.count({ where: { userId } }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { userId, paymentStatus: 'COMPLETED' },
      }),
      prisma.order.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { items: { select: { name: true, quantity: true, price: true } } },
      }),
      prisma.wishlist.count({ where: { userId } }),
      prisma.cartItem.count({ where: { cart: { userId } } }),
    ]);

    // Orders per day last 7 days for the user
    const ordersByDay = await prisma.$queryRaw`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as orders,
        SUM(total_amount) as revenue
      FROM "Order"
      WHERE user_id = ${userId} AND created_at >= ${sevenDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    res.json({
      success: true,
      data: {
        totalOrders: myOrders,
        totalSpend: parseFloat(mySpend._sum.totalAmount || 0),
        wishlistCount,
        cartCount,
        recentOrders,
        revenueChart: ordersByDay.map((r) => ({
          date: r.date,
          orders: Number(r.orders),
          revenue: parseFloat(r.revenue || 0),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getStats };
