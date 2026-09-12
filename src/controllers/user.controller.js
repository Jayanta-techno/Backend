import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from "jsonwebtoken";


const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }
        const accesstoken = user.generateAccessToken();
        const refreshtoken = user.generateRefreshToken();
        user.refreshToken = refreshtoken;
        await user.save({ validateBeforeSave: false });
        //when saving the refresh token, we use false so other validation doesn't interfere
        return { accesstoken, refreshtoken };
    } catch (error) {
        console.error("TOKEN GENERATION ERROR:", error);
        throw new ApiError(500, "Something went wrong while token generation.");
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
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    const options = {
        httpOnly: true,
        secure: true,
    }
    return res.status(200)
        .cookie("accessToken", accesstoken, options)
        .cookie("refreshToken", refreshtoken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accesstoken, refreshtoken,
                },
                "User logged in successfully"
            )
        )
})

const logOutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined,
            }
        },
        {
            new: true,
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out"));
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorised access")
    }
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken?._id);
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
        if (incomingRefreshToken != user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used.");
        }
        const options = {
            httpOnly: true,
            secure: true
        }
        const { accessToken, newrefreshToke } = await generateAccessAndRefreshTokens(user._id);
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newrefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newrefreshToken },
                    "Access Token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id)  // check karna bug maybe

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Incorrect Password")
    }
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password Changed"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(200, req.body, "Current User fetched successfully")
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body
    if (!fullname || !email) {
        throw new ApiError(400, "All fields are required")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname: fullname,
                email: email,
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Credentials changed successfully"))
})
const changeAvatar = asyncHandler(async (req, res) => {
    const localpath = req.file?.path;
    if (!localpath) {
        throw new ApiError(400, "Avatar file is missing.")
    }
    const avatar = await uploadOnCloudinary(localpath);
    if (!avatar.url) {
        throw new ApiError(500, "Error while uploading on cloudinary")
    }
    const user = User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password")

    res.status(200)
        .json(new ApiResponse(200, user, "Avatar updated successfully"))
})
const changeCoverImage = asyncHandler(async (req, res) => {
    const localpath = req.file?.path;
    if (!localpath) {
        throw new ApiError(400, "coverImage file is missing.")
    }
    const coverImage = await uploadOnCloudinary(localpath);
    if (!coverImage.url) {
        throw new ApiError(500, "Error while uploading on cloudinary")
    }
    const user = User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImage:coverImage
            }
        },
        { new: true }
    ).select("-password")

    res.status(200)
        .json(new ApiResponse(200, user, "coverimage updated successfully"))
})

export {
    registerUser, loginUser, logOutUser,
    refreshAccessToken, changeCurrentPassword,
    getCurrentUser, updateAccountDetails,
    changeAvatar, changeCoverImage };


