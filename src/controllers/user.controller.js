import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"


const generateAccessAndRefreshTokens = async(userId)=>{
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})
        return {accessToken, refreshToken};
    }catch(error){
        throw new ApiError(404,"something went wrong while generate access and refresh token") 
    }
}

const registerUser = asyncHandler(async (req,res)=>{
    //get user details
    //validate - not empty
    //check if already exist with the help of username or email
    //check for images , check for avatars present or not
    //upload them to cloudinary
    //create user object 
    //remove password and refresh token
    //check for user creation
    //return re


    //1 get user details
    const{fullName,email,username,password} = req.body
    console.log("email",email);


    //check for validation
    if([fullName,email,username,password].some((field)=>field?.trim()==="")){
                throw new ApiError(400,"All fields are required")
    }



    //check user already present or not
    const existedUser = await User.findOne({$or : [{ username } , { email }]})
    if(existedUser){
        throw new ApiError(409,"user with email or username already present")
    }


    //check for images avatar present or not
    const avatarLocalPath = req.files?.avatar[0]?.path
    //const coverImageLocalPath = req.files?.coverImage[0]?.path
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }


    //upload them to clodinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }


    //create user object
    const user = await User.create({
        fullName ,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()

    })



    //check user is created or not and remove password and refresh tokken
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500,"something went wrong while register the user")
    }


    //now return response
    return res.status(201).json(
        new ApiResponse(200,createdUser,"user register  successfully")
    )


})
const loginUser = asyncHandler(async (req,res)=>{
    //req bode get data
    //username or email exist
    //find tje user
    //password check
    //access and refresh token generate
    //send cookie


    //1 get data from req body
    const {email,username,password} = req.body


    //2 check existence of user and password
    if(!email && !username){
        throw new ApiError(400,"username or password is required")
    }


    //find the user
    const user = await User.findOne({ $or :[{username},{email}]})
    if(!user){
        throw new ApiError(404,"user does not existedUser")
    }


    //check password
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(400,"Invalid user credentials")
    }


    //generate access token and refresh token
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)


    //send cookie
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    const options = {
        httpOnly : true,
        secure : true
    }
    return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json(
        new ApiResponse(200,{
            user : loggedInUser,accessToken,refreshToken
        },"User logged In successfully")
    )


})
const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set :{refreshToken : undefined}
        },
        {
            new : true
        }
        )
        const options = {
            httpOnly : true,
            secure : true
        }
        return res
        .status(200)
        .clearCookie("accessToken",options)
        .clearCookie("refreshToken",options)
        .json(new ApiResponse(200,{},"user logged out"))
})
export { registerUser , loginUser , logoutUser}