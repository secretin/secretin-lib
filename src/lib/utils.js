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

export function bytesToASCIIString(bytes) {
  return String.fromCharCode.apply(null, new Uint8Array(bytes));
}

export function generateRandomNumber(max) {
  const randomValues = new Uint8Array(1);
  crypto.getRandomValues(randomValues);
  return (randomValues[0] % max);
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

    symbol = carry | (byte >> shift);
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
  if (byteArray1.length === byteArray2.length && byteArray1.length === 32) {
    const buf = new Uint8Array(32);
    let i;
    for (i = 0; i < 32; i++) {
      buf[i] = byteArray1[i] ^ byteArray2[i];
    }
    return buf;
  }
  throw 'xorSeed wait for 32 bytes arrays';
}

const Utils = {
  generateRandomNumber,
  generateSeed,
};

export default Utils;
