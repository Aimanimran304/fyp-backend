import BillRequest from "../models/BillRequest.js";
import Order from "../models/Order.js";
import { notify } from "../utils/notify.js";

// ─── POST /api/waiter/bill-requests — Waiter: send bill to cashier ──
export const createBillRequest = async (req, res) => {
  try {
    const { orderId, tableNumber, amount } = req.body;
    if (!orderId || !tableNumber || amount === undefined) {
      return res.status(400).json({ message: "orderId, tableNumber and amount are required" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const bill = await BillRequest.create({
      order: orderId,
      waiter: req.user._id,
      tableNumber,
      amount,
    });

    await notify({
      role: "cashier",
      type: "bill_generated",
      message: `Bill requested for Table ${tableNumber} — Rs. ${amount}`,
      relatedOrder: orderId,
    });

    res.status(201).json(bill);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── GET /api/waiter/bill-requests — Waiter: bills I've sent ─────
export const getMyBillRequests = async (req, res) => {
  try {
    const bills = await BillRequest.find({ waiter: req.user._id }).sort({ createdAt: -1 });
    res.json(bills);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── GET /api/bills — Cashier: all pending bill requests ─────────
export const getPendingBillRequests = async (req, res) => {
  try {
    const bills = await BillRequest.find({ status: { $ne: "paid" } })
      .populate("waiter", "name")
      .populate("order", "items totalAmount paymentMethod")
      .sort({ createdAt: 1 });
    res.json(bills);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── PATCH /api/bills/:id/status — Cashier: acknowledge / mark paid ──
export const updateBillStatus = async (req, res) => {
  try {
    const { status, paymentMethod } = req.body;
    const allowed = ["sent", "acknowledged", "paid"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${allowed.join(", ")}` });
    }

    const bill = await BillRequest.findById(req.params.id);
    if (!bill) return res.status(404).json({ message: "Bill request not found" });

    bill.status = status;
    if (paymentMethod) bill.paymentMethod = paymentMethod;
    if (status === "paid") {
      bill.handledBy = req.user._id;
      await Order.findByIdAndUpdate(bill.order, { paymentStatus: "paid" });
    }
    await bill.save();

    res.json(bill);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
