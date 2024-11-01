const Joi = require("joi");

const validateCreateUser = async (req, res, next) => {
    const schema = Joi.object({
        username: Joi.string().min(1).max(50).required(),
        password_hash: Joi.string()
            .min(6)
            .max(50)
            .pattern(new RegExp('^(?=.*[a-zA-Z])(?=.*[0-9])[a-zA-Z0-9]+$'))
            .required()
            .messages({
                'string.pattern.base': 'Password must contain at least one letter and one number, and no spaces or special characters.'
            }),
        email: Joi.string().email().max(120).required(),
        phone_number: Joi.string().min(1).max(10).required()
    });

    const validation = schema.validate(req.body, { abortEarly: false });

    if (validation.error) {
        const errors = validation.error.details.map((error) => error.message);
        res.status(400).json({ message: "Validation error", errors });
        return;
    }

    next();
};

const validateUpdateUser = (req, res, next) => {
    const schema = Joi.object({
        username: Joi.string().min(1).max(50).optional(),
        email: Joi.string().email().max(120).optional(),
        phone_number: Joi.string().min(1).max(10).optional(),
        password_hash: Joi.string()
            .min(6)
            .max(50)
            .pattern(new RegExp('^(?=.*[a-zA-Z])(?=.*[0-9])'))
            .optional()
            .messages({
                'string.pattern.base': 'Password must contain at least one letter and one number.'
            })
    }).or('username', 'email', 'phone_number', 'password_hash');

    const validation = schema.validate(req.body, { abortEarly: false }); // Validate request body

    if (validation.error) {
        const errors = validation.error.details.map((error) => error.message);
        res.status(400).json({ message: "Validation error", errors });
        return; // Terminate middleware execution on validation error
    }

    next(); // If validation passes, proceed to the next route handler
};

const validateLoginUser = async (req, res, next) => {
    const schema = Joi.object({
        username: Joi.string().required(),
        password_hash: Joi.string().required()
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
    validateCreateUser,
    validateUpdateUser,
    validateLoginUser
};