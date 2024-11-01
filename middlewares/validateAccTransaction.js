const Joi = require("joi");

const validateCreateAccTransaction = (req, res, next) => {
    const schema = Joi.object({
        account_id: Joi.number().integer().required(),
        transaction_type: Joi.string().valid('deposit', 'withdrawal').required(),
        amount: Joi.number().precision(2).positive().required(),
        name: Joi.string().max(100).optional()
    })

    const validation = schema.validate(req.body, { abortEarly: false }); // Validate request body

    if (validation.error) {
        const errors = validation.error.details.map((error) => error.message);
        res.status(400).json({ message: "Validation error", errors });
        return; // Terminate middleware execution on validation error
    }

    next(); // If validation passes, proceed to the next route handler
};

module.exports = {
    validateCreateAccTransaction
};