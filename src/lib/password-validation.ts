export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 20

export const SPECIAL_CHARACTERS = `!@#$%^&*(),.?":{}|<>`

export interface PasswordRule {
  id: string
  label: string
  test: (password: string) => boolean
}

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "length",
    label: `${PASSWORD_MIN}-${PASSWORD_MAX} characters`,
    test: (p) => p.length >= PASSWORD_MIN && p.length <= PASSWORD_MAX,
  },
  {
    id: "firstUpper",
    label: "Starts with an uppercase letter (A-Z)",
    test: (p) => /^[A-Z]/.test(p),
  },
  {
    id: "lower",
    label: "Contains a lowercase letter (a-z)",
    test: (p) => /[a-z]/.test(p),
  },
  {
    id: "number",
    label: "Contains a number (0-9)",
    test: (p) => /[0-9]/.test(p),
  },
  {
    id: "special",
    label: "Contains a special character (!@#$%^&* etc.)",
    test: (p) => new RegExp(`[${SPECIAL_CHARACTERS.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}]`).test(p),
  },
]

export function validatePassword(password: string): { valid: boolean; message: string } {
  for (const rule of PASSWORD_RULES) {
    if (!rule.test(password)) {
      return { valid: false, message: rule.label }
    }
  }
  return { valid: true, message: "Password meets all requirements" }
}

export function getPasswordErrors(password: string): PasswordRule[] {
  return PASSWORD_RULES.filter((rule) => !rule.test(password))
}