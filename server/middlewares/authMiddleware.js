import jwt from "jsonwebtoken";
import tokenBlacklistModel from "../model/blacklistModels.js";

export const authUser = async (req, res, next) => {
  try {
    console.log("Token exists:", !!req.cookies?.token);

    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token not found.",
      });
    }

    const isTokenBlacklisted = await tokenBlacklistModel.findOne({
      token,
    });

    if (isTokenBlacklisted) {
      return res.status(401).json({
        success: false,
        message: "Token is invalid",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET_KEY
    );

    console.log("Decoded user:", decoded);

    req.user = decoded;

    next();
  } catch (error) {
    console.log("Auth error:", error.message);

    return res.status(403).json({
      success: false,
      message: error.message,
    });
  }
};
