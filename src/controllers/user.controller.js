import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/apiErrors.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary,deleteOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async(userId)=>{
    try{
        const user=await User.findById(userId)
        if(!user){
            throw new ApiError(404,"User not found")
        }

        const accessToken=await user.generateAccessToken()
        const refreshToken=await user.generateRefreshToken()

        user.refreshToken=refreshToken //refresh token ko user ke refresh token mein store karna hai
        await user.save({   validateBeforeSave:false    }) //save the user

        return {accessToken,refreshToken}
    }
    catch(error){
        throw new ApiError(500,"Failed to generate access and refresh tokens")
    }
}

const registerUser=asyncHandler(async(req,res)=>{
    /*
    user ka naam ,email,password aayega
    un sabko validate karna hai
    check if user already exists
    check for images,check for avatar
    upload them on cloudinary
    user ka object create karna hai
    user ko save karna hai
    check for user creation
    user ko return karna hai after removing password and refresh token from response
    */

    const {username,email,password,fullname}=req.body; //data saara le lo
    console.log(username,email,password,fullname);

    if (
        [username,email,password,fullname].some( //agar koi bhi feild empty hai toh error throw karna hai
            (feild)=>feild?.trim()==="")
    ){
        throw new ApiError(400,"All fields are required")
    }
    
    const userExists=await User.findOne({ //check if user already exists
        $or:[ //$or is used to check if the user already exists with the username or email
            {username},
            {email}
        ]
    })
    console.log("userExists",userExists)

    if (userExists){
        throw new ApiError(409,"User already exists")
    }
    
    console.log("req.files",req.files) //req.files is used to get the files from the request

    const avatarLocalPath=req.files?.avatar[0]?.path
    console.log("avatarLocalPath",avatarLocalPath)
    const coverImageLocalPath=req.files?.coverImage?.[0]?.path  
    console.log("coverImageLocalPath",coverImageLocalPath)

    if (!avatarLocalPath ){
        throw new ApiError(400,"Avatar is required")
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

    // console.log("avatar",avatar)
    // console.log("avatar type",typeof(avatar))
    // console.log("coverImage",coverImage)
    // console.log("coverImage type",typeof(coverImage))

    if(!avatar){
        throw new ApiError(500,"Failed to upload avatar on cloudinary")
    }

    
    const user=await User.create({
        fullname,
        username:username.toLowerCase(),
        email,
        password,
        avatar:avatar,
        coverImage:coverImage?coverImage:null,
    })

    const createdUser=await User.findById(user._id).select("-password -refreshToken") //-password -refreshToken is used to remove the password and refresh token from the response

    if (!createdUser){
        throw new ApiError(500,"Failed to create user")
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User created successfully")
    )
})

const loginUser=asyncHandler(async(req,res)=>{
    /*
    req.body se data milega
    username , email,password milega 
    check karna hai using email or username if the user exists 
    if it doesnt exist return 404 not found
    if it exists , check if the password is correct
    if the password is correct , generate a access token and refresh token and send cookies
    if the password is incorrect , return 401 unauthorized
    */

    const {username,email,password}=req.body;
    // console.log(username , email,password)

    if(!username && !email){
        throw new ApiError(400,"Username or email is required")
    }

    const user=await User.findOne({
        $or:[
            {username},
            {email}
        ]
    })

    if(!user){
        throw new ApiError(404,"User not found")
    }

    const isPasswordCorrect=await user.isPasswordCorrect(password)

    if(!isPasswordCorrect){
        throw new ApiError(401,"Invalid password")
    }

    const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id)
    // console.log("accessToken",accessToken)
    // console.log("refreshToken",refreshToken)

    const loggedInUser=await User.findById(user._id).select("-password -refreshToken")
    // console.log("loggedInUser",loggedInUser)

    const cookieOptions={
        httpOnly:true,
        // secure:true
    }
    return res
        .status(200)
        .cookie("accessToken", accessToken, {
            ...cookieOptions,
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        })
        .cookie("refreshToken", refreshToken, {
            ...cookieOptions,
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        })
        .json(
            new ApiResponse(200, loggedInUser, "User logged in successfully")
        )
})

const logoutUser=asyncHandler(async(req,res)=>{
    /*

    */
   const userId=req.user._id
   console.log("userId",userId)
   await User.findByIdAndUpdate(req.user._id,{
    $set:{
        refreshToken:undefined
    }
   },{new:true})

   const cookieOptions={
    httpOnly:true,
    secure:true
    }

    return res.status(200).clearCookie("accessToken",cookieOptions).clearCookie("refreshToken",cookieOptions).json(
        new ApiResponse(200,null,"User logged out successfully")
    )
})

