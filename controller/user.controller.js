import {
    list_users,
    get_user,
    update_user,
    delete_user,
    set_user_status,
} from "../Services/user.service.js";
import { send_error } from "../middlewares/error.middleware.js";

// GET /api/users  (admin)
export const get_users = async (req, res) => {
    try {
        const { page, limit } = req.query

        const { users, meta } = await list_users({ page, limit })

        res.status(200).json({
            message: "users found",
            meta,
            data: users,
        })
    } catch (error) {
        send_error(res, error)
    }
}

// GET /api/users/me
// answered from the id inside the token, so a caller can never read someone
// else's row through this route
export const get_me = async (req, res) => {
    try {
        const user = await get_user(req.user.id)

        res.status(200).json({
            message: "user found",
            data: user,
        })
    } catch (error) {
        send_error(res, error)
    }
}

// GET /api/users/:id
export const get_user_by_id = async (req, res) => {
    try {
        const user = await get_user(req.params.id)

        res.status(200).json({
            message: "user found",
            data: user,
        })
    } catch (error) {
        send_error(res, error)
    }
}

// PUT /api/users/:id
export const update = async (req, res) => {
    try {
        // same rule as register: fields are picked one by one, so a body
        // carrying { "role": "admin" } or { "isActive": true } changes nothing
        const { firstname, lastname, email } = req.body

        const user = await update_user({
            id: req.params.id,
            requester: req.user, // from the token, not the body
            firstname,
            lastname,
            email,
        })

        res.status(200).json({
            message: "user updated",
            data: user,
        })
    } catch (error) {
        send_error(res, error)
    }
}

// DELETE /api/users/:id  (admin)
export const remove = async (req, res) => {
    try {
        const { id } = await delete_user({
            id: req.params.id,
            requester: req.user,
        })

        res.status(200).json({
            message: "user deleted",
            data: { id },
        })
    } catch (error) {
        send_error(res, error)
    }
}

// PATCH /api/users/:id/status  (admin)
export const update_status = async (req, res) => {
    try {
        const { isActive } = req.body

        const user = await set_user_status({
            id: req.params.id,
            requester: req.user,
            isActive,
        })

        res.status(200).json({
            message: isActive ? "user activated" : "user deactivated",
            data: user,
        })
    } catch (error) {
        send_error(res, error)
    }
}
