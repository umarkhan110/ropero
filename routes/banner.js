import express from 'express';
import Banners from '../models/Banner.js';
import multer from 'multer';
import bannerVideoToS3 from '../factory/banner_video.js';
const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Create a new banner
router.post('/createBanner', upload.single("banner_video"), async (req, res) => {
  try {
    let banner_video = null;
    if (req.file) {
      const uploadResponse = await bannerVideoToS3(
        req.file.buffer,
        req.file.originalname
      );
      banner_video = uploadResponse;
    }
    const { name } = req.body;
    const banner = await  Banners.create({ name, banner_video });
    res.status(201).json(banner);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while creating a banner.' });
  }
});

// View All Banners
router.get('/viewAllBanners', async (req, res) => {
  try {
    const banners = await Banners.findAll();
    res.json(banners);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
);


// View Banner by Id
router.get('/viewBanner/:id', async (req, res) => {
    try {
      const bannerId = req.params.id;
      const { name } = req.body;
      const banner = await Banners.findByPk(bannerId);
  
      if (!banner) {
        return res.status(404).json({ message: 'Banner not found' });
      }
      return res.json(banner);
    } catch (error) {
  
      res.status(500).json({ error: error });
    }
  });

// Update Banner by Id
router.put('/updateBanner/:id', upload.single("banner_video"), async (req, res) => {
  try {
    let banner_video = null;
    if (req.file) {
      const uploadResponse = await bannerVideoToS3(
        req.file.buffer,
        req.file.originalname
      );
      banner_video = uploadResponse;
    }
    const bannerId = req.params.id;
    const { name } = req.body;
    const banner = await Banners.findByPk(bannerId);

    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }
    banner.name = name;
    banner.banner_video = banner_video;
    await banner.save();
    return res.json({ message: 'Banner updated successfully' });
  } catch (error) {

    res.status(500).json({ error: error });
  }
});

// Delete Banner by ID
router.delete("/deleteBanner/:id", async (req, res) => {
  try {
    const bannerId = req.params.id;
    const banner = await Banners.findByPk(bannerId);
    if (!banner) {
      return res.status(404).json({ error: "Banner not found" });
    }
    await banner.destroy();
    return res.status(200).json({ message: "Banner removed successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


export default router;
