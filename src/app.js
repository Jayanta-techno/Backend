import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";



const app = express();
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}));

app.use(express.json({limit:'10mb'}));  // to get data from json body
app.use(express.urlencoded({limit:'10mb',extended:true})); // to encdode data from url
app.use(express.static('public')); // to serve static files from public folder like images,fevicons etc
app.use(cookieParser()); // to parse cookies from request headers




export {app}