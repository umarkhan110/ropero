import express from "express";
const router = express.Router();
import multer from "multer";
import giffUpload from "../factory/giffUpload.js";
import Ads from "../models/Ads.js";
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Define the predefined purposes
const predefinedPurposes = ["Featured", "Recommended", "Popular", "Newest"];

// Add ad by admin
router.post("/createAd", upload.single("giff"), async (req, res) => {
  try {
    const { purpose } = req.body;
    if (!predefinedPurposes.includes(purpose)) {
      return res.status(400).json({ error: "Invalid purpose" });
    }
    // Upload giff to S3
    let giff = null;
    if (req.file) {
      const response = await giffUpload(req.file.buffer, req.file.originalname);
      giff = response;
    }
    const newAd = await Ads.create({
      purpose,
      giff,
    });
    res.status(201).json({
      message: `Giff added for ${purpose}`,
      ad: newAd,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error });
  }
});

// Get ads
router.get("/getAllAds", async (req, res) => {
  try {
    const ads = await Ads.findAll();
    res.json(ads);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error });
  }
});

// Get Ad by Id
router.get("/getAdById/:id", async (req, res) => {
  try {
    const adId = req.params.id;
    const ad = await Ads.findByPk(adId);
    if (!ad) {
      return res.status(404).json({ message: "Ad not found" });
    }
    res.json(ad);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error });
  }
});

// Get Ad by Purpose
router.get("/getAdByPurpose/:purpose", async (req, res) => {
  try {
    const purpose = req.params.purpose;
    
    if (!predefinedPurposes.includes(purpose)) {
      return res.status(400).json({ error: "Invalid purpose" });
    }
    
    const ad = await Ads.findAll({ where: { purpose: purpose } });
    
    if (!ad || ad.length === 0) {
      return res.status(404).json({ message: "Ad not found" });
    }
    res.json(ad);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error });
  }
});

// Update Ad by Id
router.put("/updateAd/:id", upload.single("giff"), async (req, res) => {
  try {
    const adId = req.params.id;
    const { purpose } = req.body;
    const ad = await Ads.findByPk(adId);
    if (!ad) {
      return res.status(404).json({ message: "Ad not found" });
    }
    if (!predefinedPurposes.includes(purpose)) {
      return res.status(400).json({ error: "Invalid purpose" });
    }
    // Upload giff to S3
    let giff = null;
    if (req.file) {
      const response = await giffUpload(req.file.buffer, req.file.originalname);
      giff = response;
    }
    ad.purpose = purpose || ad.purpose;
    ad.giff = giff != null ? giff : ad.giff;
    await ad.save();
    return res.json({ message: "Ad updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

// Delete Ad by ID
router.delete("/deleteAd/:id", async (req, res) => {
  try {
    const adId = req.params.id;
    const ad = await Ads.findByPk(adId);
    if (!ad) {
      return res.status(404).json({ error: "Ad not found" });
    }
    await ad.destroy();
    return res.status(200).json({ message: "Ad removed successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error });
  }
});

export default router;
