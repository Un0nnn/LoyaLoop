// Input validation and sanitization middleware
const { body, validationResult } = require('express-validator');

/**
 * Validates and sanitizes string inputs to prevent XSS attacks
 */
const sanitizeString = (field) => {
    return body(field)
        .trim()
        .escape() // Escapes HTML characters
        .stripLow(); // Removes ASCII control characters
};

/**
 * Validates email format
 */
const validateEmail = (field) => {
    return body(field)
        .isEmail()
        .normalizeEmail()
        .withMessage('Invalid email format');
};

/**
 * Validates integer inputs
 */
const validateInteger = (field) => {
    return body(field)
        .isInt()
        .toInt()
        .withMessage('Must be an integer');
};

/**
 * Validates positive number inputs
 */
const validatePositiveNumber = (field) => {
    return body(field)
        .isFloat({ gt: 0 })
        .toFloat()
        .withMessage('Must be a positive number');
};

/**
 * Middleware to check validation results
 */
const checkValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            error: 'Validation failed',
            details: errors.array() 
        });
    }
    next();
};

module.exports = {
    sanitizeString,
    validateEmail,
    validateInteger,
    validatePositiveNumber,
    checkValidation
};

