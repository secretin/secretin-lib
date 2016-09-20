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

export function generateRandomString(length) {
  const charset = (
    'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ123456789 !"#$%&\'()*+,-./:;<=>?@[\\]_{}'
  );
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);

  let string = '';
  for (let i = 0; i < length; i++) {
    string += charset[randomValues[i] % charset.length];
  }

  return string;
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

  return output;
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
