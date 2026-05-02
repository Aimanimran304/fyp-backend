import Order    from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";

// ── Place Order ────────────────────────────────────────────────
export const placeOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      items,
      orderType,
      deliveryAddress,
      tableNumber,
      guestCount,
      paymentMethod,
      specialInstructions,
    } = req.body;

    // ── Validate items ──
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    // ── Validate orderType specific fields ──
    if (orderType === "delivery" && !deliveryAddress?.street) {
      return res.status(400).json({ success: false, message: "Delivery address is required" });
    }
    if (orderType === "dine-in" && !tableNumber) {
      return res.status(400).json({ success: false, message: "Table number is required" });
    }

    // ── Calculate pricing ──
    const subtotal    = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const deliveryFee = orderType === "delivery" ? 150 : 0;
    const tax         = Math.round(subtotal * 0.05); // 5% tax
    const totalAmount = subtotal + deliveryFee + tax;

    // ── Estimated time ──
    const timeMap = { "delivery": 45, "takeaway": 20, "dine-in": 25 };
    const estimatedTime = timeMap[orderType] || 30;

    const order = await Order.create({
      user: userId,
      items,
      orderType,
      deliveryAddress: orderType === "delivery" ? deliveryAddress : undefined,
      tableNumber:     orderType === "dine-in"  ? tableNumber     : undefined,
      guestCount:      orderType === "dine-in"  ? guestCount      : undefined,
      paymentMethod,
      specialInstructions,
      subtotal,
      deliveryFee,
      tax,
      totalAmount,
      estimatedTime,
      status:        "placed",
      paymentStatus: paymentMethod === "cash" ? "pending" : "pending",
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      order,
    });

  } catch (err) {
    console.error("Place order error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── Get My Orders ──────────────────────────────────────────────
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── Get Single Order ───────────────────────────────────────────
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id:  req.params.id,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};