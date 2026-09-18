import mongoose, { isValidObjectId } from 'mongoose';
import {Video}from '../models/video.model.js';
import {User} from "../models/user.models.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { uploadOnCloudinary} from '../utils/cloudinary.js';

const getAllVideos=asyncHandler(async(req,res)=>{
    const {page=1,limit=10,query,sortBy,sortType,userId}=req.body;
    const pageNumber=Math.max(Number(page)||1,1);
    const limitNumber=Math.max(Number(limit)||10,1);
    const matchStage={};
    // search by title/description
    if(query?.trim()){
        matchStage.$or=[
            {
                title:{
                    $regex:query.trim(),
                    $option:"i"
                }
            },
            {
                description:{
                    $regex:query.trim(),
                    $option:"i"
                }
            }
        ];
    }
    if(userId){
        if(!isValidObjectId(userId)){
            throw new ApiError(400,"Invalid User id");
        }
        matchStage.owner = new mongoose.Types.ObjectId(userId);
    }
    matchStage.isPublished=true;
    const sortOrder=sortType==="asc" ? 1:-1;
    const videos=await Video.aggregate([
        {
            $match:matchStage
        },
        {
            $sort:{
                [sortBy]:sortOrder
            }
        },
        {
            $skip:(pageNumber-1)*limitNumber
        },
        {
            $limit: limitNumber
        },

        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },

        {
            $unwind: "$owner"
        },
        {
            $project: {
                title: 1,
                description: 1,
                videoFile: 1,
                thumbnail: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                createdAt: 1,

                owner: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    avatar: 1
                }
            }
        }
    ]);
    const totalVideos = await Video.countDocuments(matchStage);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                videos,
                page: pageNumber,
                limit: limitNumber,
                totalVideos,
                totalPages: Math.ceil(
                    totalVideos / limitNumber
                )
            },
            "Videos fetched successfully"
        )
    );

})

const publishAVideo=asyncHandler(async(req,res)=>{
    const {title,description}=req.body;
    // validate test fields
    if(!title.trim()||!description.trim()){
        throw new ApiError(400,"Title and description are required.");
    }
    const videoLocalPath=req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath=req.files?.thumbnail?.[0]?.path;
    if(!videoLocalPath){
        throw new ApiError(400,"Thumbnail is required")
    }
    const videoFile=await uploadOnCloudinary(videoLocalPath);
    if(!videoFile){
        throw new ApiError(500,"vidoe uplaod failed");
    }
    const thumbnailFile= await uploadOnCloudinary(thumbnailLocalPath);
    if(!thumbnailFile){
        throw new ApiError(500,"Thumbnail upload failed");
    }
    const video = await Video.create({

        videoFile: videoFile.url,

        thumbnail: thumbnailFile.url,

        title: title.trim(),

        description: description.trim(),

        duration: videoFile.duration,

        owner: req.user._id,

        isPublished: true
    })
    if(!video){
        throw new ApiError(500,"Something went wrong while creating video");
    }
    return res.status(201).json(
        new ApiResponse(201,video,"video published successfully")  
    )
})
const updateVideo=asyncHandler(async(req,res)=>{
    const {videoId}=req.params;
    const {title,description}=req.body;
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video ID");
    }
    const video=await Video.findById(videoId);
    if(!video){
        throw new ApiError(404,"Video not found");
    }
    if(video.owner.toString()!==req.user._id.toString()){
        throw new ApiError(403,"you are authorised to update  this video");
    }
    if(title!==undefined){
        if(!title.trim()){
            throw new ApiError(400,"Title can't be empty");
        }
        video.title=title.trim();
    }
    if (description !== undefined) {
        video.description = description.trim();
    }
    const thumbnailLocalPath = req.file?.path;

    if (thumbnailLocalPath) {

        const thumbnailFile = await uploadOnCloudinary(
            thumbnailLocalPath
        );

        if (!thumbnailFile) {
            throw new ApiError(
                500,
                "Thumbnail upload failed"
            );
        }
    }
    await video.save();
    return res.status(200).json(
        new ApiResponse(200,video,"video upadetd successfully")
    );
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(
            400,
            "Invalid video ID"
        );
    }
    const video = await Video.findById(videoId)
        .populate(
            "owner",
            "username fullName avatar"
        );

    if (!video) {
        throw new ApiError(
            404,
            "Video not found"
        );
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            video,
            "Video fetched successfully"
        )
    );
    
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video id");
    }
    const video =await Video.findById(videoId);
    if(!video){
        throw new ApiError(404,"Video not found");
    }
    if(video.owner.toString()!==req.user._id.toString()){
        throw new ApiError(403,"You are not authorised to delete the video");
    }
    await Video.findByIdAndDelete(videoId);
    return res.status(200).json(
        new ApiResponse(200,{},"Vidoe deleted successfully")
    );
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid vidoe iD");
    }
    const video=await Video.findById(videoId);
    if(!video){
        throw new ApiError(404,"video not found");
    }
    if(video.owner.toString()!==req.user._id.toString()){
        throw new ApiError(
            403,
            "You are not authorized to change publish status"
        );
    }
    video.isPublished=!video.isPublished;
    await video.save();
    return res.status(200).json(
        new ApiResponse(200,
            video,
            `video is now ${
                video.isPublished
                ? "published":"unpublished"
            }`
        )
    );
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}