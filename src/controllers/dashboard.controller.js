import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats=asyncHandler(async(req,res)=>{
    const userId=new mongoose.Types.ObjectId(req.user._id);
    const stats=await Video.aggregate([
        {
            $match:{
                owner:userId
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"video",
                as:"likes"
            }
        },
        {
            $addFields:{
                likesCount:{
                    $size:"$likes"
                }
            }
        },
        {
            $group:{
                _id:null,
                totalViews:{
                    $sum:"$videos"
                }
            },
            totalLikes:{
                $sum:"$likesCount"
            }
        },
        {
            $lookup:{
                from:"subscription",
                let:{
                    channelId:userId
                },
                pipeline:[
                    {
                        $match:{
                            $expr:{
                                $eq:["$channel","$$channelId"]
                            }
                        }
                    }
                ],
                as:"subscribers"
            }
        },
        {
            $addFields:{
                totalSubsribers:{
                    $size:"$subscribers"
                }
            }
        },
        {
            $project:{
                _id:0,
                totalViews:1,
                totalVideos:1,
                totalLikes:1,
                totalSubsribers:1
            }
        }
    ]);
    const channelStats=stats[0]||{
        totalViews:0,
        totalVideos:0,
        totalLikes:0,
        totalSubsribers:0
    };
    return res.status(200).json(
        new ApiResponse(
            200,
            channelStats,
            "Channel statistics fetched successfully"
        )
    );

})

const getChannelVideos=asyncHandler(async(req,res)=>{
    let{
        page=1,
        limit=10,
        sortBy="createdAt",
        sortType="desc",
    }=req.query;
    
    page=Math.max(Number(page)||1,1);
    limit=Math.max(Number(limit)||10,1);
    const sortOrder=sortType==="asc"? 1:-1
    const sortStage={
        [sortBy]:sortOrder
    };
    const videos=await Video.find({
        owner:req.user._id
    })
    .select("videoFile thumbnail views duration title createdAt")
    .sort(sortStage)
    .skip((page-1)*limit)
    .limit(limit);

    const totalVideos= await Video.countDocuments({
        owner:req.user._id
    });
    return res.status(200).json(
        new ApiResponse(
            200,
            {
                videos,
                currentPage:page,
                totalPages:Math.ceil(totalVideos/limit),
                totalVideos
            },
            "channel videos fetched successfully"
        )
    );
});

export {
    getChannelStats,
    getChannelVideos
}