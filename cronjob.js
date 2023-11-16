import cron from 'node-cron';
import Posts  from './models/Posts.js';
import { Sequelize } from 'sequelize';
// Define a cron schedule to run the task, e.g., every day at midnight
cron.schedule('* * * * *', async () => {
  try {
    const currentDateTime = new Date();
    console.log(currentDateTime)
    // Find featured posts with expired featuredExpiry dates
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

    console.log('Featured posts with expired featuredExpiry updated.');
  } catch (error) {
    console.error('Error updating featured posts:', error);
  }
});

// Start the cron job
// cron.start();
