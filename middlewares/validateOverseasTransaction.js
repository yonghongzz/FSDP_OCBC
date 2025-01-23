const Joi = require("joi");

const validateCreateOverseasTransaction = (req, res, next) => {
    const schema = Joi.object({
        payee_id: Joi.number().integer().required(),  // Payee ID is required and should be an integer
        account_id: Joi.number().integer().required(),  // Account ID is required and should be an integer
        transaction_type: Joi.string().valid('send', 'receive').required(),  // Corrected to only accept 'send' or 'receive'
        amount: Joi.number().precision(2).positive().required(),  // Positive amount with 2 decimal precision
        currency: Joi.string().length(3).uppercase().required(),  // Currency code (3 uppercase letters, e.g., USD, EUR)
        converted_amount: Joi.number().precision(2).positive().required(),  // Converted amount after currency conversion
        transaction_fee: Joi.number().precision(2).positive().optional(),  // Optional transaction fee (positive value)
        transaction_date: Joi.date().iso().required(),  // Transaction date (ISO format)
        tags: Joi.string().max(255).optional(),  // Optional tags for categorizing the transaction
    });

    const validation = schema.validate(req.body, { abortEarly: false }); // Validate request body

    if (validation.error) {
        const errors = validation.error.details.map((error) => error.message);
        res.status(400).json({ message: "Validation error", errors });
        return; // Terminate middleware execution on validation error
    }

    next(); // If validation passes, proceed to the next route handler
};

module.exports = {
    validateCreateOverseasTransaction
};
