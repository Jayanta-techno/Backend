import { Router } from "express";
import {
    deleteVideo,
    getAllVideos,
    getVideosById,
    publishAvideo,
    togglePublishStatus,
    updateVideo
} from "../controllers/video.controller.js"

import { verifyJWT } from "../middlewares/auth.middlewares.js"
import {upload} from "../middlewares/multer.middlewares.js"

const router =Router();

router.route("/")
.get(getAllVideos)
.post(verifyJWT,
    upload.fields([
        {
            name:"vidoeFile",
            maxCount:1,
        },
        {
            name:"thumbnail",
            maxCount:1,
        },
    ]),
    publishAvideo
);

router
.route("/videoId")
.get(getVideosById)
.delete(deleteVideo)
.patch(upload.single("thumbnail"),updateVideo);

router.route("/toggle/publish/:vidoeId").patch(verifyJWT,togglePublishStatus);

export default router;