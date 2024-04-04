import cron from 'node-cron';
import Posts  from './models/Posts.js';
import { Sequelize } from 'sequelize';

cron.schedule('* * * * *', async () => {
  try {
    const currentDateTime = new Date();
    const expiredFeaturedPosts = await Posts.findAll({
      where: {
        featured: true,
        featuredExpiry: {
          [Sequelize.Op.lt]: currentDateTime,
        },
      },
    });

    // Update the featured status to false for expired posts
    for (const post of expiredFeaturedPosts) {
      post.featured = false;
      await post.save();
    }

    const expiredReservedPosts = await Posts.findAll({
      where: {
        reserved: true,
        reservedExpiry: {
          [Sequelize.Op.lt]: currentDateTime,
        },
      },
    });

    // Update the featured status to false for expired posts
    for (const post of expiredReservedPosts) {
      post.reserved = false;
      await post.save();
    }

    const soldOutPosts = await Posts.findAll({
      where: {
        soldOut: true,
        soldOutStartTime: {
          [Sequelize.Op.lt]: currentDateTime,
        },
      },
    });

    // Update the featured status to false for expired posts
    for (const post of soldOutPosts) {
      await post.destroy();
    }

    console.log('Featured posts with expired featuredExpiry updated.');
  } catch (error) {
    console.error('Error updating featured posts:', error);
  }
});
