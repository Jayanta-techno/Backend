import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

// like or no like 
const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoID } = req.params;
    if (!isValidObjectId(videoID)) {
        throw new ApiError(400, "Invalid video id");
    }
    const existingLike = await Like.findOne({
        video: videoID,
        likedBy: req.user._id
    })
    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        return res.status(200).json(
            new ApiResponse(
                200,
                { liked: false },
                "Video like removed successfully"
            )
        );
    }
    const like = await Like.create({
        video: videoID,
        likedBy: req.user._id
    });
    return res.status(200).json(
        new ApiResponse(
            200,
            { liked: false },
            "Video like removed successfully"
        )
    );
})
// like in the comment section
const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid comment id");
    } 
    const existingLike= await Like.findOne({
        comment:commentId,
        likedBy:req.user._id,
    })  
    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id);
        return res.status(200).json(
            new ApiResponse(
                200,
                {liked:false},
                "Comment like removed successfully"
            )
        )
    }
    const like=await Like.create({
        comment:commentId,
        likedBy:req.user._id
    });
    return res.status(200).json(
        new ApiResponse(201,{liked:true},"comment liked successfully")
    )
});

// likes in the tweet
const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid tweet id");
    }
    const existingLike=await Like.findOne({
        tweet:tweetId,
        likedBy:req.user._id
    });
    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id);
        return res.status(200).json(
            new ApiResponse(200,{liked:false},"Tweet like removed successfully")
        )
    }
    const like= await Like.create({
        tweet:tweetId,
        likedBy:req.user._id
    });
    return res.status(201).json(
        new ApiResponse(201,{liked:true,like},"Tweet liked successfully")
    )
});

// get all liked vides by user
const getLikedVideos = asyncHandler(async (req, res) => {
    const likedVideos= await Like.aggregate([
        {
            $match:{
                likedBy:new mongoose.Types.ObjectId(req.user._id),
                video:{
                    $exist:true,
                    $ne:null,
                }
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"videoDetails"
            }
        },
        {
            $unwind:"$videoDetails"
        },
        {
            $replaceRoot:{
                newRoot:"$videoDetails",
            }
        }
    ]);
    return res.status(200).json(
        new ApiResponse(200,likedVideos,"Liked videos fetched successfully")
    );
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}