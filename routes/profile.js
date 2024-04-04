import express from "express";
import User from "../models/User.js";
const router = express.Router();
import sgMail from "@sendgrid/mail";
import "dotenv/config";
import twilio from "twilio";
import checkUserAuthentication from "../middleware/authMiddleware.js";
sgMail.setApiKey(process.env.SG_MAIL);
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

const createToken = () => {
  const randomNumber = Math.floor(Math.random() * 100000);
  let tokenValue = randomNumber.toString();
  while (tokenValue.length < 5) {
    tokenValue = "0" + tokenValue;
  }
  return tokenValue;
};

async function isPhoneNumber(input) {
  const phoneRegex = /^\d{8}$/;
  return phoneRegex.test(input);
}

// Get Phone Verification Token
router.post(
  "/getPhoneVerificationToken",
  checkUserAuthentication,
  async (req, res) => {
    const { phone } = req.body;
    const phoneNo = await isPhoneNumber(phone);
    const user = req.user;
    try {
      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }
      if (phoneNo) {
        const existingUserWithPhone = await User.findOne({
          where: { phone: phoneNo },
        });
        if (existingUserWithPhone && existingUserWithPhone.id !== user.id) {
          return res
            .status(409)
            .json({ error: "Phone number is already registered." });
        }
      } else {
        return res.status(409).json({ error: "Phone format is not correct" });
      }
      const token = createToken();
      user.token = token;
      await user.save();

      // Send the verification token
      if (phone) {
        try {
          const message = await client.messages.create({
            body: token,
            messagingServiceSid: process.env.MESSAGING_SERVICE_ID,
            to: `+591${phone}`,
          });

          console.log(`Message sent successfully. SID: ${message.body}`);
        } catch (error) {
          console.error(`Error sending message: ${error.message}`);
        }
      }
      res.json({ message: "Verification token sent successfully." });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "An error occurred while sending verification token." });
    }
  }
);

// Phone Verification Token Endpoint
router.get("/verifyToken/:token", checkUserAuthentication, async (req, res) => {
  const user = req.user;
  try {
    const { token } = req.params;
    const existingUserWithToken = await User.findOne({ where: { token } });
    if (!existingUserWithToken || existingUserWithToken.id !== user.id) {
      return res.status(409).json({ error: "Token is invalid" });
    }
    user.isVerified = true;
    await user.save();

    res.json({ message: "Phone verification successful." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while verifying phone." });
  }
});

export default router;
