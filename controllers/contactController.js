import Contact from "../models/Contact.js";

// @desc   Submit Contact Form
// @route  POST /api/contact
// @access Public
export const submitContactForm = async (req, res) => {
  try {
    const { fullName, email, message } = req.body;

    // Basic validation
    if (!fullName || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Create contact entry
    const contact = await Contact.create({
      fullName,
      email,
      message,
    });

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: contact,
    });
  } catch (error) {
    console.error("Contact Controller Error:", error.message);

    // Mongoose validation error handling
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// @desc   Get all contact messages (Admin use)
// @route  GET /api/contact
// @access Private (future protect kar sakti ho)
export const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts,
    });
  } catch (error) {
    console.error("Get Contacts Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};