const Joi = require("joi");

const validateCreateOverseasPayee = (req, res, next) => {
    const schema = Joi.object({
        user_id: Joi.number().integer().required(),               // Ensure user_id is an integer and required
        payee_name: Joi.string().max(100).required(),              // Validate payee_name is a string with max length of 100 and required
        bank_name: Joi.string().max(100).required(),               // Validate bank_name is a string with max length of 100 and required
        country: Joi.string().max(50).required(),                  // Validate country is a string with max length of 50 and required
        account_number: Joi.string().max(20).required(),           // Validate account_number is a string with max length of 20 and required
        currency: Joi.string().max(10).required(),                 // Validate currency is a string with max length of 10 and required
        is_pinned: Joi.boolean().optional().default(false)         // Validate is_pinned is boolean, optional with default to false (0)
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
    validateCreateOverseasPayee
};
