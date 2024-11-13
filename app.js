import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import {requireAuth, checkUser} from "./middleware/authMiddleware.js"

const app = express();
app.use(express.json());

// middleware
app.use(express.static('public'));
app.use(cookieParser("NotSoSecret"));

// view engine
app.set('view engine', 'ejs');

// database connection
  mongoose
  .connect('mongodb://13.234.202.148:27017/AuthProject')
  .then(() =>
    app.listen(3000, () => console.log(`Server running on port 3000`))
  )
  .catch((error) => console.log(error.message));

// routes
app.get('*',checkUser);
import authRoutes from "./routes/authRoutes.js";
app.use(authRoutes);

app.get('/', (req, res) => res.render('home'));
app.get('/smoothies', requireAuth ,(req, res) => res.render('smoothies'));


app.get('/read-cookies', (req, res) => {
  const cookies = req.cookies;
  console.log(cookies);
  res.json(cookies);
});

