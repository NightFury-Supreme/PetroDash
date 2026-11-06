const { z } = require('zod');

const panelInfoResponseSchema = z.object({
  email: z.string().email(),
  username: z.string().min(1),
  panelUrl: z.string().url(),
  loginUrl: z.string().url(),
});

const resetPasswordResponseSchema = z.object({
  password: z.string().min(8),
  ok: z.literal(true),
  code: z.literal('PASSWORD_RESET_SUCCESS'),
});

module.exports = {
  panelInfoResponseSchema,
  resetPasswordResponseSchema,
};
