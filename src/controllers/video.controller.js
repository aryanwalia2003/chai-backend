import {ApiError} from "../utils/apiErrors.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {getVideoDurationInSeconds} from "../utils/videoDuration.js"

const publishVideo=asyncHandler(async(req,res)=>{
    console.log("Video controller called")
    const user=await User.findById(req.user?._id)
    console.log("user",user)

    if(!user){
        throw new ApiError(404,"User not found. Please login again")
    }

    const {title,description}=req.body

    if(!title || !description){
        throw new ApiError(400,"Title and description are required")
    }

    const thumbnailLocalPath=req.files?.thumbnail?.[0]?.path
    console.log("thumbnailLocalPath",thumbnailLocalPath)
    if(!thumbnailLocalPath){
        throw new ApiError(400,"Thumbnail is required")
    }

    const videoLocalPath=req.files?.video?.[0]?.path
    console.log("videoLocalPath",videoLocalPath)
    if(!videoLocalPath){
        throw new ApiError(400,"Video is required")
    }

    const duration=await getVideoDurationInSeconds(videoLocalPath)
    console.log("duration",duration)

    const video=await uploadOnCloudinary(videoLocalPath)
    console.log("video",video)
    const thumbnail=await uploadOnCloudinary(thumbnailLocalPath)
    console.log("thumbnail",thumbnail)

    if(!thumbnail){
        throw new ApiError(500,"Failed to upload thumbnail on cloudinary")
    }

    if(!video){
        throw new ApiError(500,"Failed to upload video on cloudinary")
    }

    const videoData=await Video.create({
        title,
        description,
        duration,
        video,
        thumbnail,
        owner:user._id,
    })
    console.log("videoData",videoData)

    return res.status(200).json(
        new ApiResponse(200,videoData,"Video published successfully")
    )
})

export {publishVideo} ;