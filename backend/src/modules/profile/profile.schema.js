const { z } = require('zod');

const updateProfileSchema = z.object({
  username: z.string().min(3, 'ERR_USERNAME_MIN').max(30, 'ERR_USERNAME_MAX')
    .regex(/^[a-zA-Z0-9_-]+$/, 'ERR_USERNAME_FORMAT').optional(),
  firstName: z.string().min(1, 'ERR_FIRSTNAME_MIN').max(50, 'ERR_FIRSTNAME_MAX').optional(),
  lastName: z.string().min(1, 'ERR_LASTNAME_MIN').max(50, 'ERR_LASTNAME_MAX').optional()
});

const initiateEmailChangeSchema = z.object({
  email: z.string({ required_error: 'ERR_EMAIL_REQUIRED' }).email('ERR_INVALID_EMAIL')
});

const verifyEmailChangeSchema = z.object({
  email: z.string({ required_error: 'ERR_EMAIL_REQUIRED' }).email('ERR_INVALID_EMAIL'),
  code: z.string({ required_error: 'ERR_CODE_REQUIRED' }).length(8, 'ERR_CODE_LENGTH')
});

const updatePasswordSchema = z.object({
  currentPassword: z.string({ required_error: 'ERR_CUR_PASS_REQUIRED' }).min(6, 'ERR_CUR_PASS_MIN'),
  newPassword: z.string({ required_error: 'ERR_NEW_PASS_REQUIRED' })
    .min(8, 'ERR_NEW_PASS_MIN')
    .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, 'ERR_NEW_PASS_FORMAT'),
  tfaCode: z.string().min(6, 'ERR_TFA_MIN').max(8, 'ERR_TFA_MAX').optional()
});

const verifyTfaSchema = z.object({
  code: z.string({ required_error: 'ERR_CODE_REQUIRED' }).min(6, 'ERR_TFA_MIN').max(8, 'ERR_TFA_MAX'),
  secret: z.string({ required_error: 'ERR_SECRET_REQUIRED' })
});

const disableTfaSchema = z.object({
  code: z.string({ required_error: 'ERR_CODE_REQUIRED' }).min(6, 'ERR_TFA_MIN').max(8, 'ERR_TFA_MAX'),
  password: z.string({ required_error: 'ERR_PASS_REQUIRED' })
});

const deleteAccountSchema = z.object({
  password: z.string({ required_error: 'ERR_PASS_REQUIRED' }),
  tfaCode: z.string().min(6, 'ERR_TFA_MIN').max(8, 'ERR_TFA_MAX').optional()
});

module.exports = {
  updateProfileSchema,
  initiateEmailChangeSchema,
  verifyEmailChangeSchema,
  updatePasswordSchema,
  verifyTfaSchema,
  disableTfaSchema,
  deleteAccountSchema
};
