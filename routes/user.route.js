import express from "express";
import {
    get_users,
    get_me,
    get_user_by_id,
    update,
    remove,
    update_status,
} from "../controller/user.controller.js";
import { verify_token, is_admin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// nothing here is public, so the token check runs for every route below
// instead of being repeated on each one
router.use(verify_token);

router.get("/", is_admin, get_users);

// declared before "/:id", otherwise express matches "me" as an id and
// parse_id rejects it with a 400
router.get("/me", get_me);

router.get("/:id", is_admin, get_user_by_id);

// the service decides whether this caller owns the row or is an admin
// router.put("/:id", update);

// router.delete("/:id", is_admin, remove);
router.patch("/:id/status", is_admin, update_status);

export default router;
