
import dotenv from "dotenv";
import { DB_name } from "./constants.js";
import connectDB from "./db/db.js";
import { app } from "./app.js";

dotenv.config({
    path: "./.env"
});

connectDB()
    .then(() => {
        console.log(`Database connected to ${DB_name}`);

        const PORT = 8000;

        const server = app.listen(PORT, () => {
            console.log("SERVER STARTED");
            console.log("Port:", PORT);
            console.log("Address:", server.address());
        });

        //  Detect problems while starting/listening
        server.on("error", (error) => {
            console.error("❌ SERVER FAILED TO START");
            console.error("Error code:", error.code);
            console.error("Error message:", error.message);

            if (error.code === "EADDRINUSE") {
                console.error(`Port ${PORT} is already in use.`);
            }

            if (error.code === "EACCES") {
                console.error(`Permission denied for port ${PORT}.`);
            }
        });

        // Detect if server gets closed
        server.on("close", () => {
            console.log("⚠️ SERVER CLOSED");
        });
    })
    .catch((error) => {
        console.error("❌ DATABASE CONNECTION FAILED");
        console.error(error);
        process.exit(1);
    });