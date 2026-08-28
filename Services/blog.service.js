import { Blog } from "../models/index.js";
import { ServiceError, parse_id } from "../middlewares/error.middleware.js";

// update and delete share this rule exactly, so it lives in one place. the
// caller is identified by the token, never by anything in the body
const assert_can_act_on = (blog, actor, verb) => {
    if (blog.userId !== actor.id && actor.role !== "admin") {
        throw new ServiceError(403, `You are not authorized to ${verb} this blog.`)
    }
}

// look the row up before checking ownership: answering 403 for an id that does
// not exist would tell a caller which ids are real
const load_blog = async (id) => {
    const blog_id = parse_id(id, "blog id")

    const blog = await Blog.findByPk(blog_id)
    if (!blog) {
        throw new ServiceError(404, "blog not found")
    }

    return blog
}

// the three text fields are required on create and validated the same way
// wherever they are written
const clean_text = (value, field) => {
    if (typeof value !== "string" || value.trim() === "") {
        throw new ServiceError(400, `${field} cannot be empty`)
    }

    return value.trim()
}

// userId is not in this signature on purpose. it comes from the token, so a
// body carrying "userId": <someone else> cannot post a blog under their name
export const create_blog = async ({ author, blogTitle, blog, category }) => {
    const created = await Blog.create({
        userId: author.id,
        blogTitle: clean_text(blogTitle, "blogTitle"),
        blog: clean_text(blog, "blog"),
        category: clean_text(category, "category"),
    })

    return created
}

export const update_blog = async ({ id, actor, blogTitle, blog, category }) => {
    const existing = await load_blog(id)
    assert_can_act_on(existing, actor, "update")

    // a body with none of the editable fields would report success while
    // changing nothing
    if (blogTitle === undefined && blog === undefined && category === undefined) {
        throw new ServiceError(400, "provide at least one of blogTitle, blog or category")
    }

    if (blogTitle !== undefined) existing.blogTitle = clean_text(blogTitle, "blogTitle")
    if (blog !== undefined) existing.blog = clean_text(blog, "blog")
    if (category !== undefined) existing.category = clean_text(category, "category")

    // userId is never reassigned here, so a blog cannot be moved to another
    // author by editing it
    await existing.save()

    return existing
}

export const delete_blog = async ({ id, actor }) => {
    const existing = await load_blog(id)
    assert_can_act_on(existing, actor, "delete")

    await existing.destroy()

    return { id: existing.id }
}
