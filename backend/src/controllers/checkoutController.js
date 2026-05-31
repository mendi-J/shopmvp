const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

const TAX_RATE = 0.1;
const DELIVERY_FEE = 4.99;
const FREE_DELIVERY_THRESHOLD = 50;

const createCheckout = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { shippingName, shippingPhone, shippingAddress, shippingCity, notes } = req.body;

    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty' });
    }

    for (const item of cart.items) {
      if (!item.product.isActive) {
        return res.status(400).json({
          success: false,
          message: `"${item.product.name}" is no longer available`,
        });
      }
      if (item.product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${item.product.name}". Only ${item.product.stock} available`,
        });
      }
    }

    const subtotal = cart.items.reduce((sum, item) => {
      return sum + parseFloat(item.product.price) * item.quantity;
    }, 0);

    const tax = subtotal * TAX_RATE;
    const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
    const totalAmount = subtotal + tax + deliveryFee;

    res.json({
      success: true,
      data: {
        shipping: { shippingName, shippingPhone, shippingAddress, shippingCity, notes },
        items: cart.items.map((item) => ({
          productId: item.productId,
          name: item.product.name,
          price: parseFloat(item.product.price),
          quantity: item.quantity,
          image: item.product.image,
          lineTotal: parseFloat((parseFloat(item.product.price) * item.quantity).toFixed(2)),
        })),
        summary: {
          subtotal: parseFloat(subtotal.toFixed(2)),
          tax: parseFloat(tax.toFixed(2)),
          deliveryFee: parseFloat(deliveryFee.toFixed(2)),
          totalAmount: parseFloat(totalAmount.toFixed(2)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createCheckout };
