export const PASSWORD_POLICY_HELP =
  "La contrasena debe tener al menos 8 caracteres, una mayuscula y un numero.";

export function getPasswordPolicyError(password) {
  if (password.length < 8) {
    return PASSWORD_POLICY_HELP;
  }

  if (!/[A-Z]/.test(password)) {
    return "La contrasena debe incluir al menos una letra mayuscula.";
  }

  if (!/\d/.test(password)) {
    return "La contrasena debe incluir al menos un numero.";
  }

  return null;
}
