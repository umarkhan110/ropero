import express from "express";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import crypto from "crypto";
import multer from "multer";
import { Op } from "sequelize";
const router = express.Router();
import sgMail from "@sendgrid/mail";
import profileImageToS3 from "../factory/profileUpload.js";
import axios from "axios";
import "dotenv/config";
import jwt from "jsonwebtoken"
sgMail.setApiKey(process.env.SG_MAIL);

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory for further processing
const upload = multer({ storage });

const createToken = () => {
  const tokenValue = Math.random().toString(36).substr(2);
  return tokenValue + tokenValue;
};

// Social Logins
router.post("/socialLogin", async (req, res) => {
  const id_token = req.body.id_token;
  const provider = req.body.provider;
  const fcm_token = req.body.fcm_token;
  try {
    let usrRes, username, email, userData, profileImage;
    if (provider === "google") {
      usrRes = await axios.get(
        `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${id_token}`,
        {
          headers: {
            Authorization: `Bearer ${id_token}`,
          },
        }
      );
      userData = usrRes.data;
      username = userData.given_name + " " + userData.family_name;
      email = userData.email;
      profileImage = userData.picture;
    } else if (provider === "facebook") {
      usrRes = await axios.get(
        `https://graph.facebook.com/v12.0/me?fields=id,name,first_name,last_name,email,picture&access_token=${id_token}`,
        {
          headers: {
            Authorization: `Bearer ${id_token}`,
          },
        }
      );
      userData = usrRes.data;
      username = userData.first_name;
      email = userData.email;
      profileImage = userData.picture.data.url;
    }

    const user = await User.findOne({ where: { email: email } });
    console.log(user);
    if (
      (user && user.provider === "google") ||
      (user && user.provider === "facebook")
    ) {
      // means we already have a user with this email and this email was registered through social
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
        expiresIn: process.env.TOKEN_EXPIRY_DAYS,
      });
      user.fcm_token = fcm_token;
      await user.save();
      const data = { token:token, user: user };

      return res.status(200).json({ data, message: "User login successfully" });
    } else {
      try {
        const userData = await User.create({
          username,
          email,
          password: "",
          profileImage,
          provider: provider,
          isVerified: true,
            
        });
        const token = jwt.sign({ userId: userData.id }, process.env.JWT_SECRET, {
          expiresIn: process.env.TOKEN_EXPIRY_DAYS,
        });
        const data = { token:token, user: userData };
        return res
          .status(200)
          .json({ data, message: "User login successfully" });
      } catch (err) {
        return res.status(400).json({ error1: err });
      }
    }
  } catch (error) {
    return res.status(400).json({ error: error });
  }
});

// Registration
router.post("/register", upload.single("profileImage"), async (req, res) => {
  try {
    const token = createToken();
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Username or email is already in use." });
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Upload profile image to S3
    let profileImage = null;
    if (req.file) {
      const uploadResponse = await profileImageToS3(
        req.file.buffer,
        req.file.originalname
      );
      profileImage = uploadResponse; // Store the S3 URL in the database
    }
    const msg = {
      to: email,
      from: "elropero@elropero.app",
      subject: "Email Verification Code",
      text: "This is your email verification code",
      html: `<strong><a href="https://www.elropero.app/loading?token=${token}">Verify Email</a></strong><br><strong><a href="https://main.d3jf36qtaaf0i6.amplifyapp.com/loading?token=${token}">Staging Verify Email</a></strong>`,
    };
    sgMail.send(msg);
    console.log(token);

    await User.create({
      username,
      email,
      password: hashedPassword,
      token: token,
      profileImage: profileImage,
    });
    res
      .status(201)
      .json({ message: "Please check your Email for account confirmation" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while registering." });
  }
});

// Email Verification Endpoint
router.get("/verify/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ where: { token } });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    // Mark user as verified
    user.isVerified = true;
    await user.save();

    res.json({ message: "Email verification successful. You can now log in." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while verifying email." });
  }
});

//Resend Email Verification
router.post("/resend-verification", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    if (user.isVerified) {
      return res.status(400).json({ error: "User is already verified." });
    }
    // Generate a new verification token and update the user record
    const token = createToken();
    user.token = token;
    await user.save();

    // Send the verification email
    const msg = {
      to: email,
      from: "elropero@elropero.app",
      subject: "Email Verification Code",
      text: "This is your email verification code",
      html: `<strong><a href="https://www.elropero.app/loading?token=${token}">Verify Code</a></strong><br><strong><a href="https://main.d3jf36qtaaf0i6.amplifyapp.com/loading?token=${token}">Staging Verify Code</strong>`,
    };
    sgMail.send(msg);

    res.json({ message: "Verification email sent successfully." });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while resending verification email." });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password, fcm_token } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    if (user.is_disabled) {
      return res.status(403).json({ error: "Account is disabled" });
    }
    
    const isVerified = user.isVerified;
    if (!isVerified) {
      return res.status(401).json({ error: "Email is not verified." });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    if (passwordMatch) {
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
        expiresIn: process.env.TOKEN_EXPIRY_DAYS,
      });

    user.fcm_token = fcm_token;
    await user.save();

    res.json({
      message: "Login successful.",
      token: token,
      user: {
        id: user.id,
        username: user.username,
        profileImage: user.profileImage,
        fcm_token: fcm_token,
        address: user.address,
        city:user.city,
        state: user.state,
        credits: user.credits
      },
    });
  }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while logging in." });
  }
});

