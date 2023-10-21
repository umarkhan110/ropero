import express from "express";
import QrCode from "../models/QrCode.js";
import checkUserAuthentication from "../middleware/authMiddleware.js";
import axios from "axios";
import "dotenv/config";
const router = express.Router();

// Create a new subscription
router.post("/subscribed", async (req, res) => {
  try {
    const { userId, package_name, packageId, amount, credits } = req.body;
    if (packageId && userId) {
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
          amount: amount,
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
        const qrCode = await QrCode.create({
          userId,
          packageId,
          qr_code: qrRes.data.qr,
          qrId: qrRes.data.id,
          package_name,
          amount,
          credits
        });
        res.status(201).json(qrCode);
      }
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while creating a QR Code." });
  }
});

// Verify Payment
router.get("/qr-status/:id",checkUserAuthentication, async (req, res) => {
  // console.log(req.user)
  const qrId = req.params.id;
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
      console.log(getToken.data.message)
      const data2= {
        qrId:qrId
    }
      const qrStatus = await axios.post(
        `https://marketapi.bnb.com.bo/QRSimple.API/api/v1/main/getQRStatusAsync`,
        data2,
        {
          headers: {
            Authorization: `Bearer ${getToken.data.message}`,
          },
        }
      ); 
      // console.log(qrStatus)
      if(qrStatus.status === 200){
        console.log("gjhjhg")
        const existingQrCode = await QrCode.findOne({
          where: { qrId: qrId },
        });
        if(existingQrCode){
          console.log("abc:", existingQrCode.credits)
          const user = req.user;
          user.credits =  user.credits + existingQrCode.credits;
          await user.save();
          qrStatus.data.message = `${existingQrCode.credits} Credits are added into your account`
          res.json(qrStatus.data);
        }
      }
    }
  } catch (error) {
    // console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get subscriptions
router.get("/get-all-subscription", async (req, res) => {
  try {
    const subscriptions = await QrCode.findAll();
    res.json(subscriptions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


export default router;