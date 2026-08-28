import express from "express";
import { create, update, remove } from "../controller/blogs.controller.js";
import { verify_token } from "../middlewares/auth.middleware.js";

const router = express.Router();

// every route here writes, so all of them need a token. phase 9 adds the
// public reads, which is why verify_token sits on each route instead of on
// the whole router
router.post("/create", verify_token, create);
router.put("/update/:id", verify_token, update);

// the assignment names DELETE /api/blogs/:id, the plan also asks for
// /delete/:id. both point at the same handler so either shape works
router.delete("/delete/:id", verify_token, remove);
router.delete("/:id", verify_token, remove);

export default router;
