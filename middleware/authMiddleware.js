import jwt from "jsonwebtoken"
import User from "../models/User.js"


const checkUserAuthentication = async (req, res, next) => {
  let token;
  const { authorization } = req.headers;
  if (authorization && authorization.startsWith('Bearer')) {
    try {
      token = authorization.split(' ')[1];
      const userTokenInfo = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({
        where: { id: userTokenInfo.userId },
        attributes: { exclude: ["-password"] },
      });
      req.user = user;
      next();
    } catch (error) {
      console.error(error);
   return  res.status(400).json({ error: 'Invalid authorization key' });

    }
  }
  if (!token) {
   return  res.status(400).json({ error: 'Authentication token missing' });
  }
};
export default checkUserAuthentication;

  
