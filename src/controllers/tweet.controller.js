import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
// create tweet
const createTweet=asyncHandler(async(res,req)=>{
    const {content}=req.body;
    if(!content?.trim()){
        throw new ApiError(400,"Tweet content is required")
    }
    const tweet=await Tweet.create({
        content:content.trim(),
        owner:req.user._id
    })
    if (!tweet) {
        throw new ApiError(500, "Something went wrong while creating tweet");
    }

    return res.status(201).json(
        new ApiResponse(
            201,
            tweet,
            "Tweet created successfully"
        )
    );
})
// get all user tweets
const getUserTweets=asyncHandler(async(req,res)=>{
    const {userId}=req.params;
    if(!isValidObjectId(userId)){
        throw new ApiError(400,"Invalid user Id");
    }
    const user=await User.findById(userId);
    if(!user){
        throw new ApiError(404,"User not found");
    }
    const tweets=await Tweet.find({
        owner:userId
    }).populate("owner","username fullname avatar")
    .sort({createdAt:-1})

    return res.status(200).json(
        new ApiResponse(
            200,
            tweets,
            "User tweets fetched successfully"
        )
    );
})
// update a tweet
const updateTweet=asyncHandler(async(res,res)=>{
    const {tweetId}=req.params;
    const {content}=req.body;
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid tweet ID");
    }
    if(!content?.trim()){
        throw new ApiError(400,"Tweet content is required")
    }
    const tweet= await Tweet.findById(tweetId);
    if(!tweet){
        throw new ApiError(404,"tweets not found");
    }
    if(tweet.owner.toString()!==req.user._id.toString()){
        throw new ApiError(403,"you are not authorised to update this tweet");
    }
    tweet.content=content.trim(); // update the content here
    await tweet.save();
    return res.status(200).json(
        new ApiResponse(200,tweet,"Tweet updated successfully")
    );
})
// delete a tweet
const deleteTweet=asyncHandler(async(req,res)=>{
    const{tweetId}=req.params;
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid tweet iD");
    }
    const tweet=await Tweet.findById(tweetId);
    if(!tweet){
        throw new ApiError(404,"Tweet not found");
    }
    if(tweet.owner.toString()!==req.user._id.toString()){
        throw new ApiError(403,"You are not authorised to delete this tweet");
    }
    await Tweet.findByIdAndUpdate(tweetId);
    return res.status(200).json(
        new ApiResponse(200,{},"Tweet deleted successfully")
    );
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
};