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
import jwt from "jsonwebtoken";
import twilio from "twilio";
import Posts from "../models/Posts.js";
sgMail.setApiKey(process.env.SG_MAIL);
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

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
  const appleId = req.body.appleId;
  const TOKEN_EXPIRY_DAYS = 7;
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
      username = userData.name;
      email = userData.id;
      profileImage = userData.picture.data.url;
    } else  if (provider === "apple") {
      username = req.body.given_name + " " + req.body.family_name;
      email = req.body.email;
    }

    let user;
    if(provider === "apple"){
      user= await User.findOne({ where: { appleId: appleId } });
    }else{
      user= await User.findOne({ where: { email: email } });
    }
    if (
      (user && user.provider === "google") ||
      (user && user.provider === "facebook") || 
      (user && user.provider === "apple")
    ) {
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
        expiresIn:  `${TOKEN_EXPIRY_DAYS}d`,
      });
      user.fcm_token = fcm_token;
      await user.save();
      const data = { token: token, user: user };

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
          state: "",
          city: "",
          address: "",
          fcm_token:fcm_token,
          appleId
        });
        const token = jwt.sign(
          { userId: userData.id },
          process.env.JWT_SECRET,
          {
            expiresIn:  `${TOKEN_EXPIRY_DAYS}d`,
          }
        );
        const data = { token: token, user: userData };
        return res
          .status(200)
          .json({ data, message: "User login successfully" });
      } catch (err) {
        return res.status(400).json({ error1: err });
      }
    }
  } catch (error) {
    console.log(error)
    return res.status(400).json({ error: error });
  }
});

async function isEmail(input) {
  const emailRegex = /\S+@\S+\.\S+/;
  return emailRegex.test(input);
}

async function isPhoneNumber(input) {
  const phoneRegex = /^\d{8}$/;
  return phoneRegex.test(input);
}

