import mongoose from "mongoose";

const otpVerificationSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "userSchema",
  },
  status: { 
    type: String,
    default: 'pending'
  },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 },
});

const Otp = mongoose.model("otp", otpVerificationSchema);

export default Otp;

