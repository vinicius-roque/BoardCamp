import express from 'express'; 
import { showGames, createGame } from '../controllers/gamesController.js';

const router = express.Router();

router.get('/games', showGames);
router.post('/games', createGame);

export default router;