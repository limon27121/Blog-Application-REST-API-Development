import { create_blog, update_blog, delete_blog } from "../Services/blog.service.js";
import { send_error } from "../middlewares/error.middleware.js";

// POST /api/blogs/create
export const create = async (req, res) => {
    try {
        // userId is deliberately not read from the body. it comes from the
        // token inside the service, so a caller cannot post under another name
        const { blogTitle, blog, category } = req.body

        const created = await create_blog({
            author: req.user,
            blogTitle,
            blog,
            category,
        })

        res.status(201).json({
            message: "blog created",
            data: created,
        })
    } catch (error) {
        send_error(res, error)
    }
}

// PUT /api/blogs/update/:id
export const update = async (req, res) => {
    try {
        const { blogTitle, blog, category } = req.body

        const updated = await update_blog({
            id: req.params.id,
            actor: req.user, // the service decides owner or admin from this
            blogTitle,
            blog,
            category,
        })

        res.status(200).json({
            message: "blog updated",
            data: updated,
        })
    } catch (error) {
        send_error(res, error)
    }
}

// DELETE /api/blogs/delete/:id  and  DELETE /api/blogs/:id
export const remove = async (req, res) => {
    try {
        const { id } = await delete_blog({
            id: req.params.id,
            actor: req.user,
        })

        res.status(200).json({
            message: "blog deleted",
            data: { id },
        })
    } catch (error) {
        send_error(res, error)
    }
}
