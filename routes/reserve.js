import express from "express";
import Posts from "../models/Posts.js";
import checkUserAuthentication from "../middleware/authMiddleware.js";
import axios from "axios";
import "dotenv/config";
const router = express.Router();

// Create a qr code for reserving post
router.get("/generate_qr_for_reserve", async (req, res) => {
  try {
    const data = {
      accountId: process.env.BNB_ACOUNT_ID,
      authorizationId: process.env.BNB_AUTHORIZATION_ID,
    };
    const getToken = await axios.post(
      `https://marketapi.bnb.com.bo/ClientAuthentication.API/api/v1/auth/token`,
      data
    );
    if (getToken.status === 200) {
      const data = {
        currency: "BOB",
        gloss: "Prueba BOA",
        amount: 20,
        singleUse: true,
        expirationDate: "2024-09-10",
      };
      const qrRes = await axios.post(
        `https://marketapi.bnb.com.bo/QRSimple.API/api/v1/main/getQRWithImageAsync`,
        data,
        {
          headers: {
            Authorization: `Bearer ${getToken.data.message}`,
          },
        }
      );
      const resData = {
        qr_code: qrRes.data.qr,
        qrId: qrRes.data.id,
      }
      res.status(201).json(resData);
    }
    // }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while creating a QR Code." });
  }
});

// Verify Payment and reserving a post
router.put("/qr-status/:id", checkUserAuthentication, async (req, res) => {
  const qrId = req.params.id;
  const { postId } = req.body;
  try {
    const data = {
      accountId: process.env.BNB_ACOUNT_ID,
      authorizationId: process.env.BNB_AUTHORIZATION_ID,
    };
    const getToken = await axios.post(
      `https://marketapi.bnb.com.bo/ClientAuthentication.API/api/v1/auth/token`,
      data
    );
    if (getToken.status === 200) {
      const data2 = {
        qrId: qrId,
      };
      const qrStatus = await axios.post(
        `https://marketapi.bnb.com.bo/QRSimple.API/api/v1/main/getQRStatusAsync`,
        data2,
        {
          headers: {
            Authorization: `Bearer ${getToken.data.message}`,
          },
        }
      );
      if (qrStatus.status === 200) {
        const user = req.user;

        const postExists = await Posts.findByPk(postId);

        if (!postExists) {
          return res.status(404).json({ error: "Post not found" });
        }

        const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
        const currentDateTime = new Date();
        const reservedExpiryDate = new Date(
          currentDateTime.getTime() + oneDayInMilliseconds
        );

        postExists.reserved = true;
        postExists.reservedExpiry = reservedExpiryDate;
        postExists.reservedUserId = user.id;

        await postExists.save();
        return res.json({ postExists, message: "Post reserved successfully" });
      } else {
        res.status(400).json({ error: qrStatus.data.message });
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
