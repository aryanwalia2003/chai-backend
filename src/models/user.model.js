import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const userSchema=new mongoose.Schema({
    username:{
        type:String,
        required:[true,"Username is required"],
        unique:true,
        lowercase:true,
        index:true,
        minlength:[5,"Username must be at least 3 characters long"],
        maxlength:[18,"Username must be less than 18 characters long"],
    },
    email:{
        type:String,
        required:[true,"Email is required"],
        unique:true,
        lowercase:true,
        trim:true,
    },
    fullname:{
        type:String,
        required:[true,"Full name is required"],
        trim:true,
        index:true
    },
    avatar:{
        type:String,// cloudinary url
        required:true,
    },
    coverImage:{
        type:String,// cloudinary url
    },
    watchHistory:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Video",
    }],
    password:{
        type:String,
        required:[true,"Password is required"],
        minlength:[8,"Password must be at least 8 characters long"],
        maxlength:[18,"Password must be less than 18 characters long"],
    },
    refreshToken:{
        type:String,
    },
},{timestamps:true})

userSchema.pre("save", async function(next){ //to hash the password before saving it to the database
    if(!this.isModified("password")) return next() //if the password is not even modified , then  return next

    this.password=await bcrypt.hash(this.password,10) //to hash the password
    next() //to move to the next middleware which is the save method
})

userSchema.methods.isPasswordCorrect=async function(password){ //to check if the password entered by the user is correct , made because we have used the save method
    return await bcrypt.compare(password,this.password) //this.password is the hashed password saved in the database and password is the password entered by the user
}

userSchema.methods.generateAccessToken= async function(){ //to generate the access token which is used to authenticate the user before the user is authenticated this method takes the user id and the secret key and the expiry time
    return await jwt.sign({ 
        _id:this._id, //the user id , it is preceeded by the underscore because it is a reserved keyword in javascript which means that it is a private property of the object and comes from the mongoose schema
        email:this.email, //the email of the user
        username:this.username, //the username of the user comes from the mongoose schema
        fullname:this.fullname, //the full name of the user comes from the mongoose schema
    },process.env.ACCESS_TOKEN_SECRET,{ //the secret key is the access token secret key which is stored in the environment variables
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY, //the expiry time is the access token expiry time which is stored in the environment variables
    }) 
}

userSchema.methods.generateRefreshToken= async function(){
    return await jwt.sign({
        _id:this._id,
    },process.env.REFRESH_TOKEN_SECRET,{
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY,
    })
}






export const User=mongoose.model("User",userSchema)