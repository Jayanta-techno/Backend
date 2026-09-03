import mongoose from "mongoose";
import { DB_name } from "../constants.js";

export const connectDB = async () => {
    try{
        const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_name}`);
        console.log(`\n MongoDB connected!! DB host:${connectionInstance.connection.host} DB name:${connectionInstance.name} DB port:${connectionInstance.port}`);
    }catch(error){
        console.log("MongoDB connection error:",error);
        console.log("MongoDB_uri:",process.env.MONGODB_URI);
        process.exit(1);
    };
}

export default connectDB;