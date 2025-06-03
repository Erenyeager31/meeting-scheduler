import jwt from "jsonwebtoken";
import {User} from "../models/User.js"; // adjust path as needed

export const authenticate = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token)
    return res.status(401).json({ message: "Authentication token missing." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists in DB
    const user = await User.findById(decoded.id).select("-password"); // exclude password
    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    req.user = user; // attach user object to req
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};
