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

const getVideosByTitle=asyncHandler(async(req,res)=>{
    const {title}=req.params

    const videos=await Video.find({
        title:{$regex:title,$options:"i"}
    }).where("isPublished").equals(true)

    if(videos.length===0){
        throw new ApiError(404,"No videos found")
    }

    return res.status(200).json(
        new ApiResponse(200,videos,"Videos fetched successfully")
    )
})

const getVideoByID=asyncHandler(async(req,res)=>{
    const {_id}=req.params //_id is the id of the video from the params
    const video = await Video.findOne({
        _id,
        isPublished: true
      })

    if(!video){ //if video not found
        throw new ApiError(404,"Video not found")
    }

    return res.status(200).json( //returning the video
        new ApiResponse(200,video,"Video fetched successfully")
    )
})

const getAllVideos=asyncHandler(async(req,res)=>{
    const channelId=req.params.channelId //channelId is the id of the channel from the params
    const channel=await User.findById(channelId)
    
    if(!channel){
        throw new ApiError(404,"Channel not found")
    }
    const videos=await Video.find({owner:channelId}).where("isPublished").equals(true) //finding all videos of the channel

    if(videos.length===0){ //if no videos found
        throw new ApiError(404,"No videos found")
    }

    return res.status(200).json(
        new ApiResponse(200,videos,"Videos fetched successfully")
    )
})

const deleteVideo=asyncHandler(async(req,res)=>{
    const {_id}=req.params //params mein se id le liya of the video to be deleted
    const userId=req.user?._id //logged in user
    const video=await Video.findById(_id) //video to be deleted searched by id

    if(!video){ //if video not found
        throw new ApiError(404,"Video not found")
    }

    if(!video.owner.equals(userId)){ //if the video is not owned by the logged in user
        throw new ApiError(403,"You are not authorized to delete this video")
    }

    const videoLink=video.video
    const thumbnailLink=video.thumbnail

    await video.deleteOne() //deleting the video

    await deleteOnCloudinary(videoLink)
    await deleteOnCloudinary(thumbnailLink)

    return res.status(200).json(
        new ApiResponse(200,video,"Video deleted successfully")
    )
})
export {publishVideo,getVideoByTitle,getVideoByID,getAllVideos,deleteVideo} ;