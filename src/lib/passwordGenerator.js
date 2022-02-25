import { escapeRegExp, generateRandomNumber } from './utils';

const symbols = '!@#$%^&*()+_=}{[]|:;"?.><,`~';
const vowels = 'aeiouy';
const consonants = 'bcdfghjklmnpqrstvwxz';
const numbers = '0123456789';

const similarChars = '[ilLI|`oO0';

export const hasNumber = (str) => str.match(/\d+/g) != null;
export const hasMixedCase = (str) =>
  str.toUpperCase() !== str && str.toLowerCase() !== str;
export const hasSymbol = (str) => {
  const regexString = `[${escapeRegExp(symbols)}]`;
  const symbolRegex = new RegExp(regexString);
  return str.match(symbolRegex) != null;
};

export const checkStrictRules = (str, rules) =>
  rules.numbers === hasNumber(str) &&
  rules.mixedCase === hasMixedCase(str) &&
  rules.symbols === hasSymbol(str);

export const buildCharset = (options) => {
  const charset = [];

  const letters = vowels + consonants;

  charset.push(...[...letters]);

  if (options.contentRules.mixedCase) {
    charset.push(...[...letters.toUpperCase()]);
  }
  if (options.contentRules.numbers) {
    charset.push(...[...numbers]);
  }
  if (options.contentRules.symbols) {
    charset.push(...[...symbols]);
  }

  if (options.contentRules.similarChars === false) {
    charset.filter((character) => similarChars.indexOf(character) >= 0);
  }

  return charset;
};

export const getRandomPassword = (options) => {
  let password = '';

  if (options.readable) {
    let lastCharWasVocal = false; // TODO : rand

    for (let i = 0; i < options.length; i += 1) {
      const charset = lastCharWasVocal ? consonants : vowels;
      lastCharWasVocal = !lastCharWasVocal;
      const randomIndex = generateRandomNumber(charset.length);
      password += charset[randomIndex];
    }
  } else {
    const charset = buildCharset(options);

    for (let i = 0; i < options.length; i += 1) {
      const randomIndex = generateRandomNumber(charset.length);
      password += charset[randomIndex];
    }
  }

  return password;
};

export const generatePassword = (customOptions) => {
  const defaults = {
    length: 20,
    readable: false,
    allowSimilarChars: false,
    strictRules: true,
    contentRules: {
      numbers: true,
      mixedCase: true,
      symbols: true,
    },
  };

  const options = { ...defaults, ...customOptions };
  const { contentRules } = options;

  const password = getRandomPassword(options);

  if (options.strictRules) {
    return checkStrictRules(password, contentRules)
      ? password
      : generatePassword(customOptions);
  }

  return password;
};

const PasswordGenerator = {
  hasNumber,
  hasMixedCase,
  hasSymbol,
  checkStrictRules,
  buildCharset,
  getRandomPassword,
  generatePassword,
};

export default PasswordGenerator;
