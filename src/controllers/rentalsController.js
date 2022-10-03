import joi from 'joi';
import connection from '../database/database.js';

const rentsSchema = joi.object({
    customerId: joi.number().integer().min(1).required(),
    gameId: joi.number().integer().min(1).required(),
    daysRented: joi.number().integer().min(1).required()
});

async function createRent(req, res) {
    const validation = rentsSchema.validate(req.body);
    
    if (validation.error) {
        const errors = validation.error.details.map(detail => detail.message);
       
        return res.status(400).send(errors);
    }

    try {
        const { customerId, gameId, daysRented } = req.body;
        
        const game = await connection.query('SELECT * FROM games WHERE games.id = $1;', [gameId]);
        if (!game.rowCount) {
            return res.status(400).send('Game not found');
        }

        const customer = await connection.query('SELECT * FROM customers WHERE customers.id = $1;', [customerId]);
        if (!customer.rowCount) {
            return res.status(400).send('Customer not found');
        }

        const gameRents = await connection.query('SELECT * FROM rentals WHERE "gameId" = $1 AND "returnDate" IS NULL;', [gameId]);
        if (game.rows[0].stockTotal - gameRents.rows.length <= 0) {
            return res.status(400).send('There are no games left in stock!');
        }

        const today = new Date();
        const rentDate = `${today.getFullYear()}/${today.getMonth()+1}/${today.getDate()}`;
        const returnDate = null;
        const originalPrice = game.rows[0].pricePerDay*daysRented;
        const delayFee = null;

        const rentsArray = [
            customerId,
            gameId,
            rentDate,
            daysRented,
            returnDate,
            originalPrice,
            delayFee,
        ];

        connection.query('INSERT INTO rentals ("customerId", "gameId", "rentDate", "daysRented", "returnDate", "originalPrice", "delayFee") VALUES ($1, $2, $3, $4, $5, $6, $7);', rentsArray);

        return res.sendStatus(201);
    } catch (error) {
        return res.status(500).send(error);
    }
}

async function showRents(req, res) {
    const { customerId, gameId } = req.query;

    const consult = 'SELECT rentals.*, customers.name as "customerName", games.name as "gameName", games."categoryId" as "categoryId", categories.name as "categoryName" FROM rentals JOIN customers ON rentals."customerId" = customers.id JOIN games ON rentals."gameId" = games.id JOIN categories ON games."categoryId" = categories.id';
    let allRents;
    
    if (customerId === undefined && gameId === undefined) {
        allRents = await connection.query(consult + ';');
    } else if (gameId === undefined) {
        allRents = await connection.query(consult + ' WHERE rentals."customerId" = $1;', [parseInt(customerId)]);
    } else if (customerId === undefined) {
        allRents = await connection.query(consult + ' WHERE rentals."gameId" = $1;', [parseInt(gameId)]);
    } else {
        allRents = await connection.query(consult + ' WHERE rentals."gameId" = $1 AND rentals."customerId" = $2;', [parseInt(gameId), parseInt(customerId)]);
    }
    
    const allRentsArray = allRents.rows.map(rent => {
        return {
            id: rent.id,
            customerId: rent.customerId,
            gameId: rent.gameId,
            rentDate: `${rent.rentDate.getFullYear()}/${rent.rentDate.getMonth()+1}/${rent.rentDate.getDate()}`,
            daysRented: rent.daysRented,
            returnDate: (rent.returnDate) ?
                `${rent.returnDate.getFullYear()}/${rent.returnDate.getMonth()+1}/${rent.returnDate.getDate()}`:
                null,
            originalPrice: rent.originalPrice,
            delayFee: rent.delayFee,
            customer: {
                id: rent.customerId,
                name: rent.customerName,
            },
            game: {
                id: rent.gameId,
                name: rent.gameName,
                categoryId: rent.categoryId,
                categoryName: rent.categoryName,
            },
        }
    });

    res.status(200).send(allRentsArray);
}

async function deleteRent(req, res) {
    const id = parseInt(req.params.id);

    const rent = await connection.query('SELECT * FROM rentals WHERE id = $1;', [id]);

    if (!rent.rowCount) {
        return res.status(404).send('Rent id not found');
    }

    if (rent.rows[0].returnDate) {
        return res.status(400).send("It's not possible to delete a rent that has already been completed!");
    } 

    connection.query('DELETE FROM rentals WHERE id = $1;', [id]);

    res.sendStatus(200);
}

async function finalizeRent(req, res) {
    const id = parseInt(req.params.id);

    const rent = await connection.query('SELECT rentals.*, games."pricePerDay" FROM rentals JOIN games ON rentals."gameId" = games.id WHERE rentals.id = $1;', [id]);
    const rentalData = rent.rows[0];

    if (!rent.rowCount) {
        return res.status(404).send('Rent not found');
    }

    if (rentalData.returnDate) {
        return res.status(400).send('This rent has already finished!');
    }

    const today = new Date();
    const returnDate = `${today.getFullYear()}/${today.getMonth()+1}/${today.getDate()}`;
    const hours = 24;
    const minutes = 60;
    const seconds = 60;
    const miliseconds = 1000;
    
    const convertingToDays = miliseconds * seconds * minutes * hours;

    const lagTime = Math.floor((today - new Date(rentalData.rentDate)) / convertingToDays - rentalData.daysRented);
    
    const delayFee = (lagTime > 0) ? lagTime * rentalData.pricePerDay : 0;

    const updateData = [returnDate, delayFee, id];

    connection.query('UPDATE rentals SET "returnDate" = $1, "delayFee" = $2 WHERE id = $3;', updateData);

    res.sendStatus(200);
}

export { createRent, showRents, deleteRent, finalizeRent };