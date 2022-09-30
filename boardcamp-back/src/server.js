import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connection from './database/database.js';
import categoriesRouter from './routers/categoriesRouter.js';

dotenv.config();
const server = express();
server.use(express.json());
server.use(cors());

server.use(categoriesRouter);

server.get('/status', async (req, res) => {
    const status = await connection.query('SELECT * FROM games;');

    console.log(status.rows);
    res.sendStatus(200);
});

server.listen(process.env.PORT, console.log(`Magic happens on port ${process.env.PORT}`));