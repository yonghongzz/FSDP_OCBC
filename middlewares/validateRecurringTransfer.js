const Joi = require("joi");

const validateCreateRecurringTransfer = (req, res, next) => {
    const schema = Joi.object({
        user_id: Joi.number().integer().required(),
        payee_id: Joi.number().integer().required(),
        account_id: Joi.number().integer().required(),
        amount: Joi.number().precision(2).positive().required(),
        currency: Joi.string().max(10).required(),
        frequency: Joi.string().valid("daily", "weekly", "monthly", "yearly").required(),
        next_transfer_date: Joi.date().iso().required(),
        end_date: Joi.date().iso().greater(Joi.ref("next_transfer_date")).optional(),
        status: Joi.string().valid("active", "paused", "canceled").default("active")
    });

    const validation = schema.validate(req.body, { abortEarly: false });

    if (validation.error) {
        const errors = validation.error.details.map((error) => error.message);
        res.status(400).json({ message: "Validation error", errors });
        return;
    }

    next();
};



const validateUpdateRecurringTransfer = (req, res, next) => {
    const schema = Joi.object({
        account_id: Joi.number().integer().optional(),
        recipient_id: Joi.number().integer().optional(),
        amount: Joi.number().precision(2).positive().optional(),
        frequency: Joi.string().valid("daily", "weekly", "bi-weekly", "monthly").optional(),
        start_date: Joi.date().iso().optional(),
        end_date: Joi.date().iso().greater(Joi.ref("start_date")).optional(),
        description: Joi.string().max(255).optional(),
        status: Joi.string().valid("active", "paused", "canceled").required()  // Add this line for 'status' validation
    });

    const validation = schema.validate(req.body, { abortEarly: false });

    if (validation.error) {
        const errors = validation.error.details.map((error) => error.message);
        res.status(400).json({ message: "Validation error", errors });
        return;
    }

    next();
};

module.exports = {
    validateCreateRecurringTransfer,
    validateUpdateRecurringTransfer,
};
