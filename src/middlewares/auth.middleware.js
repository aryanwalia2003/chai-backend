import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/apiErrors.js"
import jwt from "jsonwebtoken"
import {User} from "../models/user.model.js"

export const verifyJWT=asyncHandler(async(req,res,next)=>{
    try {
        const accessToken=req.cookies?.accessToken|| req.headers?.authorization?.replace("Bearer ","")
    
        if(!accessToken){
            throw new ApiError(401,"Please login to access this page")
        }
    
        const decodedToken=await jwt.verify(accessToken,process.env.ACCESS_TOKEN_SECRET)
    
        if(!decodedToken){
            throw new ApiError(401,"Please login to access this page")
        }
    
        const user=await User.findById(decodedToken?._id).select("-password -refreshToken")
        
        if(!user){
            throw new ApiError(401,"Please login to access this page")
        }
    
        req.user=user
        next()
    } catch (error) {
        throw new ApiError(401,"Something went wrong while verifying the JWT token")
    }
})