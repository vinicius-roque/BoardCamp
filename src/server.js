import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import categoriesRouter from './routers/categoriesRouter.js';
import gamesRouter from './routers/gamesRouter.js';
import customersRouter from './routers/customersRouter.js';


dotenv.config();
const server = express();
server.use(express.json());
server.use(cors());

server.use(categoriesRouter);
server.use(gamesRouter);
server.use(customersRouter);

server.get('/status', async (req, res) => {
    res.sendStatus(200);
});

server.listen(process.env.PORT, console.log(`Magic happens on port ${process.env.PORT}`));