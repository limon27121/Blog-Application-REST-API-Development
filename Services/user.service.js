import { User } from "../models/index.js";
import { ServiceError, parse_id } from "../middlewares/error.middleware.js";

// a caller could otherwise ask for limit=1000000 and pull the whole table in
// one query
const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 10;

// page and limit arrive as strings off the query string, so both have to be
// turned into numbers and bounded before they reach the query
const parse_pagination = ({ page, limit }) => {
    const parsed_page = page === undefined ? 1 : Number(page)
    const parsed_limit = limit === undefined ? DEFAULT_PAGE_SIZE : Number(limit)

    if (!Number.isInteger(parsed_page) || parsed_page < 1) {
        throw new ServiceError(400, "page must be a positive integer")
    }

    if (!Number.isInteger(parsed_limit) || parsed_limit < 1) {
        throw new ServiceError(400, "limit must be a positive integer")
    }

    if (parsed_limit > MAX_PAGE_SIZE) {
        throw new ServiceError(400, `limit cannot be greater than ${MAX_PAGE_SIZE}`)
    }

    return { page: parsed_page, limit: parsed_limit, offset: (parsed_page - 1) * parsed_limit }
}

// every read below goes through the default scope, so the password column is
// never part of the result. only login opts back into it
export const list_users = async ({ page, limit }) => {
    // the assignment asks for every registered user, so an unpaged request
    // returns the whole table. page or limit in the query opts into paging
    const paged = page !== undefined || limit !== undefined
    const pagination = paged ? parse_pagination({ page, limit }) : null

    const { count, rows } = await User.findAndCountAll({
        ...(paged ? { limit: pagination.limit, offset: pagination.offset } : {}),
        order: [["id", "ASC"]], // without this the order is whatever mysql returns, so page 2 could repeat a row from page 1
    })

    if (!paged) {
        return { users: rows, meta: { total: count, page: 1, limit: count, totalPages: 1 } }
    }

    return {
        users: rows,
        meta: {
            total: count,
            page: pagination.page,
            limit: pagination.limit,
            totalPages: Math.ceil(count / pagination.limit),
        },
    }
}

export const get_user = async (id) => {
    const user_id = parse_id(id, "user id")

    const user = await User.findByPk(user_id)
    if (!user) {
        throw new ServiceError(404, "user not found")
    }

    return user
}

// an admin may edit anyone. everybody else may only edit their own row, and the
// check is against the id inside the signed token, never against a body field
const assert_can_touch = (requester, target_id) => {
    if (requester.role !== "admin" && requester.id !== target_id) {
        throw new ServiceError(403, "you can only modify your own account")
    }
}

// role, isActive and password are deliberately absent from this signature.
// role and isActive move only through set_user_status / an admin path, and the
// password has its own service in phase 7 so it always gets hashed
export const update_user = async ({ id, requester, firstname, lastname, email }) => {
    const user_id = parse_id(id, "user id")
    assert_can_touch(requester, user_id)

    const user = await User.findByPk(user_id)
    if (!user) {
        throw new ServiceError(404, "user not found")
    }

    // a body with none of the editable fields would otherwise report success
    // while changing nothing
    if (firstname === undefined && lastname === undefined && email === undefined) {
        throw new ServiceError(400, "provide at least one of firstname, lastname or email")
    }

    if (firstname !== undefined) {
        if (typeof firstname !== "string" || firstname.trim() === "") {
            throw new ServiceError(400, "firstname cannot be empty")
        }
        user.firstname = firstname.trim()
    }

    // lastname is optional everywhere, so clearing it is a legal edit
    if (lastname !== undefined) {
        user.lastname = typeof lastname === "string" && lastname.trim() !== "" ? lastname.trim() : null
    }

    if (email !== undefined) {
        if (typeof email !== "string" || email.trim() === "") {
            throw new ServiceError(400, "email cannot be empty")
        }

        const next_email = email.trim()

        // checked here so the caller gets a clear 409 instead of the raw unique
        // constraint error. send_error still catches the race where two requests
        // claim the same address at once
        const existing = await User.findOne({ where: { email: next_email } })
        if (existing && existing.id !== user_id) {
            throw new ServiceError(409, "email already registered")
        }

        user.email = next_email
    }

    await user.save()

    return user
}

// admin only, gated by is_admin on the route
export const delete_user = async ({ id, requester }) => {
    const user_id = parse_id(id, "user id")

    // an admin deleting their own row would log themselves out of the only
    // account that can manage the others
    if (requester.id === user_id) {
        throw new ServiceError(400, "an admin cannot delete their own account")
    }

    const user = await User.findByPk(user_id)
    if (!user) {
        throw new ServiceError(404, "user not found")
    }

    // blogs.userId is ON DELETE CASCADE, so this takes the user's blogs with it
    await user.destroy()

    return { id: user_id }
}

// admin only. this is the one place isActive changes, which is why update_user
// refuses to read it from a body
export const set_user_status = async ({ id, requester, isActive }) => {
    const user_id = parse_id(id, "user id")

    if (typeof isActive !== "boolean") {
        throw new ServiceError(400, "isActive must be true or false")
    }

    // same reason as delete: an admin must not be able to lock themselves out
    if (requester.id === user_id) {
        throw new ServiceError(400, "an admin cannot change their own status")
    }

    const user = await User.findByPk(user_id)
    if (!user) {
        throw new ServiceError(404, "user not found")
    }

    user.isActive = isActive
    await user.save()

    return user
}