// Logout
router.post("/logout", (req, res) => {
  req.session.destroy();
  res.json({ message: "Logged out successfully." });
});

// Request reset password
router.post("/reset-password-request", async (req, res) => {
  try {
    const { email } = req.body;

    const resetToken = crypto.randomBytes(20).toString("hex");
    // Update the user's reset token in the database
    const user = await User.findOne({ where: { email } });
    if (user) {
      user.resetToken = resetToken;
      await user.save();

      const msg = {
        to: email,
        from: "elropero@elropero.app",
        subject: "Reset Link",
        text: "This is your password reset code",
        html: `<strong><a href="https://www.elropero.app/reset-password?token=${resetToken}">Password Reset Code</a></strong><br><strong><a href="https://main.d3jf36qtaaf0i6.amplifyapp.com/loading?token=${resetToken}">Staging Password Reset Code</strong>`,
      };
      sgMail.send(msg);
      return res
        .status(200)
        .json({ error: "Reset token is sent to your provided email." });
    } else {
      return res.status(401).json({ error: "This email is not registered." });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while requesting reset." });
  }
});

// Reset password using the reset token
router.post("/reset-password", async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    // Find user by reset token
    const user = await User.findOne({ where: { resetToken } });

    if (!user) {
      return res.status(400).json({ error: "Invalid reset token." });
    }
    console.log(newPassword);

    if (newPassword) {
      // Hash the new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update user's password and reset token
      user.password = hashedPassword;
      user.resetToken = null; // Clear the reset token
      await user.save();

      return res.json({ message: "Password reset successfully." });
    } else {
      return res.status(400).json({ error: "New Password is required" });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while resetting password." });
  }
});

// Define a route to get all users
router.get('/get-all-user', async (req, res) => {
  try {
    let { page = 1, pageSize = 10, search } = req.query;
    // Ensure that pageSize is a numeric value
    pageSize = parseInt(pageSize, 10);
    const offset = (page - 1) * pageSize;
    const whereClause = {
      // Add search functionality
      [Op.or]: [
        // Customize this list to include relevant fields you want to search in
        { username: { [Op.like]: `%${search}%` } },
        // Add more fields as needed
      ],
    };
    const users = await User.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'username', 'email', 'profileImage', 'isVerified', 'is_disabled'],
      offset,
      limit: pageSize,
    });
    res.json({
      total: users.count,
      page,
      pageSize,
      users:users.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Route to update user details
router.put('/update-user/:id', upload.single("profileImage"), async (req, res) => {
  const userId = req.params.id;
  const { username, password, address, city, state } = req.body;

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the provider is null
    if (user.provider === null) {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      let profileImage = user.profileImage;
    if (req.file) {
      const uploadResponse = await profileImageToS3(
        req.file.buffer,
        req.file.originalname
      );
      console.log(uploadResponse)
      profileImage = uploadResponse; // Store the S3 URL in the database
    }
      // Update user details based on your conditions
      user.username = username || user.username;
      user.password = hashedPassword !== undefined ? hashedPassword : user.password;
      user.profileImage = profileImage;
      user.address = address;
      user.city = city;
      user.state = state

      await user.save();

      return res.json({ message: 'User details updated successfully' });
    } else {
      return res.status(403).json({ message: 'Cannot update user details with provider set' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Route to disable a user by ID
router.put('/disable-user/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Set the user's is_disabled field to true
    user.is_disabled = !user.is_disabled;
    await user.save();

    res.json({ message: 'User disabled successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get User Detail by Id
router.get('/user-detail/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      user: {
        id: user.id,
        username: user.username,
        profileImage: user.profileImage,
        email: user.email,
        address: user.address,
        city:user.city,
        state: user.state,
        credits: user.credits
      } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Delete user by ID
router.delete("/deleteuser/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Delete the user
    await user.destroy();

    return res.status(200).json({ message: "User removed successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Admin Login
router.post("/admin-login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const adminEmail = "admin@ropero.app";
    const adminPassword = "admin@ropero"; // You should hash and store the password securely

    // Check if the provided email and password match the admin credentials
    if (email === adminEmail && password === adminPassword) {
      // Replace the above line with proper password hashing and checking

      const id = "admin@ropero";
      const token = jwt.sign({ userId: id }, process.env.JWT_SECRET, {
        expiresIn: process.env.TOKEN_EXPIRY_DAYS,
      });

      res.json({
        message: "Login successful.",
        token: token,
      });
    } else {
      return res.status(401).json({ error: "Invalid credentials." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while logging in." });
  }
});


export default router;
