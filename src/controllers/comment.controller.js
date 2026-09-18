import { isValidObjectId } from "mongoose";
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Comment } from "../models/comment.model.js";
const getVideoComments= asyncHandler(async(res,req)=>{
    const {videoId}=req.params;
    const{
        page=1,
        limit=10,
    }=req.query;
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video ID");
    }
    const pageNumber=Math.max(Number(page)||1,1);
    const limitNumber=Math.max(Number(limit)||10,1);
    const comments= await Comment.find({
        video:videoId
    })
    .populate("owner","username fullname avatar")
    .sort({createdAt:-1})
    .skip((pageNumber-1)*limitNumber)
    .limit(limitNumber)

    const totalComments= await Comment.countDocuments({
        video:videoId
    });
    return res.status(200).json(
        new ApiResponse(
            200,
            {
                comments,
                currentPage:pageNumber,
                totalPages:Math.ceil(totalComments/limitNumber),
                totalComments
            },
            "video comments fetched successfully"
        )
    );
});
// Add a comment to a video
const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    if (!content?.trim()) {
        throw new ApiError(400, "Comment content is required");
    }

    const comment = await Comment.create({
        content: content.trim(),
        video: videoId,
        owner: req.user._id
    });

    if (!comment) {
        throw new ApiError(500, "Failed to add comment");
    }

    const populatedComment = await Comment.findById(comment._id)
        .populate("owner", "username fullName avatar");

    return res.status(201).json(
        new ApiResponse(
            201,
            populatedComment,
            "Comment added successfully"
        )
    );
});

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    if (!content?.trim()) {
        throw new ApiError(400, "Comment content is required");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to update this comment"
        );
    }

    comment.content = content.trim();

    await comment.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            comment,
            "Comment updated successfully"
        )
    );
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to delete this comment"
        );
    }

    await Comment.findByIdAndDelete(commentId);

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Comment deleted successfully"
        )
    );
});

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}