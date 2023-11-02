import express from "express";
import Ticket from "../models/Ticket.js";
import checkUserAuthentication from "../middleware/authMiddleware.js";
import User from "../models/User.js";
const router = express.Router();

// Create a ticket
router.post('/create-ticket', checkUserAuthentication, async (req, res) => {
    try {
      const { description } = req.body;
      const userId = req.user.id;

      const ticket = await Ticket.create({ description, userId });
      res.json({ticket, message: "Your ticket is submitted successfully"});
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while creating the ticket.' });
    }
  });

  router.get('/get-tickets-by-id/:userId', async (req, res) => {
    try {
        const {userId} = req.params;
        console.log("userI", userId)
        const user = await User.findByPk(userId, {
            include: {
              model: Ticket,
              as: 'Ticket',
            },
          });
        res.json(user.Ticket);
      } catch (error) {
        console.error('An error occurred:', error);
      }     
  });

  router.get('/get-all-tickets', async (req, res) => {
    try {

        const tickets = await Ticket.findAll();
        res.json(tickets);
      } catch (error) {
        console.error('An error occurred:', error);
      }     
  });
  
// Update a ticket (admin response)
router.put('/update-ticket/:ticketId', async (req, res) => {
    try {
    //   // Ensure that only admin users can update tickets (you may have a different method to identify admins)
    //   if (!req.user.isAdmin) {
    //     return res.status(403).json({ error: 'Unauthorized. Admin access is required.' });
    //   }
  
      const { ticketId } = req.params;
      const { adminResponse } = req.body;
  
      const ticket = await Ticket.findByPk(ticketId);
  
      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found.' });
      }
  
      // Update the ticket with the admin response
      ticket.adminResponse = adminResponse;
      await ticket.save();
  
      res.json({ ticket, message: 'Ticket updated with admin response.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while updating the ticket.' });
    }
  });

export default router;
