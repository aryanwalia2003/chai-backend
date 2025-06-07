import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET,
})

// console.log("CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME);
// console.log("CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY); 
// console.log("CLOUDINARY_API_SECRET:", process.env.CLOUDINARY_API_SECRET);

const uploadOnCloudinary=async (localFilePath)=>{
    try {
        if(!localFilePath) return null;
        
        // upload file to cloudinary
        const result=await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto",
        })
        // file has been uploaded successfully
        console.log("file is uploaded on cloudinary",result.secure_url);
        // console.log("result",result);
        
        fs.unlinkSync(localFilePath);
        return result.secure_url;

    } catch (error) {
        //remove the file from local file system
        fs.unlinkSync(localFilePath);
        return null;
    }
}


export {uploadOnCloudinary}