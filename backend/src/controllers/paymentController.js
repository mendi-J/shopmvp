const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

const TAX_RATE = 0.1;
const DELIVERY_FEE = 4.99;
const FREE_DELIVERY_THRESHOLD = 50;

const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

const simulatePayment = (paymentMethod, cardDetails) => {
  if (paymentMethod === 'card') {
    if (!cardDetails) {
      return { success: false, reason: 'Card details are required' };
    }
    const cardNum = cardDetails.number?.replace(/\s/g, '') || '';
    if (cardNum.endsWith('0000')) {
      return { success: false, reason: 'Card declined by issuer' };
    }
    if (cardNum.length < 13) {
      return { success: false, reason: 'Invalid card number' };
    }
  }
  return {
    success: true,
    transactionId: `TXN-${uuidv4().substring(0, 8).toUpperCase()}`,
  };
};

const processPayment = async (req, res, next) => {
  try {
    const {
      shippingName,
      shippingPhone,
      shippingAddress,
      shippingCity,
      notes,
      paymentMethod,
      cardDetails,
    } = req.body;

    if (!shippingName || !shippingPhone || !shippingAddress || !shippingCity) {
      return res.status(400).json({ success: false, message: 'All shipping fields are required' });
    }

    if (!paymentMethod) {
      return res.status(400).json({ success: false, message: 'Payment method is required' });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
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
          message: `Insufficient stock for "${item.product.name}". Only ${item.product.stock} left.`,
        });
      }
    }

    const paymentResult = simulatePayment(paymentMethod, cardDetails);

    if (!paymentResult.success) {
      return res.status(402).json({
        success: false,
        message: `Payment failed: ${paymentResult.reason}`,
        data: { paymentStatus: 'FAILED' },
      });
    }

    const subtotal = cart.items.reduce(
      (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
      0
    );
    const tax = subtotal * TAX_RATE;
    const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
    const totalAmount = subtotal + tax + deliveryFee;

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: req.user.id,
          status: 'PROCESSING',
          paymentStatus: 'COMPLETED',
          paymentMethod,
          subtotal: parseFloat(subtotal.toFixed(2)),
          tax: parseFloat(tax.toFixed(2)),
          deliveryFee: parseFloat(deliveryFee.toFixed(2)),
          totalAmount: parseFloat(totalAmount.toFixed(2)),
          shippingName,
          shippingPhone,
          shippingAddress,
          shippingCity,
          notes: notes || null,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
              name: item.product.name,
            })),
          },
        },
        include: { items: true },
      });

      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return newOrder;
    });

    res.json({
      success: true,
      message: 'Payment successful! Your order has been placed.',
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        transactionId: paymentResult.transactionId,
        totalAmount: parseFloat(order.totalAmount),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { processPayment };
