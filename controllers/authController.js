import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import nodemailer from "nodemailer";

let otpStore = {}; // Temporary memory store (for production use DB or cache)

// REGISTER USER
export const registerUser = async (req, res) => {
  try {
    console.log("📥 Register Request Body:", req.body);
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: { id: newUser._id, name: newUser.name, email: newUser.email },
    });
  } catch (error) {
    console.error("❌ Register error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// LOGIN USER
export const loginUser = async (req, res) => {
  try {
    console.log("📥 Login Request Body:", req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "fallbackSecretKey",
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// FORGOT PASSWORD (Send OTP)
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = otp;

    // Send email with nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Professional GnexifyTechnologies email
  await transporter.sendMail({
  from: `"GnexifyTechnologies Support" <${process.env.EMAIL_USER}>`,
  to: email,
  subject: "🔒 GnexifyTechnologies Password Reset OTP",
  text: `Hello ${user.name || "User"},

You requested a password reset for your GnexifyTechnologies account.

Your One-Time Password (OTP) is: ${otp}

⚠️ Security Tips:
- This OTP is valid for 5 minutes only.
- Never share this OTP with anyone.
- If you did not request a password reset, ignore this email or contact support@gnexifytechnologies.com immediately.
- Choose a strong, unique password (min 8 chars with letters, numbers, symbols).

Thank you,
GnexifyTechnologies Support Team`,

  html: `
  <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
    <div style="text-align: center; margin-bottom: 20px;">
      <h1 style="color: #1a73e8;">GnexifyTechnologies</h1>
      <p style="color: #555; margin: 0;">Secure Password Reset Notification</p>
    </div>

    <p>Hello <strong>${user.name || "User"}</strong>,</p>

    <p>You requested a password reset for your GnexifyTechnologies account.</p>

    <p style="text-align: center; font-size: 1.3em; font-weight: bold; color: #e74c3c;">Your OTP: ${otp}</p>

    <h3 style="color: #1a73e8;">Security Instructions:</h3>
    <ul>
      <li>This OTP is valid for <strong>5 minutes only</strong>.</li>
      <li>Never share this OTP with anyone, even if asked.</li>
      <li>If you did not request a password reset, ignore this email or contact <a href="mailto:support@gnexifytechnologies.com">support@gnexifytechnologies.com</a>.</li>
      <li>Use a strong, unique password: min 8 characters, mix letters, numbers, symbols.</li>
    </ul>

    <p style="margin-top: 30px; color: #777; font-size: 0.9em; text-align: center;">
      — GnexifyTechnologies Support Team<br/>
      <a href="https://vercel-frontend-tan-five.vercel.app/" style="color: #1a73e8;">https://vercel-frontend-tan-five.vercel.app/</a>
    </p>
  </div>
  `,
});


    console.log(`✅ OTP for ${email}: ${otp}`);
    res.json({ message: "OTP sent to email" });
  } catch (error) {
    console.error("❌ Forgot Password Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// RESET PASSWORD (Verify OTP & Update Password)
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!otpStore[email] || otpStore[email] !== otp) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ email }, { password: hashedPassword });

    delete otpStore[email]; // Clear OTP after use
    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("❌ Reset Password Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
