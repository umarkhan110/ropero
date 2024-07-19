import express from "express";
const router = express.Router();
import Posts from "../models/Posts.js";
import { Op, Sequelize } from "sequelize";
import User from "../models/User.js";

// router.get("/sold-products", async (req, res) => {
//   try {
//     const results = await Posts.findAll({
//       attributes: [
//         'userId',
//         [Sequelize.fn('COUNT', Sequelize.col('Posts.id')), 'totalSold'],
//       ],
//       where: {
//         soldOut: true,
//       },
//       group: ['userId'],
//       include: [{
//         model: User,
//         as: 'user',
//         attributes: ['id', 'username'], // Adjust attributes based on your User model
//       }],
//     });

//     res.json(results);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// // New route for total amount of sold products
// router.get("/sold-products/total-amount", async (req, res) => {
//     try {
//       const results = await Posts.findAll({
//         attributes: [
//           'userId',
//           [Sequelize.fn('SUM', Sequelize.col('price')), 'totalAmount'],
//         ],
//         where: {
//           soldOut: true,
//         },
//         group: ['userId'],
//         include: [{
//           model: User,
//           as: 'user',
//           attributes: ['id', 'username'], // Adjust attributes based on your User model
//         }],
//       });
  
//       res.json(results);
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ error: "Internal Server Error" });
//     }
//   });

//   // New route for total amount of all products
// router.get("/all-products/total-amount", async (req, res) => {
//     try {
//       const results = await Posts.findAll({
//         attributes: [
//           'userId',
//           [Sequelize.fn('SUM', Sequelize.col('price')), 'totalAmount'],
//         ],
//         group: ['userId'],
//         include: [{
//           model: User,
//           as: 'user',
//           attributes: ['id', 'username'], // Adjust attributes based on your User model
//         }],
//       });
  
//       res.json(results);
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ error: "Internal Server Error" });
//     }
//   });

  // router.get("/user-products", async (req, res) => {
  //   try {
  //     const results = await Posts.findAll({
  //       attributes: [
  //         'userId',
  //         [Sequelize.fn('COUNT', Sequelize.col('Posts.id')), 'totalSold'],
  //         [Sequelize.fn('SUM', Sequelize.col('price')), 'totalAmountSold'],
  //         [Sequelize.literal('(SELECT SUM(price) FROM Posts AS p WHERE p.userId = Posts.userId)'), 'totalAmountAll'],
  //       ],
  //       where: {
  //         soldOut: true,
  //       },
  //       group: ['userId'],
  //       include: [{
  //         model: User,
  //         as: 'user',
  //         attributes: ['id', 'username'], // Adjust attributes based on your User model
  //       }],
  //     });
  
  //     res.json(results);
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).json({ error: "Internal Server Error" });
  //   }
  // });
  
  router.get("/user-products", async (req, res) => {
    try {
      const { timePeriod, city, category } = req.query;
  
      let dateFilter = {};
      const currentDate = new Date();
      
      switch (timePeriod) {
        case 'today':
          dateFilter = { soldOutStartTime: { [Op.gte]: new Date(currentDate.setHours(0, 0, 0, 0)) } };
          break;
        case 'week':
          dateFilter = { soldOutStartTime: { [Op.gte]: new Date(currentDate.setDate(currentDate.getDate() - 7)) } };
          break;
        case 'month':
          dateFilter = { soldOutStartTime: { [Op.gte]: new Date(currentDate.setMonth(currentDate.getMonth() - 1)) } };
          break;
        case '3months':
          dateFilter = { soldOutStartTime: { [Op.gte]: new Date(currentDate.setMonth(currentDate.getMonth() - 3)) } };
          break;
        case '6months':
          dateFilter = { soldOutStartTime: { [Op.gte]: new Date(currentDate.setMonth(currentDate.getMonth() - 6)) } };
          break;
        case 'year':
          dateFilter = { soldOutStartTime: { [Op.gte]: new Date(currentDate.setFullYear(currentDate.getFullYear() - 1)) } };
          break;
        case 'overall':
        default:
          dateFilter = {};
      }
  
      let whereConditions = {
        soldOut: true,
        ...dateFilter
      };
  
      if (city) {
        whereConditions.city = city;
      }
  
      if (category) {
        whereConditions.categoryId = category;
      }
  
      const results = await Posts.findAll({
        attributes: [
          'userId',
          [Sequelize.fn('COUNT', Sequelize.col('Posts.id')), 'totalSold'],
          [Sequelize.fn('SUM', Sequelize.col('price')), 'totalAmountSold'],
          [Sequelize.literal('(SELECT SUM(price) FROM Posts AS p WHERE p.userId = Posts.userId)'), 'totalAmountAll'],
        ],
        where: whereConditions,
        group: ['userId'],
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username'],
        }],
      });
  
      res.json(results);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  router.get("/overall-products", async (req, res) => {
    try {
      const { timePeriod, city, category } = req.query;
  
      let dateFilter = {};
      const currentDate = new Date();
      
      switch (timePeriod) {
        case 'today':
          dateFilter = { createdAt: { [Op.gte]: new Date(currentDate.setHours(0, 0, 0, 0)) } };
          break;
        case 'week':
          dateFilter = { createdAt: { [Op.gte]: new Date(currentDate.setDate(currentDate.getDate() - 7)) } };
          break;
        case 'month':
          dateFilter = { createdAt: { [Op.gte]: new Date(currentDate.setMonth(currentDate.getMonth() - 1)) } };
          break;
        case '3months':
          dateFilter = { createdAt: { [Op.gte]: new Date(currentDate.setMonth(currentDate.getMonth() - 3)) } };
          break;
        case '6months':
          dateFilter = { createdAt: { [Op.gte]: new Date(currentDate.setMonth(currentDate.getMonth() - 6)) } };
          break;
        case 'year':
          dateFilter = { createdAt: { [Op.gte]: new Date(currentDate.setFullYear(currentDate.getFullYear() - 1)) } };
          break;
        case 'overall':
        default:
          dateFilter = {}; // No date filter
      }
  
      let whereConditions = {
        ...dateFilter
      };
  
      if (city) {
        whereConditions.city = city;
      }
  
      if (category) {
        whereConditions.categoryId = category;
      }
  
      const overallUploaded = await Posts.count({
        where: whereConditions,
      });
  
      const overallSold = await Posts.count({
        where: {
          ...whereConditions,
          soldOut: true,
        },
      });
  
      const totalAmountSold = await Posts.sum('price', {
        where: {
          ...whereConditions,
          soldOut: true,
        },
      });
  
      const totalAmountUploaded = await Posts.sum('price', {
        where: whereConditions,
      });

      res.json({
        overallUploaded,
        overallSold,
        totalAmountSold,
        totalAmountUploaded
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  
export default router;
