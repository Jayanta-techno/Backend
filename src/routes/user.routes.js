import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middlewares.js";
const router=Router();


router.route("/register").post(upload.fields([
    {
        name:"avatar",
        maxCount:1
    },
    {
        name:"coverImage", //check karna in the db model
        maxCount:1
    }
]),registerUser);
// route.route("/login").post(login);
export default router ; 