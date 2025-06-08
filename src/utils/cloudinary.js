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

const deleteOnCloudinary=async(cloudinaryUrl)=>{
    const publicId=cloudinaryUrl.split("/").pop().split(".")[0] //extract the public id from the cloudinary url ,for example https://res.cloudinary.com/dqzqyqzqzq/image/upload/v1717808705/sample.jpg will be sample
    try {
        await cloudinary.uploader.destroy(publicId)
    } catch (error) {
        console.log("error in deleting the file from cloudinary",error)
        return null
    }
}

export {uploadOnCloudinary,deleteOnCloudinary}