import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

// Load env vars
dotenv.config();

// Debug: Check if env vars are loaded
console.log("Checking environment variables...");
if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is not defined in environment variables!");
    process.exit(1);
}

connectDB()
.then(()=>{
    app.listen(process.env.PORT||8000,()=>{
        console.log(`Server is running  on port ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log("Could not start server", err);
    process.exit(1);
})









/*
import express from "express";

const app = express();

;(async()=>{
    try {
        await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        console.log(`Connected to DB ${DB_NAME}`)
    } catch (error) {
        console.log("ERROR CONNECTING TO DB", error);
        throw error;
    }
})()
*/