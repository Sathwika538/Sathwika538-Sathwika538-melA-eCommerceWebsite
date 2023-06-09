const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const User = require("../models/userModel");
const sendToken = require('../utils/jwtToken');
const sendEmail = require('../utils/sendEmail.js');
const crypto = require('crypto');
const cloudinary = require('cloudinary');

exports.registerUser = catchAsyncErrors( async(req,res,next)=>{

    const myCloud = await cloudinary.v2.uploader.upload_large(req.body.avatar, {
        folder:"avatars",
        width:150,
        crop:"scale",
    })
    const {name,email,password} = req.body;

    const user = await User.create({
        name,
        email,
        password,
        avatar:{
            public_id:myCloud.public_id,
            url:myCloud.secure_url,
        },
    });

    sendToken(user,201,res);
})


exports.loginUser = catchAsyncErrors (async (req,res,next)=>{

    const {email,password} = req.body;

    if(!email || !password){
        return next(new ErrorHandler("Please Enter Email and Password",400))
    }

    const user =await User.findOne({email}).select("+password");

    if(!user){
        return next(new ErrorHandler("Invalid Email or Password",401));

    }

    const isPasswordMatched =await user.comparePassword(password);

    if(!isPasswordMatched){
        return next(new ErrorHandler("Invalid Email or Password",401));

    }

    // const token = user.getJWTToken();

    // res.status(201).json({
    //     success:true,
    //     token,
    // })

    sendToken(user,201,res);

})

exports.logout = catchAsyncErrors( async (req,res,next)=>{

    res.cookie("token",null,{
        expires:new Date(Date.now()),
        httpOnly:true
    });

    res.status(200).json({
        success:true,
        message:"Logged Out"
    });
});

exports.forgotPassword = catchAsyncErrors(async(req,res,next)=>{
    const user = await User.findOne({email:req.body.email});

    if(!user){
        return next(new ErrorHandler("User not found",404));
    }

    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave:false });

    const resetPasswordUrl = `${req.protocol}://${req.get("host")}/password/reset/${resetToken}`;

    const message = `Your Password reset token is -> \n\n ${resetPasswordUrl} \n\nIf you are not requested this email, please ignore it` ;

    try{

        await sendEmail({
            email:user.email,
            subject:`Ecommerce Password Recovery`,
            message
        });

        res.status(200).json({
            success:true,
            message:`Email sent to ${user.email} successfully`
        });

    }catch(error){
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        console.log("errorrr");
        await user.save({validateBeforeSave:false});

        return next(new ErrorHandler(error.message,500));
    }
})

exports.resetPassword = catchAsyncErrors(async (req,res,next)=>{
    //creating token hash 
    const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
    
    const user = await User.findOne({
        resetPasswordToken:resetPasswordToken,
        resetPasswordExpire:{ $gt:Date.now() },
    });

    if(!user){
        return next(new ErrorHandler("Reset Password Token is invalid or has been expired",404));
    }

    if(req.body.password!=req.body.confirmPassword){
        return next(new ErrorHandler("Password does not match",404));
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    sendToken(user,200,res);
})

//User Details
exports.getUserDetails = catchAsyncErrors(async (req,res,next)=>{
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success:true,
        user,
    })
})

exports.updatePassword = catchAsyncErrors(async (req,res,next)=>{

    const user = await User.findById(req.user.id).select("+password");

    const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

    if(!isPasswordMatched){
        return next(new ErrorHandler("Old password is incorrect",400));
    }

    if(req.body.newPassword!=req.body.confirmPassword){
        return next(new ErrorHandler("Password does not match",400));
    }

    user.password = req.body.newPassword;

    await user.save()

   sendToken(user,200,res);
})


exports.updateProfile = catchAsyncErrors(async (req,res,next)=>{

   const newUserData = {
    name:req.body.name,
    email:req.body.email
   } ;

   if(req.body.avatar !== ""){
    const user = await User.findById(req.user.id);

    const imageId = user.avatar.public_id;

    await cloudinary.v2.uploader.destroy(imageId);

    const myCloud = await cloudinary.v2.uploader.upload_large(req.body.avatar, {
        folder:"avatars",
        width:150,
        crop:"scale",
    })

    newUserData.avatar = {
        public_id:myCloud.public_id,
        url: myCloud.secure_url,
    }
   }

   const user =await User.findByIdAndUpdate(req.user.id,newUserData,{
    new:true,
    runValidators:true,
    useFindAndModify:false
   })

   res.status(200).json({
    success:true
   })
})

//(admin accessing)
exports.getAllUsers = catchAsyncErrors(async (req,res,next)=>{

    const users = await User.find();

    res.status(200).json({
        success:true,
        users,
    })
})

//(admin accessing)
exports.getSingleUser = catchAsyncErrors(async (req,res,next)=>{

    const user = await User.findById(req.params.id);

    if(!user){
        return next(
            new ErrorHandler(`User with Id: ${req.params.id} doesn't exist`)
        )
    }
    res.status(200).json({
        success:true,
        user,
    })
})

//Update User Role-Admin
exports.updateUserRole = catchAsyncErrors(async (req,res,next)=>{

    const newUserData = {
     name:req.body.name,
     email:req.body.email,
     role:req.body.role
    } 
    const user =await User.findByIdAndUpdate(req.params.id,newUserData,{
     new:true,
     runValidators:true,
     useFindAndModify:false
    })
 
    res.status(200).json({
     success:true
    })
 })
 
 //Delete User-Admin
 exports.deleteUser = catchAsyncErrors(async (req,res,next)=>{

    const user = await User.findById(req.params.id);

    const imageId = user.avatar.public_id;

    await cloudinary.v2.uploader.destroy(imageId);

    if(!user){
        return next(
            new ErrorHandler(`User with Id ${req.params.id} does'nt exist.`)
        )
    }
    
    await user.deleteOne();
 
    res.status(200).json({
     success:true,
     message:"User deleted successfully"
    })
 })
 