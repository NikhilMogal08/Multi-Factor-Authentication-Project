import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';

// Define the user schema
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Please enter an Email'],
        unique: [true, 'Please enter a valid Email'],
        lowercase: true,
        validate: {
            validator: validator.isEmail,
            message: 'Please enter a valid Email'
        }
    },
    password: {
        type: String,
        required: [true, 'Please enter a Password'],
        minLength: [6, 'Minimum password length should be 6 characters'],
    },
    attempts: {
        type: Number,
        default: 0
    },
    gaSequence: {
        type: Number,
        default: null,
        minLength: [6, 'Please Select all the blocks'],
    },
    status: {
        type: String,
        default: 'pending'
    },
});

// Execute function after save
userSchema.post('save', function (doc, next) {
    console.log('user created successfully', doc);
    next();
});

// Execute function before save
userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt();
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

// Static method to login
userSchema.statics.login = async function (email, password) {
    const user = await this.findOne({ email });
    if (user) {
        if (user.attempts >= 3) {
            throw Error('Account blocked. Please contact support.');
        }
        
        const auth = await bcrypt.compare(password, user.password);
        if (auth) {
            await user.updateOne({ attempts: 0 }); // Reset attempts on successful login
            return user;
        } else {
            user.attempts += 1; // Increment attempts on failed login
            await user.updateOne({ attempts: user.attempts });
            const attemptsLeft = 3 - user.attempts;
            throw Error(`Incorrect Password. You have ${attemptsLeft} attempt(s) left before your account is blocked.`);
        }
    } else {
        throw Error('Incorrect Email');
    }
};

// Create a model using the schema
const User = mongoose.model('User', userSchema);

// Export the model
export default User;
