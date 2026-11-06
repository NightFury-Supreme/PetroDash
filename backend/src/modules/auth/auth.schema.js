const { z } = require('zod');

const strongPassword = z.string().min(8).regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).+$/);

const loginSchema = z.object({
  emailOrUsername: z.string().trim().min(1),
  password: z.string().min(1),
});

const login2faSchema = z.object({
  tempToken: z.string().min(1),
  code: z.string().min(6).max(8),
});

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  password: strongPassword,
  ref: z.string().trim().max(32).optional(),
});

const forgotSchema = z.object({
  email: z.string().email(),
});

const resetSchema = z.object({
  email: z.string().email(),
  code: z.string().length(8),
  newPassword: z.string().min(12).max(200),
});

const verifyCodeSchema = z.object({
  email: z.string().email().optional(),
  code: z.string().trim().length(8),
});

module.exports = {
  loginSchema,
  login2faSchema,
  registerSchema,
  forgotSchema,
  resetSchema,
  verifyCodeSchema,
};
