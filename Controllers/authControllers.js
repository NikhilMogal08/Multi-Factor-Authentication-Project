import User from "../models/User.js";
import Otp from "../models/otpVerification.js";
import jwt from "jsonwebtoken";
import {sendOtpVerificationEmail} from "../middleware/authMiddleware.js"


const handleError = (error) => {
    console.log(error.message, error.code);
    let errors = { email: '', password: '' , otp: '' , ga: '', attempt: '', otpAttempt: '' };

    // incorrect email
    if (error.message === 'Incorrect Email') {
        errors.email = "Email is not Registered";
        return errors;
    }
    // incorrect password
    if (error.message===('Incorrect Password. You have 0 attempt(s) left before your account is blocked.')||
        error.message===('Incorrect Password. You have 1 attempt(s) left before your account is blocked.')||
        error.message===('Incorrect Password. You have 2 attempt(s) left before your account is blocked.')) {
        errors.password = error.message;
        return errors;
    }
    if (error.message === 'Account blocked. Please contact support.') {
        errors.attempt = "Account blocked. Please contact support.";
        return errors;
    }
    // if (error.message.includes('left before your account is blocked.')) {
    //     errors.attempt = error.message;
    //     return errors;
    // }
    // incorrect otp
    if (error.message === 'You have 0 attempt(s) left before your account is blocked.' || 
    error.message === 'You have 1 attempt(s) left before your account is blocked.' || 
    error.message === 'You have 2 attempt(s) left before your account is blocked.') {
        
    errors.otp = "Invalid OTP. " + error.message;
    return errors;
}

    if (error.message === 'Sorry! Account blocked. Please contact support.') {
        errors.otp = error.message;
        return errors;
    }
    // incorrect otp
    if (error.message === 'Multiple Incorrect Attempts.Account blocked, Please contact support.') {
        errors.ga = error.message;
        return errors;
    }
    if (error.message === 'Incorrect Sequence. You have 0 attempt(s) left before your account is blocked.' || 
    'Incorrect Sequence. You have 1 attempt(s) left before your account is blocked.' || 
    'Incorrect Sequence. You have 2 attempt(s) left before your account is blocked.' ) {
        errors.ga = error.message;
        return errors;
    }

    if (error.code === 11000) {
        errors.email = "Email is already registered";
        return errors;
    }

    if (error.message.includes('user validation failed')) {
        Object.values(error.errors).forEach(({ properties }) => {
            errors[properties.path] = properties.message;
        })
    }
    return errors;
}

// token creation
const maxAge = 3 * 24 * 60 * 60; // 3 days
const createToken = (id) => {
    return jwt.sign({ id }, 'secretkey', { expiresIn: maxAge })
}

export const signup_get = async (req, res) => {
    res.render('signup');
}

export const signup_post = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.create({ email, password });
        if (user) {
            await sendOtpVerificationEmail(user._id, email);
        }
        // const token = await createToken(user._id);
        // res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 })
        res.status(201).json({ user: user._id });
    } catch (error) {
        const errors = handleError(error);
        res.status(400).json({ errors });
    }
}

export const register_ga = async (req, res) => {
    const { userId, gaSequence } = req.body;

    try {
        const user = await User.findByIdAndUpdate(userId,
            { $set: { gaSequence: gaSequence } },
            { new: true } );
        const token = await createToken(user._id);
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 })
        res.status(201).json({ user: user._id });
    } catch (error) {
        console.log(error.message)
        const errors = handleError(error);
        res.status(400).json({ errors });
    }
}

export const verify_ga = async (req, res) => {
    const { userId, gaSequence } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        if (user.attempts >= 3) {
            throw new Error('Multiple Incorrect Attempts.Account blocked, Please contact support.');
        }

        if (user.gaSequence === gaSequence) {
            await user.updateOne({ attempts: 0 }); // Reset attempts on successful GA verification
            const token = await createToken(user._id);
            res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
            res.status(201).json({ user: user._id });
        } else {
            user.attempts += 1; // Increment attempts on failed GA verification
            await user.save();
            const attemptsLeft = 3 - user.attempts;
            if (user.attempts >= 3) {
                throw new Error('Multiple Incorrect Attempts.Account blocked, Please contact support.');
            } else {
                throw new Error(`Incorrect Sequence. You have ${attemptsLeft} attempt(s) left before your account is blocked.`);
            }
        }
    } catch (error) {
        const errors = handleError(error);
        res.status(400).json({ errors });
    }
}

export const login_get = async (req, res) => {
    res.render('login');
}

export const login_post = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.login(email, password);
        console.log(email);
        if (user) {
            await sendOtpVerificationEmail(user._id, email);
        }

        // const token = await createToken(user._id);
        // res.cookie('jwt', token, { httpOnly: true, secure: true, maxAge: maxAge * 1000 });
        
        res.status(200).json({ user: user._id });
    } catch (error) {
        const errors =handleError(error);
        res.status(400).json({errors});
    }
}


// export const otp_post = async (req, res) => {
//     const {userId, userOtp} = req.body;
//     try {
//         const checkOtp = await Otp.findOne({userId:userId });
//         if (checkOtp) {
//             console.log(userOtp, checkOtp.otp)
//             if (checkOtp.otp == userOtp) {
//                 res.status(200).json({ user:userId});
//             } else {
//                 throw Error('Incorrect otp');
//             }
//         }
        
//     } catch (error) {
//         const errors =handleError(error);
//         res.status(400).json({errors});
//     }
// }
export const otp_post = async (req, res) => {
    const { userId, userOtp } = req.body;
    try {
        const checkOtp = await Otp.findOne({ userId: userId });
        if (checkOtp) {
            const user = await User.findById(userId);
            if (!user) {
                throw Error('User not found');
            }
            
            if (user.attempts >= 3) {
                throw Error('Sorry! Account blocked. Please contact support.');
            }

            console.log(userOtp, checkOtp.otp);
            if (checkOtp.otp == userOtp) {
                await user.updateOne({ attempts: 0 }); // Reset attempts on successful OTP validation
                res.status(200).json({ user: userId });
            } else {
                user.attempts += 1; // Increment attempts on failed OTP validation
                await user.updateOne({ attempts: user.attempts });
                const attemptsLeft = 3 - user.attempts;
                throw Error(`You have ${attemptsLeft} attempt(s) left before your account is blocked.`);
            }
        } else {
            throw Error('OTP not found');
        }
    } catch (error) {
        const errors = handleError(error);
        res.status(400).json({ errors });
    }
};


export const logout_get = async (req, res) => {
    res.cookie('jwt', '',  {maxAge: 1}); 
    res.redirect('/');
}