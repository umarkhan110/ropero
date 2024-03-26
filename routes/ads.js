import express from "express";
const router = express.Router();
import multer from "multer";
import giffUpload from "../factory/giffUpload.js";
import Ads from "../models/Ads.js";
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Add Giff by admin
router.post("/createAd", upload.single("giff"), async (req, res) => {
  try {
    const { purpose } = req.body;
    // Upload giff to S3
    let giff = null;
    if (req.file) {
      const response = await giffUpload(
        req.file.buffer,
        req.file.originalname
      );
      giff = response;
    }
    const newAd = await Ads.create({
      purpose,
      giff
    });
    res.status(201).json({
      message: `Giff added for ${purpose}`,
      ad: newAd
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while registering." });
  }
});

export default router;
