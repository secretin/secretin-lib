describe('Utils', () => {
  describe('Randomness', () => {
    it('Utils.PasswordGenerator.generateRandomNumber is working', () => {
      Secretin.Utils.PasswordGenerator.generateRandomNumber(10).should.equal(7);
    });

    it('Utils.generateSeed is working', () => {
      const expectedSeed = {
        b32: 'HE4TSOJZHE4TSOJZHE4TSOJZHE4TSOJZHE4TSOJZHE4TSOJZHE4Q',
        raw: new Uint8Array(32).fill(57),
      };
      Secretin.Utils.generateSeed().should.deep.equal(expectedSeed);
    });
  });

  describe('Conversion', () => {
    it('Utils.hexStringToUint8Array is working', () => {
      const hexString = '616263646566';
      const expectedArray = new Uint8Array([
        0x61, 0x62, 0x63, 0x64, 0x65, 0x66,
      ]);
      Secretin.Utils.hexStringToUint8Array(hexString).should.deep.equal(
        expectedArray
      );
    });

    it('Utils.bytesToHexString is working', () => {
      const expectedhexString = '616263646566';
      const array = new Uint8Array([0x61, 0x62, 0x63, 0x64, 0x65, 0x66]);
      Secretin.Utils.bytesToHexString(array).should.deep.equal(
        expectedhexString
      );
    });

    it('Utils.asciiToUint8Array is working', () => {
      const string = 'abcdef';
      const expectedArray = new Uint8Array([
        0x61, 0x62, 0x63, 0x64, 0x65, 0x66,
      ]);
      Secretin.Utils.asciiToUint8Array(string).should.deep.equal(expectedArray);
    });

    it('Utils.bytesToASCIIString is working', () => {
      const expectedString = 'abcdef';
      const array = new Uint8Array([0x61, 0x62, 0x63, 0x64, 0x65, 0x66]);
      Secretin.Utils.bytesToASCIIString(array).should.deep.equal(
        expectedString
      );
    });

    it('Utils.stringToUint8Array encodes UTF-8', () => {
      const string = 'a•🐢é';
      const expectedArray = new Uint8Array([
        0x61, 0xe2, 0x80, 0xa2, 0xf0, 0x9f, 0x90, 0xa2, 0xc3, 0xa9,
      ]);
      Secretin.Utils.stringToUint8Array(string).should.deep.equal(
        expectedArray
      );
    });

    it('Utils.bytesToString decodes UTF-8', () => {
      const array = new Uint8Array([
        0x61, 0xe2, 0x80, 0xa2, 0xf0, 0x9f, 0x90, 0xa2, 0xc3, 0xa9,
      ]);
      Secretin.Utils.bytesToString(array).should.equal('a•🐢é');
    });

    it('Utils.bytesToString falls back to legacy one byte per char', () => {
      // 'café' as encoded by asciiToUint8Array before UTF-8 support
      const array = new Uint8Array([0x63, 0x61, 0x66, 0xe9]);
      Secretin.Utils.bytesToString(array).should.equal('café');
    });

    it('Utils.xorSeed expect Uint8Arrays', () => {
      const array1 = new Uint16Array(32).fill(0x61);
      const array2 = new Uint16Array(32).fill(0x71);
      try {
        Secretin.Utils.xorSeed(array1, array2);
      } catch (err) {
        err.should.be.instanceOf(Secretin.Errors.XorSeedError);
      }
    });

    it('Utils.xorSeed expect 32 bytes Uint8Arrays', () => {
      const array1 = new Uint8Array(100).fill(0x61);
      const array2 = new Uint8Array(32).fill(0x71);
      try {
        Secretin.Utils.xorSeed(array1, array2);
      } catch (err) {
        err.should.be.instanceOf(Secretin.Errors.XorSeedError);
      }
    });

    it('Utils.xorSeed is working', () => {
      const array1 = new Uint8Array(32).fill(0x61);
      const array2 = new Uint8Array(32).fill(0x71);
      const expectedString =
        '1010101010101010101010101010101010101010101010101010101010101010';
      Secretin.Utils.xorSeed(array1, array2).should.deep.equal(expectedString);
    });
  });
});
