import { Router } from "express";
import {
    addComment,
    deleteComment,
    getVideoComment,
    updateComment
} from "../controllers/comment.controller.js"

import { verifyJWT } from "../middlewares/auth.middlewares.js";


const router=Router();

router.use(verifyJWT);
router.route("/:videoId").get(getVideoComment).post(addComment);

router.route("/c/:commentId").delete(deleteComment).patch(updateComment);


export default router