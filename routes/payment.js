import express from "express";
import Bank from "../models/Bank.js";

const router = express.Router();

// Create a new Package
router.post("/ReceiveNotification", async (req, res) => {
  try {
    const {
      QRId,
      Gloss,
      sourceBankId,
      originName,
      VoucherId,
      TransactionDateTime,
      additionalData
    } = req.body;
    if (!QRId ||
        !Gloss ||
        !sourceBankId ||
        !originName ||
        !VoucherId ||
        !TransactionDateTime ||
        !additionalData) {
        return res.status(400).json({ error: 'All fields must be filled.' });
      }
    const payment = await Bank.create({
      QRId,
      Gloss,
      sourceBankId,
      originName,
      VoucherId,
      TransactionDateTime,
      additionalData,
    });
    res.status(201).json({"success": true,
    "message": "ok"});
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while creating a payment." });
  }
});

export default router;
