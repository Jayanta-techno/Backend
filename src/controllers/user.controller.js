import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }
        const accesstoken = user.generateAccessToken();
        const refreshtoken = user.generateRefreshToken();
        user.refreshToken = refreshtoken;
        await user.save({ validateBeforeSave: tfalse });
        //when saving the refresh token, we use false so other validation doesn't interfere
        return { accesstoken, refreshtoken };
    } catch (error) {
        throw new ApiError(500, "something went wrong while token generation.")
    }
}



const registerUser = asyncHandler(async (req, res, next) => {
    // res.status(200).json({
    //     message:"ok"
    // })
    const { fullname, email, username, password } = req.body;
    // console.log("Email:",email);
    console.log("Body:", req.body);
    if ([fullname, email, username, password].some((field) =>
        field?.trim() === ""
    )) {
        throw new ApiError(400, "All fields are required !")
    }
    const user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
        throw new ApiError(409, "User already exists with this email or username !")
    }
    const avatarLocalpath = req.files?.avatar[0]?.path;
    const coverImageLocalpath = req.files?.coverImage[0]?.path;

    if (!avatarLocalpath) {
        throw new ApiError(400, "Avatar is required !")
    }
    const avatar_upload = await uploadOnCloudinary(avatarLocalpath);
    const coverImage_upload = coverImageLocalpath
        ? await uploadOnCloudinary(coverImageLocalpath)
        : null;
    if (!avatar_upload) {
        throw new ApiError(400, "Avatar file is required!")
    }
    const user_db = await User.create({
        fullname,
        avatar: avatar_upload.url,
        coverImage: coverImage_upload?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })
    const createdUser = await User.findById(user_db._id).select(
        "-password -refreshToken"
    )
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering.")
    }
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;
    if (!username && !email) {
        // i think and hoga
        throw new ApiError(400, "username or email is required");
    }
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (!user) {
        throw new ApiError(404, "nO User Found");
    }
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Username or password invalid");
    }
    const { accesstoken, refreshtoken } = await generateAccessAndRefreshTokens(user._id);
    const loggedInUser= await User.findById(user._id).select("-password -refreshToken");
    const options={
        httpOnly:true,
        secure:true,
    }
    return res.status(200)
    .cookie("accessToken",accesstoken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,accesstoken,refreshtoken,
            },
            "User logged in successfully"
        )
    )
})

const logOutUser=asyncHandler(async (req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined,
            }
        },
        {
            new:true,
        }
    )
    const options={
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged Out"));
})


export { registerUser,loginUser,logOutUser};


