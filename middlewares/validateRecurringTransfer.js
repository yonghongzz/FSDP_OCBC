const Joi = require("joi");

const validateCreateRecurringTransfer = (req, res, next) => {
    const schema = Joi.object({
        account_id: Joi.number().integer().required(),
        recipient_id: Joi.number().integer().required(),
        amount: Joi.number().precision(2).positive().required(),
        frequency: Joi.string().valid("daily", "weekly", "bi-weekly", "monthly").required(),
        start_date: Joi.date().iso().required(),
        end_date: Joi.date().iso().greater(Joi.ref("start_date")).optional(),
        description: Joi.string().max(255).optional(),
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
