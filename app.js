import express from "express";
import authRoute from "./routes/auth.route.js";

const app = express();

app.use(express.json()); // parse JSON request body

app.use("/api/auth", authRoute);
// /api/users  -> phase 6
// /api/blogs  -> phase 8

// nothing above matched, so the path does not exist
app.use((req, res) => {
    res.status(404).json({ message: "route not found" })
});

// express hands any error thrown in a handler here. four arguments is what
// marks this as an error handler, so `next` must stay even though it is unused
app.use((err, req, res, next) => {
    console.error(err)
    res.status(500).json({ message: "something went wrong" })
});

export default app;
