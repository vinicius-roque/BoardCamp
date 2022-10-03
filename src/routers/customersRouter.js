import express from 'express';
import { showCustomers, showCustomer, createCustomer, updateCustomer } from '../controllers/customersController.js';

const router = express.Router();

router.get('/customers', showCustomers);
router.get('/customers/:id', showCustomer);
router.post('/customers', createCustomer);
router.put('/customers/:id', updateCustomer);

export default router;