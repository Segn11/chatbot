import { body, validationResult } from "express-validator";

export const validate = (validations) => {
  return async (req, res, next) => {
    for (let validation of validations) {
      const result = await validation.run(req);
      if (!result.isEmpty()) {
        break;
      }
    }
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    return res.status(422).json({ errors: errors.array() });
  };
};

export const loginValidator = [
  body("email")
    .isString()
    .withMessage("Email must be a valid string")
    .trim()
    .isEmail()
    .withMessage("A valid email address is required")
    .normalizeEmail(),
  body("password")
    .isString()
    .withMessage("Password must be a string")
    .trim()
    .isLength({ min: 6, max: 128 })
    .withMessage("Password must be between 6 and 128 characters"),
];

export const signupValidator = [
  body("name")
    .isString()
    .withMessage("Name must be a string")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 80 })
    .withMessage("Name cannot exceed 80 characters"),
  ...loginValidator,
];

export const chatCompletionValidator = [
  body("message")
    .isString()
    .withMessage("Message must be text")
    .trim()
    .notEmpty()
    .withMessage("Message cannot be empty")
    .isLength({ max: 10000 })
    .withMessage("Message cannot exceed 10,000 characters"),
];
