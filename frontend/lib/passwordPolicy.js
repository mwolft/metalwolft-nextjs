export const PASSWORD_POLICY_HELP =
  "La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.";

export function getPasswordPolicyError(password) {
  if (password.length < 8) {
    return PASSWORD_POLICY_HELP;
  }

  if (!/[A-Z]/.test(password)) {
    return "La contraseña debe incluir al menos una letra mayúscula.";
  }

  if (!/\d/.test(password)) {
    return "La contraseña debe incluir al menos un número.";
  }

  return null;
}
