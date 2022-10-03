import joi from 'joi';
import connection from '../database/database.js';

const customersSchema = joi.object({
    name: joi.string().min(1).required(),
    phone: joi.string().regex(/^\d+$/).max(11).min(10).required(),
    cpf: joi.string().length(11).regex(/^\d+$/).required(),
    birthday: joi.date().required()
});

async function showCustomers(req, res) {
    const { cpf } = req.body;

    if(cpf === undefined) {
        try {
            const customers = await connection.query('SELECT * FROM customers;');

            return res.status(200).send(customers.rows);
        } catch (error) {
            return res.status(500).send(error);
        }
    }
    const consultedCustomers = await connection.query('SELECT * FROM customers WHERE cpf LIKE $1;', [`${cpf}%`]);

    res.status(200).send(consultedCustomers.rows);
}

async function showCustomer(req, res) {
    const { id } = req.params;

    const customer = await connection.query('SELECT * FROM customers WHERE id = $1;', [id]);

    if(!customer.rows.length) {
        return res.sendStatus(404);
    }

    res.status(200).send(customer.rows[0]);
}

async function createCustomer(req, res) {
    const validation = customersSchema.validate(req.body);
    if(validation.error) {
        const errors = validation.error.details.map(detail => detail.message);
        return res.status(400).send(errors);
    }

    const { cpf } = req.body;

    try {
        const existingCustomer = await connection.query('SELECT * FROM customers WHERE cpf = $1;', [cpf]);

        if(existingCustomer.rows.length) {
            return res.status(409).send('This CPF is already in use');
        }

        const { name, phone, birthday } = req.body;

        connection.query('INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4);', [name, phone, cpf, birthday]);

        return res.sendStatus(201);
    } catch (error) {
        return res.status(500).send(error);
    }
}

async function updateCustomer(req, res) {
    const validation = customersSchema.validate(req.body);

    if(validation.error) {
        const errors = validation.error.details.map(detail => detail.message);

        return res.status(400).send(errors);
    }

    const id = parseInt(req.params.id);

    try {
        const existingCustomer = await connection.query('SELECT * FROM customers WHERE id = $1;', [id]);

        if(!existingCustomer.rows.length) {
            return res.status(404).send('Customer not found');
        }

        const { cpf } = req.body;

        const cpfAlreadyRegistered = await connection.query('SELECT * FROM customers WHERE cpf = $1;' [cpf]);

        if(cpfAlreadyRegistered.rows.length && existingCustomer.rows[0].cpf !== cpf) {
            return res.status(409).send('There CPF is already registered');
        }

        const { name, phone, birthday } = req.body;

        connection.query('UPDATE customers SET name = $1, phone = $2, cpf = $3, birthday = $4 WHERE id = $5;', [name, phone, cpf, birthday, id]);

        res.sendStatus(202);
    } catch (error) {
        res.status(500).send(error);
    }
}

export { showCustomers, showCustomer, createCustomer, updateCustomer };