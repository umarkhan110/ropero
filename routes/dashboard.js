import express from "express";
import User from "../models/User.js";
import Posts from "../models/Posts.js";
import QrCode from "../models/QrCode.js";
import { Sequelize } from "sequelize";
const router = express.Router();

router.get('/dashboard-stats', async (req, res) => {
    try {
      const users = await User.findAndCountAll();
      const posts = await Posts.findAndCountAll();
      const feauteredPosts = await Posts.findAndCountAll({
        where: {featured: true},
      });
      
      // Calculate the total payment amount
    const totalPayments = await QrCode.sum('amount', { where: { status: "Completed" } });
    // const dailyRevenue = await QrCode.sum('amount', { where: { status: "Completed" } });
    const completedTransactions = await QrCode.findAll({
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('createdAt')), 'date'],
        [Sequelize.fn('sum', Sequelize.col('amount')), 'totalAmount'],
      ],
      where: {
        status: 'Completed',
      },
      group: [Sequelize.fn('DATE', Sequelize.col('createdAt'))],
    });
    
    const dailyRevenue = completedTransactions.map((transaction) => ({
      date: transaction.get('date'),
      amount: transaction.get('totalAmount'),
    }));
    
    console.log(dailyRevenue);

      res.json({
        totalUsers: users.count,
        totalPosts: posts.count,
        totalPayments: totalPayments,
        feauteredPosts: feauteredPosts.counts,
        dailyRevenue
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error' });
    }
  });


  export default router