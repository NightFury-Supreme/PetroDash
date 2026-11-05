const { z } = require('zod');
const { isValidEntityId } = require('../../utils/publicId');

const updateProfileSchema = z.object({
  username: z.string().trim().min(3, 'ERR_USERNAME_MIN').max(30, 'ERR_USERNAME_MAX')
    .regex(/^[a-zA-Z0-9_-]+$/, 'ERR_USERNAME_FORMAT').optional(),
  firstName: z.string().trim().min(1, 'ERR_FIRSTNAME_MIN').max(50, 'ERR_FIRSTNAME_MAX').optional(),
  lastName: z.string().trim().min(1, 'ERR_LASTNAME_MIN').max(50, 'ERR_LASTNAME_MAX').optional()
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
  secret: z.string().optional()
});

const disableTfaSchema = z.object({
  code: z.string({ required_error: 'ERR_CODE_REQUIRED' }).min(6, 'ERR_TFA_MIN').max(8, 'ERR_TFA_MAX'),
  password: z.string().optional()
});

const deleteAccountSchema = z.object({
  password: z.string().optional(),
  tfaCode: z.string().min(6, 'ERR_TFA_MIN').max(8, 'ERR_TFA_MAX').optional()
});

const checkUsernameSchema = z.object({
  username: z.string({ required_error: 'ERR_USERNAME_REQUIRED' })
    .min(3, 'ERR_USERNAME_MIN')
    .max(30, 'ERR_USERNAME_MAX')
    .regex(/^[a-zA-Z0-9_-]+$/, 'ERR_USERNAME_FORMAT')
});

const sessionIdParamSchema = z.object({
  id: z.string().refine((val) => isValidEntityId(val, 'userSession'), { message: 'ERR_INVALID_SESSION_ID' })
});

module.exports = {
  updateProfileSchema,
  initiateEmailChangeSchema,
  verifyEmailChangeSchema,
  updatePasswordSchema,
  verifyTfaSchema,
  disableTfaSchema,
  deleteAccountSchema,
  checkUsernameSchema,
  sessionIdParamSchema
};
