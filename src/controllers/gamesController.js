import connection from '../database/database.js';
import joi from 'joi';

const gamesSchema = joi.object({
    name: joi.string().min(1).required(),
    image: joi.string(),
    stockTotal: joi.number().integer().min(1).required(),
    categoryId: joi.number().integer().required(),
    pricePerDay: joi.number().integer().min(1).required()
});

async function showGames(req, res) {
    const { name } = req.query;

    if(name === undefined) {
        const allGames = await connection.query('SELECT games.*, categories.name AS "categoryName" FROM games JOIN categories ON games."categoryId" = categories.id;');
        return res.status(200).send(allGames.rows);
    }

    const consultedGames = await connection.query('SELECT games.*, categories.name AS "categoryName" FROM games JOIN categories ON games."categoryId" = categories.id WHERE LOWER(games.name) LIKE LOWER($1);', [`${name}%`]);

    res.status(200).send(consultedGames.rows);
} 

async function createGame(req, res) {
    const validation = gamesSchema.validate(req.body);
    if(validation.error) {
        const errors = validation.error.details.map(detail => detail.message);
        return res.status(400).send(errors);
    }

    const { name, image, stockTotal, categoryId, pricePerDay } = req.body;
    
    const existingCategory = await connection.query('SELECT * FROM categories WHERE id = $1;', [categoryId]);

    if(!existingCategory.rows.length) {
        return res.status(400).send('Category not found!');
    }
    
    const existingName = await connection.query('SELECT * FROM games WHERE name = $1;', [name]);

    if(existingName.rows.length) {
        return res.status(409).send('There is already a game with that name!');
    }

    connection.query('INSERT INTO games(name, image, "stockTotal", "categoryId", "pricePerDay") VALUES ($1, $2, $3, $4, $5);', [name, image, stockTotal, categoryId, pricePerDay]);

    res.sendStatus(201);
}

export { showGames, createGame };