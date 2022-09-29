import express from 'express';
import pkg from 'pg';

const { Pool } = pkg;

const connection = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '03022001',
    database: 'boardcamp'
});

const server = express();

server.get('/games', async (req, res) => {
    const games = await connection.query('SELECT * FROM games;');

    console.log(games);
    res.send(games.rows);
});

server.get('/', (req, res) => {
    res.send('OK');
});

server.listen(4000, () => console.log('Magic happens on port 4000'));