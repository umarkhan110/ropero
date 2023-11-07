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

  // Admin Response
router.post('/admin-response', async (req, res) => {
  try {
    const { userId, description } = req.body;

    const adminResponse = true;
    const ticket = await Ticket.create({ description, adminResponse, userId });
    res.json({ticket, message: "Admin response is submitted successfully"});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while creating the ticket.' });
  }
});

  router.get('/get-tickets-by-id/:userId', async (req, res) => {
    try {
        const {userId} = req.params;
        const user = await User.findByPk(userId, {
            include: {
              model: Ticket,
              as: 'Ticket',
            },
          });
          const data = {
            id: user.id,
            username: user.username,
            email: user.email,
            profileImage: user.profileImage,
            tickets: user.Ticket
          }
        res.json(data);
      } catch (error) {
        console.error('An error occurred:', error);
      }     
  });

  router.get('/get-all-tickets', async (req, res) => {
    try {

        const tickets = await Ticket.findAll({
          include: [
            { model: User, as: "User", attributes: ["id", "username", "email", "profileImage"] },
          ],
        });
        const uniqueTicketsMap = new Map();

        // Iterate through the tickets array and add unique tickets to the map
        for (const ticket of tickets) {
          uniqueTicketsMap.set(ticket.userId, ticket);
        }
    
        // Convert the map values (unique tickets) back to an array
        const uniqueTickets = Array.from(uniqueTicketsMap.values());
    
        res.json(uniqueTickets);
      } catch (error) {
        console.error('An error occurred:', error);
      }     
  });
  
// // Update a ticket (admin response)
// router.put('/update-ticket/:ticketId', async (req, res) => {
//     try {
//     //   // Ensure that only admin users can update tickets (you may have a different method to identify admins)
//     //   if (!req.user.isAdmin) {
//     //     return res.status(403).json({ error: 'Unauthorized. Admin access is required.' });
//     //   }
  
//       const { ticketId } = req.params;
//       const { adminResponse } = req.body;
  
//       const ticket = await Ticket.findByPk(ticketId);
  
//       if (!ticket) {
//         return res.status(404).json({ error: 'Ticket not found.' });
//       }
  
//       // Update the ticket with the admin response
//       ticket.adminResponse = adminResponse;
//       await ticket.save();
  
//       res.json({ ticket, message: 'Ticket updated with admin response.' });
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ error: 'An error occurred while updating the ticket.' });
//     }
//   });

export default router;
