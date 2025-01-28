const Joi = require("joi");

const validateCreateOverseasTransactionLog = (req, res, next) => {
    const schema = Joi.object({
        transaction_id: Joi.number().integer().required(),  // Foreign key to the transaction ID from the `OverseaTransaction` table
        exchange_rate: Joi.number().precision(6).positive().required(),  // Positive exchange rate with 6 decimal places
        transaction_fee: Joi.number().precision(2).positive().optional(),  // Optional transaction fee
        log_datetime: Joi.date().iso().required(),  // ISO format date-time when the log entry was created
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
    validateCreateOverseasTransactionLog
};
