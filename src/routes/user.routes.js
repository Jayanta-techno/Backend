import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router=Router();


router.route("/register").post(registerUser);
// route.route("/login").post(login);
export default router ; 