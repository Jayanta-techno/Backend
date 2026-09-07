import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from "../utils/ApiError.js" ;
import {User} from "../models/user.models.js";
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import {ApiResponse} from '../utils/ApiResponse.js';


const registerUser=asyncHandler(async(req,res,next)=>{
    // res.status(200).json({
    //     message:"ok"
    // })
    const {fullname,email,username,password}=req.body ;
    // console.log("Email:",email);
    if([fullname,email,username,password].some((field)=>
        field?.trim()===""
    )){
        throw new ApiError(400,"All fields are required !")
    }
    const user= await User.findOne({$or:[{email},{username}]});
    if(user){
        throw new ApiError(409,"User already exists with this email or username !")
    }
    const avatarLocalpath= req.files?.avatar[0].path ;
    const coverImageLocalpath= req.files?.avatar[0].path;

    if(!avatarLocalpath){
        throw new ApiError(400,"Avatar is required !")
    }
    const avatar_upload=await uploadOnCloudinary(avatarLocalpath);
    const coverImage_upload= await uploadOnCloudinary(coverImageLocalpath);
    if(!avatar_upload){
        throw new ApiError(400,"Avatar file is required!")
    }
    const user_db=await User.create({
        fullname,
        avatar:avatar_upload.url,
        coverImage:coverImage_upload?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })
    const createdUser=User.findById(user_db._id).select(
        "-pasword -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering.")
    }
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User Registered Successfully")
    )
})

export {registerUser} ;