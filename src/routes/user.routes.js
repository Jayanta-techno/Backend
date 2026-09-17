import { Router } from "express";
import {registerUser, loginUser, logOutUser,
    refreshAccessToken, changeCurrentPassword,
    getCurrentUser, updateAccountDetails,
    changeAvatar, changeCoverImage,getWatchHistory} from "../controllers/user.controller.js";
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


router.route("/logout").post(verifyJWT,logOutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT,changeCurrentPassword);
router.route("/current-user").get(verifyJWT,getCurrentUser);
router.route("/update-account").patch(verifyJWT,updateAccountDetails);
router.route("/avatar").patch(verifyJWT,upload.single("avatar"),changeAvatar);
router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"),changeCoverImage);


export default router ; 