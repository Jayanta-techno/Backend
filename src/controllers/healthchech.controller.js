import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

// a simple health check endpoint for server health
const healthcheck=asyncHandler(async(res,req)=>{
    return res.status(200).json(
        new ApiResponse(
            200,
            {
                server:"ok",
                database:"ok"
            },
            "Health check successful"
        )
    );
});

export {healthcheck} ;