// Registration
router.post("/register", upload.single("profileImage"), async (req, res) => {
  try {
    let existingUser;
    const token = createToken();
    const { username, emailOrPhone, password } = req.body;
    const email = await isEmail(emailOrPhone);
    const phone = await isPhoneNumber(emailOrPhone);
    if (email) {
      existingUser = await User.findOne({
        where: {
          [Op.or]: [{ email: emailOrPhone }],
        },
      });
    } else if (phone) {
      existingUser = await User.findOne({
        where: {
          [Op.or]: [{ phone: emailOrPhone }],
        },
      });
    } else {
      return res
        .status(409)
        .json({ error: "Email or Phone format is not correct" });
    }

    if (existingUser) {
      return res
        .status(409)
        .json({ error: "Email or phone is already in use." });
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
    if (email) {
      const msg = {
        to: emailOrPhone,
        from: "elropero@elropero.app",
        subject: "Email Verification Code",
        text: "Haga clic en el siguiente link para verificar su correo electrónico",
        html: `<strong><a href="https://www.elropero.app/loading?token=${token}">Verify Email</a></strong>`,
      };
      sgMail.send(msg);
      console.log(token);
    } else if (phone) {
      try {
        const message = await client.messages.create({
          body: `https://www.elropero.app/loading?token=${token}`,
          messagingServiceSid: process.env.MESSAGING_SERVICE_ID,
          to: `+591${emailOrPhone}`,
        });

        console.log(`Message sent successfully. SID: ${message.body}`);
      } catch (error) {
        console.error(`Error sending message: ${error.message}`);
      }
    }
    await User.create({
      username,
      email: email ? emailOrPhone : null,
      phone: phone ? emailOrPhone : null,
      password: hashedPassword,
      token: token,
      profileImage: profileImage,
    });
    res.status(201).json({
      message: "Please check your Email or Phone for account confirmation",
    });
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
  const { emailOrPhone } = req.body;
  const email = await isEmail(emailOrPhone);
  const phone = await isPhoneNumber(emailOrPhone);
  try {
    let user;
    if (email) {
      user = await User.findOne({ where: { email: emailOrPhone } });
    } else if (phone) {
      user = await User.findOne({ where: { phone: emailOrPhone } });
    } else {
      return res
        .status(409)
        .json({ error: "Email or Phone format is not correct" });
    }
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
    if (email) {
      const msg = {
        to: emailOrPhone,
        from: "elropero@elropero.app",
        subject: "Email Verification Code",
        text: "Haga clic en el siguiente link para verificar su correo electrónico",
        html: `<strong><a href="https://www.elropero.app/loading?token=${token}">Verify Code</a></strong>`,
      };
      sgMail.send(msg);
    } else if (phone) {
      try {
        const message = await client.messages.create({
          body: `https://www.elropero.app/loading?token=${token}`,
          messagingServiceSid: process.env.MESSAGING_SERVICE_ID,
          to: `+591${emailOrPhone}`,
        });

        console.log(`Message sent successfully. SID: ${message.body}`);
      } catch (error) {
        console.error(`Error sending message: ${error.message}`);
      }
    }
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
    const { emailOrPhone, password, fcm_token } = req.body;
    let user;
    if (await isEmail(emailOrPhone)) {
      user = await User.findOne({ where: { email: emailOrPhone } });
    } else if (await isPhoneNumber(emailOrPhone)) {
      user = await User.findOne({ where: { phone: emailOrPhone } });
    }
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    if (user.is_disabled) {
      return res.status(403).json({ error: "Account is disabled" });
    }

    const isVerified = user.isVerified;
    if (!isVerified) {
      return res.status(401).json({ error: "Email or Phoneis not verified." });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    if (passwordMatch) {
      // const TOKEN_EXPIRY_DAYS = 84600 / (24 * 60 * 60);
      const TOKEN_EXPIRY_DAYS = 7;
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
        expiresIn: `${TOKEN_EXPIRY_DAYS}d`,
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
          fcm_token: user.fcm_token,
          address: user.address,
          city: user.city,
          state: user.state,
          credits: user.credits,
          no_of_posts: user.no_of_posts,
          isVerified: user.isVerified,
          provider: user.provider,
          cnic: user.cnic
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
  const { emailOrPhone } = req.body;
  const email = await isEmail(emailOrPhone);
  const phone = await isPhoneNumber(emailOrPhone);
  try {
    let user;
    if (email) {
      user = await User.findOne({ where: { email: emailOrPhone } });
    } else if (phone) {
      user = await User.findOne({ where: { phone: emailOrPhone } });
    } else {
      return res
        .status(409)
        .json({ error: "Email or Phone format is not correct" });
    }
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    console.log(resetToken);
    user.resetToken = resetToken;
    await user.save();
    if (email) {
      const msg = {
        to: emailOrPhone,
        from: "elropero@elropero.app",
        subject: "Email Verification Code",
        text: "Por favor, haz clic en el enlace para restablecer la contraseña",
        html: `<strong><a href="https://www.elropero.app/reset-password?token=${resetToken}">Password Reset Code</a></strong>`,
      };
      sgMail.send(msg);
    } else if (phone) {
      try {
        const message = await client.messages.create({
          body: `https://www.elropero.app/reset-password?token=${resetToken}`,
          messagingServiceSid: process.env.MESSAGING_SERVICE_ID,
          to: `+591${emailOrPhone}`,
        });

        console.log(`Message sent successfully. SID: ${message.body}`);
      } catch (error) {
        console.error(`Error sending message: ${error.message}`);
      }
    }

    return res
      .status(200)
      .json({ error: "Reset token is sent to your provided email/phone." });
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
router.get("/get-all-user", async (req, res) => {
  try {
    let { page = 1, pageSize = 10, search } = req.query;
    pageSize = parseInt(pageSize, 10);
    const offset = (page - 1) * pageSize;
    const whereClause = {
      [Op.or]: [
        { username: { [Op.like]: `%${search}%` } },
      ],
    };
    const users = await User.findAndCountAll({
      where: whereClause,
      // attributes: [
      //   "id",
      //   "username",
      //   "email",
      //   "phone",
      //   "profileImage",
      //   "isVerified",
      //   "isPhoneVerified",
      //   "is_disabled",
      //   "no_of_posts",
      //   "cnic",
      //   "fcm_token"
      // ],
      offset,
      limit: pageSize,
      order: [['id', 'DESC']]
    });
    res.json({
      total: users.count,
      page,
      pageSize,
      users: users.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Route to update user details
router.put(
  "/update-user/:id",
  upload.single("profileImage"),
  async (req, res) => {
    const userId = req.params.id;
    const { username, email, phone, password, address, city, state, cnic } = req.body;
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.provider === null) {
        let hashedPassword;
        if (password) {
          const saltRounds = 10;
          hashedPassword = await bcrypt.hash(password, saltRounds);
        }
        let profileImage = user.profileImage;
        if (req.file) {
          const uploadResponse = await profileImageToS3(
            req.file.buffer,
            req.file.originalname
          );
          profileImage = uploadResponse;
        }
        user.username = username || user.username;
        user.email = email || user?.email;
        user.phone = phone || user?.phone;
        user.password =
          hashedPassword !== undefined ? hashedPassword : user.password;
        user.profileImage = profileImage;
        user.address = address || user?.address;
        user.city = city || user?.city;
        user.state = state || user?.state;
        user.cnic = cnic || user?.cnic;
        await user.save();
        return res.json({ message: "User details updated successfully" });
      } else {
        let profileImage = user?.profileImage;
        if (req.file) {
          const uploadResponse = await profileImageToS3(
            req.file.buffer,
            req.file.originalname
          );
          profileImage = uploadResponse;
        }
        user.username = username || user?.username;
        user.profileImage = profileImage || user?.profileImage;
        user.address = address || user?.address;
        user.city = city || user?.city;
        user.state = state || user?.state;

        await user.save();
        return res.json({ message: "User details updated successfully" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

// Route to disable a user by ID
router.put("/disapprove-user/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    if (user.is_disabled == true) {
      return res.status(401).json({ message: "User is already disapproved" });
    }

    // Set the user's is_disabled field to true
    user.is_disabled = true;
    await user.save();
    res.json({ message: "User disapproved successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.put("/approve-user/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    if (user.is_disabled == false) {
      return res.status(404).json({ message: "User is already approved" });
    }

    // Set the user's is_disabled field to true
    user.is_disabled = false;
    await user.save();
    res.json({ message: "User approved successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get User Detail by Id
router.get("/user-detail/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        profileImage: user.profileImage,
        email: user.email,
        phone: user.phone,
        address: user.address,
        city: user.city,
        state: user.state,
        credits: user.credits,
        no_of_posts: user.no_of_posts,
        isVerified: user.isVerified,
        isPhoneVerified: user.isPhoneVerified,
        provider: user.provider,
        cnic: user.cnic
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Delete user by ID
router.delete("/delete-user/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    await Posts.destroy({ where: { userId: userId } });
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
