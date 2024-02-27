//approach 2
import dotenv from "dotenv"
import connectDB from "./db/index.js"
import { app } from "./app.js"
dotenv.config({
    path: './env'
})
connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000 , ()=>{
        console.log(`server is running at PORT : ${process.env.PORT}}`);
    })
}).catch((err)=>{
    console.log("MONGODB connection failed !!",err)
})










/*import mongoose from "mongoose"
import {DB_NAME} from "./constants.js"*/






//approach 1
/* 
import express from "express"
const app = express()
;(async ()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error)=>{
            console.log("ERROR",error);
            throw error
        })
        app.listen(process.env.PORT,()=>{
            console.log(`App is listen on port ${process.env.PORT}`)
        })
    }
    catch(error){
        console.error("ERROR" ,error)
        throw err
    }
})()*/ 