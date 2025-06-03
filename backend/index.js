const express = require("express");
const connectDB = require("./db");
const cookieParser = require("cookie-parser");
const CORS = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const meetingRouter = require("./routes/meetingRouter");
const authRouter = require("./routes/authRouter");

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(
  CORS({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

connectDB();

app.use("/meeting/", meetingRouter);
app.use("/auth/", authRouter);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
