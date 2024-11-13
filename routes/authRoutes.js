import express from "express";
import {signup_get, signup_post, login_get, login_post, logout_get, otp_post, register_ga, verify_ga} from "../Controllers/authControllers.js";
import {requireAuth} from "../middleware/authMiddleware.js"
const router = express.Router();

router.get("/signup", signup_get);

router.post("/signup",signup_post);

router.post("/createGa",register_ga);

router.post("/verify_ga",verify_ga);

router.get("/login", login_get);

router.post("/login", login_post);

router.post("/verifyOtp", otp_post);

router.get("/logout", logout_get);

export default router;
