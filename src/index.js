
import dotenv from 'dotenv'
import mongoose from "mongoose";
import { DB_name } from "./constants.js";
import connectdb from "./db/db.js";
import express from "express";

dotenv.config({
    path:'./env'
})

connectdb();


const app = express();