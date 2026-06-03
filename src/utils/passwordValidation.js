// Client-side password rules — identical to the web (Form.jsx / ResetPasswordForm.jsx):
// ≥8 chars, ≥1 uppercase, ≥1 digit, ≥1 special character.
// Returns an array of i18n keys for the failed rules (empty array = valid).
export function validatePassword(password = "") {
  const errors = [];
  if (password.length < 8) errors.push("resetPassword.passwordLengthError");
  if (!/[A-Z]/.test(password)) errors.push("resetPassword.passwordUppercaseError");
  if (!/[0-9]/.test(password)) errors.push("resetPassword.passwordNumberError");
  if (!/[^A-Za-z0-9]/.test(password)) errors.push("resetPassword.passwordSpecialCharError");
  return errors;
}

export function isPasswordValid(password) {
  return validatePassword(password).length === 0;
}
