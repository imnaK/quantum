export const PASSWORD_ERRORS = {
  WRONG_PASSWORD: "Wrong password",
  PASSWORD_INSECURE: {
    prefix: "Password must ",
    tests: {
      1: {
        test: (password) => password.length <= 8,
        message: "be at least 8 characters long",
      },
      2: {
        test: (password) => password.length > 64,
        message: "be less than 64 characters long",
      },
      3: {
        test: (password) => !/\d/.test(password),
        message: "contain at least one number",
      },
      4: {
        test: (password) => /[A-Z]/.test(password) && /[a-z]/.test(password),
        message: "contain at least one uppercase and one lowercase letter",
      },
      5: {
        test: (password) =>
          !/[!@#$%§&*()_+\-=\[\]{};'´`:"\\|,.<>\/?~° ]+/.test(password),
        message: "contain at least one special character",
      },
    },
  },
};