describe('Password generation', () => {
  const pw = Secretin.Utils.PasswordGenerator;

  describe('hasNumber', () => {
    it('Should return true if string has number in it', () => {
      pw.hasNumber('aa1aa').should.equal(true);
    });
    it('Should return false if string has no number in it', () => {
      pw.hasNumber('aaaaa').should.equal(false);
    });
  });

  describe('hasMixedCase', () => {
    it('Should return true if string has at least one upper and lower case', () => {
      pw.hasMixedCase('aaAaa').should.equal(true);
    });
    it('Should return false if the case is the same in the whole string', () => {
      pw.hasMixedCase('aaaaa').should.equal(false);
    });
  });

  describe('hasSymbol', () => {
    it('Should return true if string has at least one symbol', () => {
      const symbolsToMatch = [...'!@#$%^&*()+_=}{[]|:;"?.><,`~'];
      for (const symbol of symbolsToMatch) {
        pw.hasSymbol(symbol).should.equal(true);
      }
    });
    it('Should return false if string has no symbol', () => {
      pw.hasSymbol('aaaaa').should.equal(false);
    });
  });

  describe('checkStrictRules', () => {
    it('Should return true if string matches all rules', () => {
      const rules = {
        numbers: true,
        mixedCase: true,
        symbols: true,
      };
      pw.checkStrictRules('aA1$', rules).should.equal(true);
    });

    it('Should return true if string matches mixedCase and symbol', () => {
      const rules = {
        numbers: false,
        mixedCase: true,
        symbols: true,
      };
      pw.checkStrictRules('aAa$', rules).should.equal(true);
    });

    it('Should return true if string matches numbers and symbols', () => {
      const rules = {
        numbers: true,
        mixedCase: false,
        symbols: true,
      };
      pw.checkStrictRules('aa1$', rules).should.equal(true);
    });

    it('Should return true if string matches numbers and mixedCase', () => {
      const rules = {
        numbers: true,
        mixedCase: true,
        symbols: false,
      };
      pw.checkStrictRules('aA1a', rules).should.equal(true);
    });

    it('Should return true if string matches numbers', () => {
      const rules = {
        numbers: true,
        mixedCase: false,
        symbols: false,
      };
      pw.checkStrictRules('aa1a', rules).should.equal(true);
    });

    it('Should return true if string matches mixedCase', () => {
      const rules = {
        numbers: false,
        mixedCase: true,
        symbols: false,
      };
      pw.checkStrictRules('aAaa', rules).should.equal(true);
    });

    it('Should return true if string matches symbols', () => {
      const rules = {
        numbers: false,
        mixedCase: false,
        symbols: true,
      };
      pw.checkStrictRules('a$aa', rules).should.equal(true);
    });

    it('Should return true whatever the string is (no activated rule)', () => {
      const rules = {
        numbers: false,
        mixedCase: false,
        symbols: false,
      };
      pw.checkStrictRules('aaaa', rules).should.equal(true);
    });

    it('Should return false if a rule does not match', () => {
      const rules = {
        numbers: true,
        mixedCase: false,
        symbols: false,
      };
      pw.checkStrictRules('aaaa', rules).should.equal(false);
    });

    it("Should return false if multiple rules don't match", () => {
      const rules = {
        numbers: true,
        mixedCase: true,
        symbols: true,
      };
      pw.checkStrictRules('aaaa', rules).should.equal(false);
    });
  });

  describe('buildCharset', () => {
    it('Should build lowercase-letters-only charset when all rules are set to false', () => {
      const options = {
        allowSimilarChars: true,
        contentRules: {
          numbers: false,
          mixedCase: false,
          symbols: false,
        },
      };
      const expectedCharset = [...'abcdefghijklmnopqrstuvwxyz'];
      const actualCharset = pw.buildCharset(options);
      for (const char of expectedCharset) {
        (actualCharset.indexOf(char) >= 0).should.equal(true);
      }
    });

    it('Should build mixedcase charset when mixedCase rule is set to true', () => {
      const options = {
        allowSimilarChars: true,
        contentRules: {
          numbers: false,
          mixedCase: true,
          symbols: false,
        },
      };
      const expectedCharset = [
        ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
      ];
      const actualCharset = pw.buildCharset(options);
      for (const char of expectedCharset) {
        (actualCharset.indexOf(char) >= 0).should.equal(true);
      }
    });

    // eslint-disable-next-line
    it('Should build mixedcase+symbols charset when mixedCase & symbols rules are set to true', () => {
      const options = {
        allowSimilarChars: true,
        contentRules: {
          numbers: false,
          mixedCase: true,
          symbols: true,
        },
      };
      // eslint-disable-next-line
      const expectedCharset = [
        ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()+_=}{[]|:;"?.><,`~',
      ];
      const actualCharset = pw.buildCharset(options);
      for (const char of expectedCharset) {
        (actualCharset.indexOf(char) >= 0).should.equal(true);
      }
    });

    it('Should build mixedcase+symbols+numbers charset when all rules are set to true', () => {
      const options = {
        allowSimilarChars: true,
        contentRules: {
          numbers: true,
          mixedCase: true,
          symbols: true,
        },
      };
      // eslint-disable-next-line
      const expectedCharset = [
        ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()+_=}{[]|:;"?.><,`~0123456789',
      ];
      const actualCharset = pw.buildCharset(options);
      for (const char of expectedCharset) {
        (actualCharset.indexOf(char) >= 0).should.equal(true);
      }
    });

    it('Should skip similar characters if allowSimilarChars option is set to false', () => {
      const options = {
        allowSimilarChars: false,
        contentRules: {
          numbers: true,
          mixedCase: true,
          symbols: true,
        },
      };
      // eslint-disable-next-line
      const expectedCharset = [
        ...'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ!@#$%^&*()+_=}{:;"?.><,~123456789',
      ];
      const actualCharset = pw.buildCharset(options);
      for (const char of expectedCharset) {
        (actualCharset.indexOf(char) >= 0).should.equal(true);
      }
    });

    it('Should generate a password with the proper length', () => {
      const options = {
        allowSimilarChars: true,
        contentRules: {
          numbers: true,
          mixedCase: true,
          symbols: true,
        },
        length: 10,
      };
      const password = pw.getRandomPassword(options);
      password.length.should.equal(10);
    });
  });
});
