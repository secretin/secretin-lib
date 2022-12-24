const owaspConfigs = {
  allowPassphrases: true,
  maxLength: 128,
  minLength: 10,
  minPhraseLength: 20,
  minOptionalTestsToPass: 4,
};
const tests = [
  function enforceMinimumLength(password) {
    if (password.length < owaspConfigs.minLength) {
      throw new Error(
        `The password must be at least ${owaspConfigs.minLength} characters long.`
      );
    }
  },

  function enforceMaximumLength(password) {
    if (password.length > owaspConfigs.maxLength) {
      throw new Error(
        `The password must be fewer than ${owaspConfigs.maxLength} characters.`
      );
    }
  },

  function forbidRepeatingCharacters(password) {
    if (/(.)\1{2,}/.test(password)) {
      throw new Error(
        'The password may not contain sequences of three or more repeated characters.'
      );
    }
  },

  function requireAtLeastOneLowercaseLetter(password) {
    if (!/[a-z]/.test(password)) {
      throw new Error(
        'The password must contain at least one lowercase letter.'
      );
    }
  },

  function requireAtLeastOneUppercaseLetter(password) {
    if (!/[A-Z]/.test(password)) {
      throw new Error(
        'The password must contain at least one uppercase letter.'
      );
    }
  },

  function requireAtLeastOneNumber(password) {
    if (!/[0-9]/.test(password)) {
      throw new Error('The password must contain at least one number.');
    }
  },

  function requireAtLeastOneSpecialCharacter(password) {
    if (!/[^A-Za-z0-9]/.test(password)) {
      throw new Error(
        'The password must contain at least one special character.'
      );
    }
  },
];

export function assertPasswordComplexity(password) {
  tests.forEach((testStrength) => {
    testStrength(password);
  });
}

const OWASP = {
  assertPasswordComplexity,
};

export default OWASP;
