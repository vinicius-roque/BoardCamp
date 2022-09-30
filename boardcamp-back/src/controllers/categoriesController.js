import connection from "../database/database.js";
import joi from 'joi';

const categorySchema = joi.object({
    name: joi.string().min(1).required()
});

async function showCategories(req, res) {
    const categories = await connection.query('SELECT * FROM categories;');

    res.status(200).send(categories.rows);
}

async function createCategory(req, res) {
    const validation = categorySchema.validate(req.body);

    if(validation.error) {
        const errors = validation.error.details.map(detail => detail.message);

        return res.status(400).send(errors);
    }

    const { name } = req.body;

    const categoryExists = await connection.query('SELECT * FROM categories WHERE name = $1', [name]);

    if(categoryExists.rows.length) {
        return res.sendStatus(409);
    } 

    connection.query('INSERT INTO categories (name) VALUES ($1)', [name]);

    res.sendStatus(201);
}

export {showCategories, createCategory};