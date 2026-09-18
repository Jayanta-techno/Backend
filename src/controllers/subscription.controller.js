import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
// change the status of subscriptions 
const toggleSubscription=asyncHandler(async(req,res)=>{
    const{channelId}=req.params;
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Invalid channel Id");
    }
    if(channelId.toString()===req.user._id.toString()){
        throw new ApiError(400,"you can't subscribe to yourself");
    }
    const channel=await User.findById(channelId);
    if(!channel){
        throw new ApiError(404,"Channel not found");
    }
    const existingSubscription= await Subscription.findOne({
        subscriber:req.user._id,
        channel:channelId
    });
    if(existingSubscription){
        await Subscription.findByIdAndDelete(existingSubscription._id);
        return res.status(200).json(
            new ApiResponse(200,{subscribed:false},
                "Channel unsubscribed successfully"
            )
        );
    }
    const subscription= await Subscription.create({
        subscriber:req.user._id,
        channel:channelId
    });
    return res.status(201).json(
        new ApiResponse(201,
            {
                subscribed:true,
                subscription
            },
            "channel subscribed successfully"
        )
    );
})

// get the subscriber of a channel
const getUserChannelSubscribers=asyncHandler(async(res,req)=>{
    const {channelId}=req.params;
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Invalid channel id");
    }
    const subscribers=await Subscription.find({
        channel:channelId
    }).populate("subscriber","username fullname avatar")
    .sort({createdAt:-1})

    return res.status(200).json(
        new ApiResponse(
            200,
            subscribers,
            "Channel subscribers fetched successfully"
        )
    );
})
// get all channels which are subscribed by the current user
const getSubscribedChannels=asyncHandler(async(req,res)=>{
    const subscriptions=await Subscription.find({
        subscriber:req.user._id
    })
    .populate("channel","username fullname avatar")
    .sort({createdAt:-1})

    return res.status(200).json(
        new ApiResponse(200,subscriptions,"subscribed channels fetched successfully")
    );
});



export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
};