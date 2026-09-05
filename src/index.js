
import dotenv from 'dotenv'
import mongoose from "mongoose";
import { DB_name } from "./constants.js";
import connectdb from "./db/db.js";

dotenv.config({
    path:'./env'
})

connectdb()
.then(() => {
    console.log(`Database connected to ${DB_name}`);
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on port ${process.env.PORT || 8000}`);
    });
})
.catch((error) => {
    console.error("Database connection failed:", error);
    process.exit(1);
})