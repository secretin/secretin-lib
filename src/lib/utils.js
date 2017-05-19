import PasswordGenerator from './passwordGenerator';

export function hexStringToUint8Array(hexString) {
  if (hexString.length % 2 !== 0) {
    throw 'Invalid hexString';
  }
  const arrayBuffer = new Uint8Array(hexString.length / 2);

  for (let i = 0; i < hexString.length; i += 2) {
    const byteValue = parseInt(hexString.substr(i, 2), 16);
    if (isNaN(byteValue)) {
      throw 'Invalid hexString';
    }
    arrayBuffer[i / 2] = byteValue;
  }

  return arrayBuffer;
}

export function bytesToHexString(givenBytes) {
  if (!givenBytes) {
    return null;
  }

  const bytes = new Uint8Array(givenBytes);
  const hexBytes = [];

  for (let i = 0; i < bytes.length; ++i) {
    let byteString = bytes[i].toString(16);
    if (byteString.length < 2) {
      byteString = `0${byteString}`;
    }
    hexBytes.push(byteString);
  }
  return hexBytes.join('');
}

export function asciiToUint8Array(str) {
  const chars = [];
  for (let i = 0; i < str.length; ++i) {
    chars.push(str.charCodeAt(i));
  }
  return new Uint8Array(chars);
}

export function asciiToHexString(str) {
  return str
    .split('')
    .map(c => `0${c.charCodeAt(0).toString(16)}`.slice(-2))
    .join('');
}

export function hexStringToAscii(hexx) {
  const hex = hexx.toString();
  let str = '';
  for (let i = 0; i < hex.length; i += 2) {
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  return str;
}

export function bytesToASCIIString(bytes) {
  return String.fromCharCode.apply(null, new Uint8Array(bytes));
}

export function generateRandomNumber(max) {
  const randomValues = new Uint8Array(1);
  crypto.getRandomValues(randomValues);
  return randomValues[0] % max;
}

export function generateSeed() {
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);

  let shift = 3;
  let carry = 0;
  let symbol;
  let byte;
  let i;
  let output = '';
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

  for (i = 0; i < buf.length; i++) {
    byte = buf[i];

    symbol = carry | byte >> shift;
    output += alphabet[symbol & 0x1f];

    if (shift > 5) {
      shift -= 5;
      symbol = byte >> shift;
      output += alphabet[symbol & 0x1f];
    }

    shift = 5 - shift;
    carry = byte << shift;
    shift = 8 - shift;
  }

  if (shift !== 3) {
    output += alphabet[carry & 0x1f];
    shift = 3;
    carry = 0;
  }

  return { b32: output, raw: buf };
}

export function localStorageAvailable() {
  try {
    const storage = window.localStorage;
    const x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return false;
  }
}

export function xorSeed(byteArray1, byteArray2) {
  if (
    byteArray1 instanceof Uint8Array &&
    byteArray2 instanceof Uint8Array &&
    byteArray1.length === 32 &&
    byteArray2.length === 32
  ) {
    const buf = new Uint8Array(32);
    let i;
    for (i = 0; i < 32; i++) {
      buf[i] = byteArray1[i] ^ byteArray2[i];
    }
    return bytesToHexString(buf);
  }
  throw 'Utils.xorSeed expect 32 bytes Uint8Arrays';
}

export function escapeRegExp(s) {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

const Utils = {
  generateRandomNumber,
  generateSeed,
  hexStringToUint8Array,
  bytesToHexString,
  asciiToUint8Array,
  bytesToASCIIString,
  xorSeed,
  escapeRegExp,
  PasswordGenerator,
  asciiToHexString,
  hexStringToAscii,
};

export default Utils;
