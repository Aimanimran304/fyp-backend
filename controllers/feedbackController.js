// controllers/feedbackController.js
import Feedback from "../models/Feedback.js";
import Order from "../models/Order.js"; // apka existing Order model

const ALLOWED_ORDER_STATUSES = ["delivered", "completed"];

// @desc    Customer feedback submit kare (sirf delivered/completed order par)
// @route   POST /api/feedback
// @access  Private (customer)
export const submitFeedback = async (req, res) => {
  try {
    const { orderId, rating, comment } = req.body;

    if (!orderId || !rating || !comment?.trim()) {
      return res.status(400).json({
        success: false,
        message: "orderId, rating and comment are required",
      });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
    }

    // Order exist karta ho aur isi customer ka ho
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "You can only review your own orders" });
    }

    // Order delivered/completed hona chahiye
    if (!ALLOWED_ORDER_STATUSES.includes((order.status || "").toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Feedback sirf delivered ya completed orders k liye allowed hai",
      });
    }

    // Duplicate feedback check
    const existing = await Feedback.findOne({ order: orderId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Aap is order par pehle hi feedback de chuke hain",
      });
    }

    const feedback = await Feedback.create({
      customer: req.user._id,
      order: orderId,
      rating,
      comment: comment.trim(),
      status: "Pending",
    });

    return res.status(201).json({ success: true, feedback });
  } catch (err) {
    console.error("submitFeedback error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Logged-in customer k apne saare feedbacks
// @route   GET /api/feedback/mine
// @access  Private (customer)
export const getMyFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ customer: req.user._id });
    return res.json({ success: true, feedbacks });
  } catch (err) {
    console.error("getMyFeedbacks error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Sirf Approved feedback — public website/app par dikhane k liye
// @route   GET /api/feedback/public
// @access  Public
export const getPublicFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ status: "Approved" })
      .populate("customer", "name")
      .sort({ reviewed_date: -1 });
    return res.json({ success: true, feedbacks });
  } catch (err) {
    console.error("getPublicFeedbacks error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Admin k liye saare feedback (status filter k sath)
// @route   GET /api/feedback/admin?status=Pending
// @access  Private (admin)
export const getAllFeedbacksForAdmin = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status && status !== "All" ? { status } : {};

    const feedbacks = await Feedback.find(filter)
      .populate("customer", "name email phone")
      .populate("order", "_id totalAmount items createdAt")
      .sort({ createdAt: -1 });

    return res.json({ success: true, feedbacks });
  } catch (err) {
    console.error("getAllFeedbacksForAdmin error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Admin feedback approve kare -> public show hoga
// @route   PUT /api/feedback/:id/approve
// @access  Private (admin)
export const approveFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      {
        status: "Approved",
        denial_reason: null,
        denial_note: "",
        reviewed_by: req.user._id,   // admin bhi User hi hai (role: "admin")
        reviewed_date: new Date(),
      },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({ success: false, message: "Feedback not found" });
    }
    return res.json({ success: true, feedback });
  } catch (err) {
    console.error("approveFeedback error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Admin feedback deny kare (reason k sath) — DB mein rehta hai, public nahi hota
// @route   PUT /api/feedback/:id/deny
// @access  Private (admin)
export const denyFeedback = async (req, res) => {
  try {
    const { denial_reason, denial_note } = req.body;

    if (!denial_reason) {
      return res.status(400).json({ success: false, message: "denial_reason is required" });
    }

    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      {
        status: "Denied",
        denial_reason,
        denial_note: denial_note || "",
        reviewed_by: req.user._id,   // admin bhi User hi hai (role: "admin")
        reviewed_date: new Date(),
      },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({ success: false, message: "Feedback not found" });
    }
    return res.json({ success: true, feedback });
  } catch (err) {
    console.error("denyFeedback error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};