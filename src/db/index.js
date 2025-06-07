import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import { app } from "../app.js";

const connectDB=async()=>{
    try {
        // console.log("MongoDB URI:", process.env.MONGO_URI); // Debug log
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
        console.log(`Connected to DB ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("ERROR CONNECTING TO DB", error);
        process.exit(1);
    }
}

export default connectDB;
