import express from "express";
import User from "../models/User.js";
import Posts from "../models/Posts.js";
import QrCode from "../models/QrCode.js";
const router = express.Router();

router.get('/dashboard-stats', async (req, res) => {
    try {
      const users = await User.findAndCountAll();
      const posts = await Posts.findAndCountAll();
      // Calculate the total payment amount
    const totalPayments = await QrCode.sum('amount', { where: { status: "Completed" } });


      res.json({
        totalUsers: users.count,
        totalPosts: posts.count,
        totalPayments: totalPayments,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error' });
    }
  });


  export default router