// cronjobs.js
import cron from 'node-cron';
import { Op } from 'sequelize'; // Import Op for Sequelize operators
import Posts from './models/Posts';

// Define your cron job schedule
// This example runs every hour at the 0th minute
const cronSchedule = '0 * * * *';

// Function to update featuredExpiry and reservedExpiry
const updateExpiryFields = async () => {
  try {
    // Update featured posts
    await Posts.update(
      { featuredExpiry: null }, // Set your logic for updating featuredExpiry here
      { where: { featured: true, featuredExpiry: { [Op.lt]: new Date() } } }
    );

    // Update reserved posts
    await Posts.update(
      { reservedExpiry: null }, // Set your logic for updating reservedExpiry here
      { where: { reserved: true, reservedExpiry: { [Op.lt]: new Date() } } }
    );

    console.log('Expiry fields updated successfully.');
  } catch (error) {
    console.error('Error updating expiry fields:', error);
  }
};

// Schedule the cron job
cron.schedule(cronSchedule, updateExpiryFields);