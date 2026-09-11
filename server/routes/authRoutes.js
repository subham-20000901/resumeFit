import express from "express";
import { getMeController, loginUser, logoutController, registerUser } from "../controller/authController.js";
import { authUser } from "../middlewares/authMiddleware.js";

const authRouter = express.Router();

authRouter.post('/register',registerUser);
authRouter.post('/login',loginUser);
authRouter.get('/logout',logoutController);
authRouter.get('/get-me',authUser,getMeController);


export default authRouter;