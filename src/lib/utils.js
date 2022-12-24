/* eslint-disable no-bitwise */
import PasswordGenerator from './passwordGenerator';
import { InvalidHexStringError, XorSeedError } from '../Errors';

export function hexStringToUint8Array(hexString) {
  if (hexString.length % 2 !== 0) {
    throw new InvalidHexStringError();
  }
  const arrayBuffer = new Uint8Array(hexString.length / 2);

  for (let i = 0; i < hexString.length; i += 2) {
    const byteValue = parseInt(hexString.substr(i, 2), 16);
    if (Number.isNaN(byteValue)) {
      throw new InvalidHexStringError();
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

  for (let i = 0; i < bytes.length; i += 1) {
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
  for (let i = 0; i < str.length; i += 1) {
    chars.push(str.charCodeAt(i));
  }
  return new Uint8Array(chars);
}

export function asciiToHexString(str) {
  return str
    .split('')
    .map((c) => `0${c.charCodeAt(0).toString(16)}`.slice(-2))
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
  // String.fromCharCode.apply(null, new Uint8Array(bytes)) trigger Maximum call stack size exceeded
  const array = new Uint8Array(bytes);
  return array.reduce(
    (str, charIndex) => str + String.fromCharCode(charIndex),
    ''
  );
}

export function generateRescueCodes() {
  const RESCUE_CODE_LENGTH = 8;
  const RESCUE_CODE_COUNT = 5;
  const rescueCodes = [];
  const buf = new Uint8Array((RESCUE_CODE_LENGTH / 2) * RESCUE_CODE_COUNT);
  crypto.getRandomValues(buf);
  const rescueCodeSource = bytesToHexString(buf);
  for (let i = 0; i < RESCUE_CODE_COUNT; i += 1) {
    const rescueCode = rescueCodeSource.slice(
      i * RESCUE_CODE_LENGTH,
      (i + 1) * RESCUE_CODE_LENGTH
    );
    rescueCodes.push(rescueCode);
  }
  return rescueCodes;
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

  for (i = 0; i < buf.length; i += 1) {
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
  if (
    byteArray1 instanceof Uint8Array &&
    byteArray2 instanceof Uint8Array &&
    byteArray1.length === 32 &&
    byteArray2.length === 32
  ) {
    const buf = new Uint8Array(32);
    let i;
    for (i = 0; i < 32; i += 1) {
      buf[i] = byteArray1[i] ^ byteArray2[i];
    }
    return bytesToHexString(buf);
  }
  throw new XorSeedError();
}

export function xorRescueCode(rescueCode, hash) {
  if (
    rescueCode instanceof Uint8Array &&
    hash instanceof Uint8Array &&
    hash.length === 32 &&
    rescueCode.length === 4
  ) {
    const buf = new Uint8Array(rescueCode.length);
    let i;
    for (i = 0; i < rescueCode.length; i += 1) {
      buf[i] = rescueCode[i] ^ hash[i];
    }
    return bytesToHexString(buf);
  }
  throw new XorSeedError();
}

export function defaultProgress(status) {
  const seconds = Math.trunc(Date.now());
  if (status.total < 2) {
    // eslint-disable-next-line no-console
    console.log(`${seconds} : ${status.message}`);
  } else {
    // eslint-disable-next-line no-console
    console.log(
      `${seconds} : ${status.message} (${status.state}/${status.total})`
    );
  }
}

export const SecretinPrefix = 'Secret-in:';

const Utils = {
  xorRescueCode,
  generateRescueCodes,
  generateSeed,
  hexStringToUint8Array,
  bytesToHexString,
  asciiToUint8Array,
  bytesToASCIIString,
  xorSeed,
  defaultProgress,
  asciiToHexString,
  hexStringToAscii,
  PasswordGenerator,
  SecretinPrefix,
};

export default Utils;
