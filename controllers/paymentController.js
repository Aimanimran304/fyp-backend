// controllers/paymentController.js
//
// SIMULATED PAYMENT GATEWAY (for FYP / demo purposes only)
// -----------------------------------------------------------
// Koi real bank/JazzCash/EasyPaisa se connect nahi hota. Hum sirf
// OTP flow ko replicate karte hain taake UI/UX asli jaisa lage.
// Production mein is jagah JazzCash/EasyPaisa ka official SDK ya
// Stripe jaisa real gateway use hota — unko merchant account chahiye
// hota hai jo FYP ke liye issue nahi hota.

// In-memory store for pending OTP sessions
// (real app mein Redis ya DB use hota, yahan simple Map kaafi hai)
const pendingPayments = new Map();

// Generate a random 6-digit OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// @desc    Initiate a payment (JazzCash / EasyPaisa)
// @route   POST /api/payment/initiate
// @access  Private
export const initiatePayment = async (req, res) => {
  try {
    const { amount, method, phoneNumber } = req.body;

    if (!amount || !method || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Amount, method, and phone number are required",
      });
    }

    if (!["jazzcash", "easypaisa"].includes(method)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method for OTP flow",
      });
    }

    // Basic phone validation (Pakistani mobile numbers)
    const phoneRegex = /^03\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid mobile number (e.g. 03001234567)",
      });
    }

    const otp = generateOtp();
    const sessionKey = `${phoneNumber}_${method}`;

    pendingPayments.set(sessionKey, {
      otp,
      amount,
      method,
      phoneNumber,
      createdAt: Date.now(),
      attempts: 0,
    });

    // Auto-expire OTP after 5 minutes
    setTimeout(() => pendingPayments.delete(sessionKey), 5 * 60 * 1000);

    // NOTE: Real gateway yahan par actual SMS bhejta.
    // Hum demo ke liye OTP response mein hi bhej rahe hain
    // taake frontend pe dikha sako ("Demo OTP: 123456").
    console.log(`[SIMULATED SMS] OTP for ${phoneNumber} (${method}): ${otp}`);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      demoOtp: otp, // ⚠️ sirf demo/dev ke liye — production mein yeh field kabhi mat bhejna
    });
  } catch (error) {
    console.error("Payment initiation error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to initiate payment",
    });
  }
};

// @desc    Verify OTP and complete payment
// @route   POST /api/payment/verify
// @access  Private
export const verifyPayment = async (req, res) => {
  try {
    const { phoneNumber, otp, method, amount } = req.body;

    if (!phoneNumber || !otp || !method) {
      return res.status(400).json({
        success: false,
        message: "Phone number, OTP, and method are required",
      });
    }

    const sessionKey = `${phoneNumber}_${method}`;
    const session = pendingPayments.get(sessionKey);

    if (!session) {
      return res.status(400).json({
        success: false,
        message: "Payment session expired or not found. Please try again.",
      });
    }

    session.attempts += 1;

    // Lock after 3 wrong attempts (basic fraud simulation)
    if (session.attempts > 3) {
      pendingPayments.delete(sessionKey);
      return res.status(400).json({
        success: false,
        message: "Too many incorrect attempts. Please restart payment.",
      });
    }

    if (session.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: `Incorrect OTP. ${3 - session.attempts} attempt(s) left.`,
      });
    }

    if (Number(session.amount) !== Number(amount)) {
      return res.status(400).json({
        success: false,
        message: "Amount mismatch detected",
      });
    }

    // Success — generate a fake transaction ID
    pendingPayments.delete(sessionKey);
    const transactionId = `${method.toUpperCase()}_${Date.now()}_${Math.floor(
      Math.random() * 10000
    )}`;

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      transactionId,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify payment",
    });
  }
};

// @desc    Simulate card payment (no OTP flow)
// @route   POST /api/payment/card
// @access  Private
export const processCardPayment = async (req, res) => {
  try {
    const { amount, cardNumber, expiry, cvv, cardHolder } = req.body;

    if (!amount || !cardNumber || !expiry || !cvv || !cardHolder) {
      return res.status(400).json({
        success: false,
        message: "All card fields are required",
      });
    }

    // Very light format checks (demo only — never validate real cards like this in prod)
    const cleanedNumber = cardNumber.replace(/\s/g, "");
    if (cleanedNumber.length < 12 || cleanedNumber.length > 19) {
      return res.status(400).json({
        success: false,
        message: "Invalid card number",
      });
    }
    if (!/^\d{3,4}$/.test(cvv)) {
      return res.status(400).json({
        success: false,
        message: "Invalid CVV",
      });
    }

    // Simulate a gateway delay
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Simulate occasional failure (10% chance) so demo feels realistic
    const isSuccess = Math.random() > 0.1;

    if (!isSuccess) {
      return res.status(402).json({
        success: false,
        message: "Card declined by bank (simulated). Please try again.",
      });
    }

    const transactionId = `CARD_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    return res.status(200).json({
      success: true,
      message: "Card payment successful",
      transactionId,
    });
  } catch (error) {
    console.error("Card payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Card payment failed",
    });
  }
};