const refreshAccessToken = asyncHandler(async(req, res) => {

    /*
    req.cookies se get the refresh token
    agar mille toh aage bardho , agar na mille toh matlab logged in nahi hai
    refresh token jo milla hai usko database waale refresh token se verify karo
    agar refresh token match nahi karta hai toh error throw karo
    agar match kar gaya toh user ko dhoond lo using findById
    agar user nahi mila toh error throw karo
    agar user mila toh new access token and refresh token generate karo
    new access token and refresh token ko return karo
    */
    // Get refresh token from cookies or request body
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request - No refresh token provided")
    }

    try {
        // Verify refresh token using correct secret
        const decoded = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        console.log("decoded",decoded)
        
        if(!decoded){
            throw new ApiError(401,"Invalid refresh token")
        }
        // Get user and validate
        const user = await User.findById(decoded._id)
        if(!user) {
            throw new ApiError(404, "Invalid refresh token - User not found")
        }

        if(user.refreshToken !== incomingRefreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const cookieOptions = {
            httpOnly: true,
        }

        // Generate new tokens
        const {accessToken, refreshToken: newRefreshToken} = await generateAccessAndRefreshTokens(user._id) //generateAccessAndRefreshTokens is a function that generates a new access token and refresh token, and also stored the refresh token in db , that is why we dont need to that here
        
        // Update response with new tokens
        return res
            .status(200)
            .cookie("accessToken", accessToken, {
                ...cookieOptions,
                maxAge: 24 * 60 * 60 * 1000 // 1 day
            })
            .cookie("refreshToken", newRefreshToken, {
                ...cookieOptions,
                maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
            })
            .json(
                new ApiResponse(
                    200,
                    {accessToken, refreshToken: newRefreshToken},
                    "Access token refreshed successfully"
                )
            )

    } catch (error) {
        throw new ApiError(401, "Invalid refresh token - Please login again")
    }
})

const changePassword=asyncHandler(async(req,res)=>{
    /*
    req.body se oldPassword,newPassword le lo
    oldPassword ko verify karwa lo
    newPassword ko update karo
    user ko return karo
    */
    
    const {oldPassword,newPassword,confirmPassword}=req.body;
    console.log("oldPassword",oldPassword)
    console.log("newPassword",newPassword)
    console.log("confirmPassword",confirmPassword)

    const userId=req.user?._id
    const user=await User.findById(userId)

    if(!user){
        throw new ApiError(404,"User not found")
    }

    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)
    console.log("isPasswordCorrect",isPasswordCorrect)

    if(!isPasswordCorrect){
        throw new ApiError(401,"Invalid old password")
    }

    if(newPassword !== confirmPassword){
        throw new ApiError(400,"New password and confirm password do not match")
    }

    if(newPassword===oldPassword){
        throw new ApiError(400,"New password cannot be the same as the old password")
    }

    user.password=newPassword
    console.log("user.password",user.password)
    await user.save({validateBeforeSave:false})

    return res.status(200).json(
        new ApiResponse(200,null,"Password changed successfully")
    )

})

const getCurrentUser=asyncHandler(async(req,res)=>{
    const currentUser=req.user
    
    return res.status(200).json(
        new ApiResponse(200,currentUser,"Current user fetched successfully")
    )   
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullname,username}=req.body;

    if(!fullname && !username){
        throw new ApiError(400,"At least one field is required")
    }

    const user=await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            fullname,
            username,
        }
    },{new:true}).select("-password -refreshToken")

    return res.status(200).json(
        new ApiResponse(200,user,"Account details updated successfully")  
    )

})

const updateAvatar=asyncHandler(async(req,res)=>{
    /*
    req.file se avatar le lo
    avatar ko multer ke through upload karo on local path
    avatar ko cloudinary par upload karo
    avatar ko user ke object mein store karo
    user ko return karo
    */

    const avatarLocalPath=req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar is required")
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath)

    if(!avatar){
        throw new ApiError(500,"Failed to upload avatar on cloudinary")
    }

    //delete old avatar from cloudinary if it exists
    if(req.user?.avatar){
        await deleteOnCloudinary(req.user.avatar)
        console.log("old avatar deleted from cloudinary")
    }

    const user=await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            avatar,
        }
    },{new:true}).select("-password -refreshToken")

    return res.status(200).json(
        new ApiResponse(200,user,"Avatar updated successfully")
    )
})

const updateCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path
    console.log("coverImageLocalPath",coverImageLocalPath)

    if(!coverImageLocalPath){
        throw new ApiError(400,"Cover image is required")
    }

    const coverImage=await uploadOnCloudinary(coverImageLocalPath)
    console.log("coverImage",coverImage)

    if(!coverImage){
        throw new ApiError(500,"Failed to upload cover image on cloudinary")
    }

    //delete old cover image from cloudinary if it exists
    if(req.user?.coverImage){
        await deleteOnCloudinary(req.user.coverImage)
        console.log("old cover image deleted from cloudinary")
    }

    const user=await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            coverImage,
        }
    },{new:true}).select("-password -refreshToken")

    return res.status(200).json(
        new ApiResponse(200,user,"Cover image updated successfully")
    )
})
export {registerUser,loginUser,logoutUser,refreshAccessToken,changePassword,getCurrentUser,updateAccountDetails,updateAvatar,updateCoverImage}