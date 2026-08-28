import express from "express";
import authRoute from "./routes/auth.route.js";
import userRoute from "./routes/user.route.js";
import blogRoute from "./routes/blogs.route.js";

const app = express();

app.use(express.json()); // parse JSON request body

app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/blogs", blogRoute);

// nothing above matched, so the path does not exist. the method and the raw
// url are echoed back because "route not found" alone cannot tell a wrong
// path apart from a right path reached with the wrong method
app.use((req, res) => {
    res.status(404).json({
        message: "route not found",
        method: req.method,
        path: req.originalUrl,
    })
});

// express hands any error thrown in a handler here. four arguments is what
// marks this as an error handler, so `next` must stay even though it is unused
app.use((err, req, res, next) => {
    console.error(err)
    res.status(500).json({ message: "something went wrong" })
});

export default app;
