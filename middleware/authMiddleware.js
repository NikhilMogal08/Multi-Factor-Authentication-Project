import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import User from "../models/User.js";
import Otp from "../models/otpVerification.js";

const requireAuth = (req, res, next) => {
    const token = req.cookies.jwt;

    // check json web token exists & is verified
    if (token) {
        jwt.verify(token, 'secretkey',(error, decodedToken) =>{
            if (error) {
                console.log(error.message);
                res.redirect('/login');
            } else {
                console.log(decodedToken);
                next();
            }
        })
    } else {
        res.redirect('/login');
    }
}

const checkUser = (req, res, next) => {
    const token = req.cookies.jwt;

    if (token) {
        jwt.verify(token, 'secretkey', async(error, decodedToken) =>{
            if (error) {
                console.log(error.message);
                res.locals.user = null;
                next();
            } else {
                console.log(decodedToken);
                let user =await User.findById(decodedToken.id);
                res.locals.user = user;
                next();
            }
        })
    } else {
        res.locals.user = null;
        next();
    }
}

let transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'prince.donnelly@ethereal.email',
        pass: 'wKA1ZkVwdeaUwq2vGX'
    }
});

const sendOtpVerificationEmail = async (_id, email) => {
    try {
        const otp = `${Math.floor(1000+Math.random()* 9000)}`;

        const mailOptions = {
            from: '<webcraftedminds@gmail.com>',
            to: email,
            subject: 'verify your email',
            html: `<p>Please use this OTP <b>"${otp}"</b> to verify you email. </p><br><p>This OTP is valid only for 5 minutes</p>`

        }
        console.log(otp);
        const deletionResult = await Otp.deleteMany({ userId: _id });
        const newOtpVerification =await new Otp({
            userId:_id,
            otp: otp
        });

        await newOtpVerification.save();
        let send =await transporter.sendMail(mailOptions);
        // res.json({
        //     status:"pending",
        //     message:"verification otp sent",
        //     data:{
        //         userId: _id,
        //         email,
        //     }
        // })
    } catch (error) {
        console.log(error.message);
    }
}

export {requireAuth, checkUser, sendOtpVerificationEmail};