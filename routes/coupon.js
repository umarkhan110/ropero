import express from "express"
const router = express.Router();
import  Coupon from '../models/Coupon.js';
import  checkUserAuthentication from '../middleware/authMiddleware.js';
import CouponUser from "../models/CouponUser.js";

// Create a new coupon
router.post('/create-coupon', async (req, res) => {
  try {
    const { name, limit, discountPrice } = req.body;

    const coupon = await Coupon.create({
      name,
      limit,
      discountPrice,
    });

    res.status(201).json(coupon);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while creating the coupon.' });
  }
});

// View a coupon by its ID
router.get('/view-by-id/:couponId', async (req, res) => {
    try {
      const couponId = req.params.couponId;
  
      // Find the coupon by its ID
      const coupon = await Coupon.findByPk(couponId);
  
      if (!coupon) {
        return res.status(404).json({ error: 'Coupon not found.' });
      }
  
      res.json(coupon);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while fetching the coupon.' });
    }
  });

// Vie all coupons
  router.get('/view-all-coupons', async (req, res) => {
    try {
      const coupons = await Coupon.findAll();
  
      res.json(coupons);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while fetching coupons.' });
    }
  });

  //View Coupon Detail
  router.get('/view-coupon-detail/:couponId', async (req, res) => {
    try {
      const couponId = req.params.couponId;
  
      // Find the coupon by its ID
      const coupon = await Coupon.findByPk(couponId);
  
      if (!coupon) {
        return res.status(404).json({ error: 'Coupon not found.' });
      }
  
      res.json(coupon);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.errors[0].message });
    }
  });
  // Update a coupon by its ID
router.put('/update-coupon/:couponId', async (req, res) => {
    try {
      const couponId = req.params.couponId;
      const { name, limit, discountPrice } = req.body;
  
      // Find the coupon by its ID
      const coupon = await Coupon.findByPk(couponId);
  
      if (!coupon) {
        return res.status(404).json({ error: 'Coupon not found.' });
      }
  
      // Update the coupon's properties
      coupon.name = name;
      coupon.discountPrice = discountPrice;
      coupon.limit = limit;
      await coupon.save();
  
      res.json(coupon);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.errors[0].message });
    }
  });

  // Delete a coupon by its ID
router.delete('/delete-coupon/:couponId', async (req, res) => {
    try {
      const couponId = req.params.couponId;
  
      // Find the coupon by its ID
      const coupon = await Coupon.findByPk(couponId);
  
      if (!coupon) {
        return res.status(404).json({ error: 'Coupon not found.' });
      }
  
      // Delete the coupon
      await coupon.destroy();
  
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while deleting the coupon.' });
    }
  });
  
  // Check if a user has used a coupon
router.put('/apply-coupon',checkUserAuthentication, async (req, res) => {
  try {
    const userId = req.user.id;
    const {name} = req.body;

    // Find the coupon by its ID
    const coupon = await Coupon.findOne({where: {name:name}});

    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found.' });
    }

    // Check if the user has used the coupon
    const isUsed = await CouponUser.findOne({
      where: {
        userId,
        couponId:coupon.id,
      },
    });

    if (isUsed) {
      res.json({ message: "Coupon is already used" });
    } else {
      if(coupon.limit <= coupon.timesUsed){
       return res.json({ message: "Coupon limit is reached" });
      } 
      
      coupon.timesUsed = coupon.timesUsed + 1;
      await coupon.save();
      await CouponUser.create({
        userId,
        couponId: coupon.id,
      });

      res.status(200).json({ discountPrice: coupon.discountPrice });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while checking the coupon usage.' });
  }
});

export default router;
