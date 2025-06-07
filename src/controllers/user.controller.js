import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/apiErrors.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

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

export {registerUser}