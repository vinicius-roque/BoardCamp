import express from 'express';
import { createRent, showRents, deleteRent, finalizeRent } from '../controllers/rentalsController.js';

const router = express.Router();

router.post('/rentals', createRent);
router.get('/rentals', showRents);
router.delete('/rentals/:id', deleteRent);
router.post('rentals/:id/return', finalizeRent);

export default router;