import express from 'express';
import { showCategories, createCategory } from '../controllers/categoriesController.js';

const router = express.Router();

router.get('/categories', showCategories);
router.post('/categories', createCategory);

export default router;