import { Router } from "express";
import { registerUser,loginUser,logOutUser} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
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

router.route("/login").post(loginUser);


router.route("/logout").post(verifyJWT,logOutUser)

export default router ; 