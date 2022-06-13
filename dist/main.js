'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var util = require('util');

const typeofs = [
  'string',
  'number',
  'bigint',
  'symbol'
];
const objectTypeNames = [
  'Function',
  'Generator',
  'AsyncGenerator',
  'GeneratorFunction',
  'AsyncGeneratorFunction',
  'AsyncFunction',
  'Observable',
  'Array',
  'Buffer',
  'Object',
  'RegExp',
  'Date',
  'Error',
  'Map',
  'Set',
  'WeakMap',
  'WeakSet',
  'ArrayBuffer',
  'SharedArrayBuffer',
  'DataView',
  'Promise',
  'URL',
  'HTMLElement',
  'Int8Array',
  'Uint8Array',
  'Uint8ClampedArray',
  'Int16Array',
  'Uint16Array',
  'Int32Array',
  'Uint32Array',
  'Float32Array',
  'Float64Array',
  'BigInt64Array',
  'BigUint64Array'
];
function is(value) {
  if (value === null) {
    return 'null';
  }
  if (value === undefined) {
    return 'undefined';
  }
  if (value === true || value === false) {
    return 'boolean';
  }
  const typeOf = typeof value;
  if (typeofs.includes(typeOf)) {
    return typeOf;
  }
  if (typeOf === 'function') {
    return 'Function';
  }
  if (Array.isArray(value)) {
    return 'Array';
  }
  if (isBuffer$1(value)) {
    return 'Buffer';
  }
  const objectType = getObjectType(value);
  if (objectType) {
    return objectType;
  }
  return 'Object';
}
function isBuffer$1(value) {
  return value && value.constructor && value.constructor.isBuffer && value.constructor.isBuffer.call(null, value);
}
function getObjectType(value) {
  const objectTypeName = Object.prototype.toString.call(value).slice(8, -1);
  if (objectTypeNames.includes(objectTypeName)) {
    return objectTypeName;
  }
  return undefined;
}

class Type {
  constructor(major, name, terminal) {
    this.major = major;
    this.majorEncoded = major << 5;
    this.name = name;
    this.terminal = terminal;
  }
  toString() {
    return `Type[${ this.major }].${ this.name }`;
  }
  compare(typ) {
    return this.major < typ.major ? -1 : this.major > typ.major ? 1 : 0;
  }
}
Type.uint = new Type(0, 'uint', true);
Type.negint = new Type(1, 'negint', true);
Type.bytes = new Type(2, 'bytes', true);
Type.string = new Type(3, 'string', true);
Type.array = new Type(4, 'array', false);
Type.map = new Type(5, 'map', false);
Type.tag = new Type(6, 'tag', false);
Type.float = new Type(7, 'float', true);
Type.false = new Type(7, 'false', true);
Type.true = new Type(7, 'true', true);
Type.null = new Type(7, 'null', true);
Type.undefined = new Type(7, 'undefined', true);
Type.break = new Type(7, 'break', true);
class Token {
  constructor(type, value, encodedLength) {
    this.type = type;
    this.value = value;
    this.encodedLength = encodedLength;
    this.encodedBytes = undefined;
    this.byteValue = undefined;
  }
  toString() {
    return `Token[${ this.type }].${ this.value }`;
  }
}

const useBuffer = globalThis.process && !globalThis.process.browser && globalThis.Buffer && typeof globalThis.Buffer.isBuffer === 'function';
const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();
function isBuffer(buf) {
  return useBuffer && globalThis.Buffer.isBuffer(buf);
}
function asU8A(buf) {
  if (!(buf instanceof Uint8Array)) {
    return Uint8Array.from(buf);
  }
  return isBuffer(buf) ? new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength) : buf;
}
const toString = useBuffer ? (bytes, start, end) => {
  return end - start > 64 ? globalThis.Buffer.from(bytes.subarray(start, end)).toString('utf8') : utf8Slice(bytes, start, end);
} : (bytes, start, end) => {
  return end - start > 64 ? textDecoder.decode(bytes.subarray(start, end)) : utf8Slice(bytes, start, end);
};
const fromString = useBuffer ? string => {
  return string.length > 64 ? globalThis.Buffer.from(string) : utf8ToBytes(string);
} : string => {
  return string.length > 64 ? textEncoder.encode(string) : utf8ToBytes(string);
};
const fromArray = arr => {
  return Uint8Array.from(arr);
};
const slice = useBuffer ? (bytes, start, end) => {
  if (isBuffer(bytes)) {
    return new Uint8Array(bytes.subarray(start, end));
  }
  return bytes.slice(start, end);
} : (bytes, start, end) => {
  return bytes.slice(start, end);
};
const concat = useBuffer ? (chunks, length) => {
  chunks = chunks.map(c => c instanceof Uint8Array ? c : globalThis.Buffer.from(c));
  return asU8A(globalThis.Buffer.concat(chunks, length));
} : (chunks, length) => {
  const out = new Uint8Array(length);
  let off = 0;
  for (let b of chunks) {
    if (off + b.length > out.length) {
      b = b.subarray(0, out.length - off);
    }
    out.set(b, off);
    off += b.length;
  }
  return out;
};
const alloc = useBuffer ? size => {
  return globalThis.Buffer.allocUnsafe(size);
} : size => {
  return new Uint8Array(size);
};
function compare(b1, b2) {
  if (isBuffer(b1) && isBuffer(b2)) {
    return b1.compare(b2);
  }
  for (let i = 0; i < b1.length; i++) {
    if (b1[i] === b2[i]) {
      continue;
    }
    return b1[i] < b2[i] ? -1 : 1;
  }
  return 0;
}
function utf8ToBytes(string, units = Infinity) {
  let codePoint;
  const length = string.length;
  let leadSurrogate = null;
  const bytes = [];
  for (let i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i);
    if (codePoint > 55295 && codePoint < 57344) {
      if (!leadSurrogate) {
        if (codePoint > 56319) {
          if ((units -= 3) > -1)
            bytes.push(239, 191, 189);
          continue;
        } else if (i + 1 === length) {
          if ((units -= 3) > -1)
            bytes.push(239, 191, 189);
          continue;
        }
        leadSurrogate = codePoint;
        continue;
      }
      if (codePoint < 56320) {
        if ((units -= 3) > -1)
          bytes.push(239, 191, 189);
        leadSurrogate = codePoint;
        continue;
      }
      codePoint = (leadSurrogate - 55296 << 10 | codePoint - 56320) + 65536;
    } else if (leadSurrogate) {
      if ((units -= 3) > -1)
        bytes.push(239, 191, 189);
    }
    leadSurrogate = null;
    if (codePoint < 128) {
      if ((units -= 1) < 0)
        break;
      bytes.push(codePoint);
    } else if (codePoint < 2048) {
      if ((units -= 2) < 0)
        break;
      bytes.push(codePoint >> 6 | 192, codePoint & 63 | 128);
    } else if (codePoint < 65536) {
      if ((units -= 3) < 0)
        break;
      bytes.push(codePoint >> 12 | 224, codePoint >> 6 & 63 | 128, codePoint & 63 | 128);
    } else if (codePoint < 1114112) {
      if ((units -= 4) < 0)
        break;
      bytes.push(codePoint >> 18 | 240, codePoint >> 12 & 63 | 128, codePoint >> 6 & 63 | 128, codePoint & 63 | 128);
    } else {
      throw new Error('Invalid code point');
    }
  }
  return bytes;
}
function utf8Slice(buf, offset, end) {
  const res = [];
  while (offset < end) {
    const firstByte = buf[offset];
    let codePoint = null;
    let bytesPerSequence = firstByte > 239 ? 4 : firstByte > 223 ? 3 : firstByte > 191 ? 2 : 1;
    if (offset + bytesPerSequence <= end) {
      let secondByte, thirdByte, fourthByte, tempCodePoint;
      switch (bytesPerSequence) {
      case 1:
        if (firstByte < 128) {
          codePoint = firstByte;
        }
        break;
      case 2:
        secondByte = buf[offset + 1];
        if ((secondByte & 192) === 128) {
          tempCodePoint = (firstByte & 31) << 6 | secondByte & 63;
          if (tempCodePoint > 127) {
            codePoint = tempCodePoint;
          }
        }
        break;
      case 3:
        secondByte = buf[offset + 1];
        thirdByte = buf[offset + 2];
        if ((secondByte & 192) === 128 && (thirdByte & 192) === 128) {
          tempCodePoint = (firstByte & 15) << 12 | (secondByte & 63) << 6 | thirdByte & 63;
          if (tempCodePoint > 2047 && (tempCodePoint < 55296 || tempCodePoint > 57343)) {
            codePoint = tempCodePoint;
          }
        }
        break;
      case 4:
        secondByte = buf[offset + 1];
        thirdByte = buf[offset + 2];
        fourthByte = buf[offset + 3];
        if ((secondByte & 192) === 128 && (thirdByte & 192) === 128 && (fourthByte & 192) === 128) {
          tempCodePoint = (firstByte & 15) << 18 | (secondByte & 63) << 12 | (thirdByte & 63) << 6 | fourthByte & 63;
          if (tempCodePoint > 65535 && tempCodePoint < 1114112) {
            codePoint = tempCodePoint;
          }
        }
      }
    }
    if (codePoint === null) {
      codePoint = 65533;
      bytesPerSequence = 1;
    } else if (codePoint > 65535) {
      codePoint -= 65536;
      res.push(codePoint >>> 10 & 1023 | 55296);
      codePoint = 56320 | codePoint & 1023;
    }
    res.push(codePoint);
    offset += bytesPerSequence;
  }
  return decodeCodePointsArray(res);
}
const MAX_ARGUMENTS_LENGTH = 4096;
function decodeCodePointsArray(codePoints) {
  const len = codePoints.length;
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints);
  }
  let res = '';
  let i = 0;
  while (i < len) {
    res += String.fromCharCode.apply(String, codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH));
  }
  return res;
}

const defaultChunkSize = 256;
class Bl {
  constructor(chunkSize = defaultChunkSize) {
    this.chunkSize = chunkSize;
    this.cursor = 0;
    this.maxCursor = -1;
    this.chunks = [];
    this._initReuseChunk = null;
  }
  reset() {
    this.cursor = 0;
    this.maxCursor = -1;
    if (this.chunks.length) {
      this.chunks = [];
    }
    if (this._initReuseChunk !== null) {
      this.chunks.push(this._initReuseChunk);
      this.maxCursor = this._initReuseChunk.length - 1;
    }
  }
  push(bytes) {
    let topChunk = this.chunks[this.chunks.length - 1];
    const newMax = this.cursor + bytes.length;
    if (newMax <= this.maxCursor + 1) {
      const chunkPos = topChunk.length - (this.maxCursor - this.cursor) - 1;
      topChunk.set(bytes, chunkPos);
    } else {
      if (topChunk) {
        const chunkPos = topChunk.length - (this.maxCursor - this.cursor) - 1;
        if (chunkPos < topChunk.length) {
          this.chunks[this.chunks.length - 1] = topChunk.subarray(0, chunkPos);
          this.maxCursor = this.cursor - 1;
        }
      }
      if (bytes.length < 64 && bytes.length < this.chunkSize) {
        topChunk = alloc(this.chunkSize);
        this.chunks.push(topChunk);
        this.maxCursor += topChunk.length;
        if (this._initReuseChunk === null) {
          this._initReuseChunk = topChunk;
        }
        topChunk.set(bytes, 0);
      } else {
        this.chunks.push(bytes);
        this.maxCursor += bytes.length;
      }
    }
    this.cursor += bytes.length;
  }
  toBytes(reset = false) {
    let byts;
    if (this.chunks.length === 1) {
      const chunk = this.chunks[0];
      if (reset && this.cursor > chunk.length / 2) {
        byts = this.cursor === chunk.length ? chunk : chunk.subarray(0, this.cursor);
        this._initReuseChunk = null;
        this.chunks = [];
      } else {
        byts = slice(chunk, 0, this.cursor);
      }
    } else {
      byts = concat(this.chunks, this.cursor);
    }
    if (reset) {
      this.reset();
    }
    return byts;
  }
}

const decodeErrPrefix = 'CBOR decode error:';
const encodeErrPrefix = 'CBOR encode error:';
function assertEnoughData(data, pos, need) {
  if (data.length - pos < need) {
    throw new Error(`${ decodeErrPrefix } not enough data for type`);
  }
}

const uintBoundaries = [
  24,
  256,
  65536,
  4294967296,
  BigInt('18446744073709551616')
];
function readUint8(data, offset, options) {
  assertEnoughData(data, offset, 1);
  const value = data[offset];
  if (options.strict === true && value < uintBoundaries[0]) {
    throw new Error(`${ decodeErrPrefix } integer encoded in more bytes than necessary (strict decode)`);
  }
  return value;
}
function readUint16(data, offset, options) {
  assertEnoughData(data, offset, 2);
  const value = data[offset] << 8 | data[offset + 1];
  if (options.strict === true && value < uintBoundaries[1]) {
    throw new Error(`${ decodeErrPrefix } integer encoded in more bytes than necessary (strict decode)`);
  }
  return value;
}
function readUint32(data, offset, options) {
  assertEnoughData(data, offset, 4);
  const value = data[offset] * 16777216 + (data[offset + 1] << 16) + (data[offset + 2] << 8) + data[offset + 3];
  if (options.strict === true && value < uintBoundaries[2]) {
    throw new Error(`${ decodeErrPrefix } integer encoded in more bytes than necessary (strict decode)`);
  }
  return value;
}
function readUint64(data, offset, options) {
  assertEnoughData(data, offset, 8);
  const hi = data[offset] * 16777216 + (data[offset + 1] << 16) + (data[offset + 2] << 8) + data[offset + 3];
  const lo = data[offset + 4] * 16777216 + (data[offset + 5] << 16) + (data[offset + 6] << 8) + data[offset + 7];
  const value = (BigInt(hi) << BigInt(32)) + BigInt(lo);
  if (options.strict === true && value < uintBoundaries[3]) {
    throw new Error(`${ decodeErrPrefix } integer encoded in more bytes than necessary (strict decode)`);
  }
  if (value <= Number.MAX_SAFE_INTEGER) {
    return Number(value);
  }
  if (options.allowBigInt === true) {
    return value;
  }
  throw new Error(`${ decodeErrPrefix } integers outside of the safe integer range are not supported`);
}
function decodeUint8(data, pos, _minor, options) {
  return new Token(Type.uint, readUint8(data, pos + 1, options), 2);
}
function decodeUint16(data, pos, _minor, options) {
  return new Token(Type.uint, readUint16(data, pos + 1, options), 3);
}
function decodeUint32(data, pos, _minor, options) {
  return new Token(Type.uint, readUint32(data, pos + 1, options), 5);
}
function decodeUint64(data, pos, _minor, options) {
  return new Token(Type.uint, readUint64(data, pos + 1, options), 9);
}
function encodeUint(buf, token) {
  return encodeUintValue(buf, 0, token.value);
}
function encodeUintValue(buf, major, uint) {
  if (uint < uintBoundaries[0]) {
    const nuint = Number(uint);
    buf.push([major | nuint]);
  } else if (uint < uintBoundaries[1]) {
    const nuint = Number(uint);
    buf.push([
      major | 24,
      nuint
    ]);
  } else if (uint < uintBoundaries[2]) {
    const nuint = Number(uint);
    buf.push([
      major | 25,
      nuint >>> 8,
      nuint & 255
    ]);
  } else if (uint < uintBoundaries[3]) {
    const nuint = Number(uint);
    buf.push([
      major | 26,
      nuint >>> 24 & 255,
      nuint >>> 16 & 255,
      nuint >>> 8 & 255,
      nuint & 255
    ]);
  } else {
    const buint = BigInt(uint);
    if (buint < uintBoundaries[4]) {
      const set = [
        major | 27,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ];
      let lo = Number(buint & BigInt(4294967295));
      let hi = Number(buint >> BigInt(32) & BigInt(4294967295));
      set[8] = lo & 255;
      lo = lo >> 8;
      set[7] = lo & 255;
      lo = lo >> 8;
      set[6] = lo & 255;
      lo = lo >> 8;
      set[5] = lo & 255;
      set[4] = hi & 255;
      hi = hi >> 8;
      set[3] = hi & 255;
      hi = hi >> 8;
      set[2] = hi & 255;
      hi = hi >> 8;
      set[1] = hi & 255;
      buf.push(set);
    } else {
      throw new Error(`${ decodeErrPrefix } encountered BigInt larger than allowable range`);
    }
  }
}
encodeUint.encodedSize = function encodedSize(token) {
  return encodeUintValue.encodedSize(token.value);
};
encodeUintValue.encodedSize = function encodedSize(uint) {
  if (uint < uintBoundaries[0]) {
    return 1;
  }
  if (uint < uintBoundaries[1]) {
    return 2;
  }
  if (uint < uintBoundaries[2]) {
    return 3;
  }
  if (uint < uintBoundaries[3]) {
    return 5;
  }
  return 9;
};
encodeUint.compareTokens = function compareTokens(tok1, tok2) {
  return tok1.value < tok2.value ? -1 : tok1.value > tok2.value ? 1 : 0;
};

function decodeNegint8(data, pos, _minor, options) {
  return new Token(Type.negint, -1 - readUint8(data, pos + 1, options), 2);
}
function decodeNegint16(data, pos, _minor, options) {
  return new Token(Type.negint, -1 - readUint16(data, pos + 1, options), 3);
}
function decodeNegint32(data, pos, _minor, options) {
  return new Token(Type.negint, -1 - readUint32(data, pos + 1, options), 5);
}
const neg1b = BigInt(-1);
const pos1b = BigInt(1);
function decodeNegint64(data, pos, _minor, options) {
  const int = readUint64(data, pos + 1, options);
  if (typeof int !== 'bigint') {
    const value = -1 - int;
    if (value >= Number.MIN_SAFE_INTEGER) {
      return new Token(Type.negint, value, 9);
    }
  }
  if (options.allowBigInt !== true) {
    throw new Error(`${ decodeErrPrefix } integers outside of the safe integer range are not supported`);
  }
  return new Token(Type.negint, neg1b - BigInt(int), 9);
}
function encodeNegint(buf, token) {
  const negint = token.value;
  const unsigned = typeof negint === 'bigint' ? negint * neg1b - pos1b : negint * -1 - 1;
  encodeUintValue(buf, token.type.majorEncoded, unsigned);
}
encodeNegint.encodedSize = function encodedSize(token) {
  const negint = token.value;
  const unsigned = typeof negint === 'bigint' ? negint * neg1b - pos1b : negint * -1 - 1;
  if (unsigned < uintBoundaries[0]) {
    return 1;
  }
  if (unsigned < uintBoundaries[1]) {
    return 2;
  }
  if (unsigned < uintBoundaries[2]) {
    return 3;
  }
  if (unsigned < uintBoundaries[3]) {
    return 5;
  }
  return 9;
};
encodeNegint.compareTokens = function compareTokens(tok1, tok2) {
  return tok1.value < tok2.value ? 1 : tok1.value > tok2.value ? -1 : 0;
};

function toToken$3(data, pos, prefix, length) {
  assertEnoughData(data, pos, prefix + length);
  const buf = slice(data, pos + prefix, pos + prefix + length);
  return new Token(Type.bytes, buf, prefix + length);
}
function decodeBytesCompact(data, pos, minor, _options) {
  return toToken$3(data, pos, 1, minor);
}
function decodeBytes8(data, pos, _minor, options) {
  return toToken$3(data, pos, 2, readUint8(data, pos + 1, options));
}
function decodeBytes16(data, pos, _minor, options) {
  return toToken$3(data, pos, 3, readUint16(data, pos + 1, options));
}
function decodeBytes32(data, pos, _minor, options) {
  return toToken$3(data, pos, 5, readUint32(data, pos + 1, options));
}
function decodeBytes64(data, pos, _minor, options) {
  const l = readUint64(data, pos + 1, options);
  if (typeof l === 'bigint') {
    throw new Error(`${ decodeErrPrefix } 64-bit integer bytes lengths not supported`);
  }
  return toToken$3(data, pos, 9, l);
}
function tokenBytes(token) {
  if (token.encodedBytes === undefined) {
    token.encodedBytes = token.type === Type.string ? fromString(token.value) : token.value;
  }
  return token.encodedBytes;
}
function encodeBytes(buf, token) {
  const bytes = tokenBytes(token);
  encodeUintValue(buf, token.type.majorEncoded, bytes.length);
  buf.push(bytes);
}
encodeBytes.encodedSize = function encodedSize(token) {
  const bytes = tokenBytes(token);
  return encodeUintValue.encodedSize(bytes.length) + bytes.length;
};
encodeBytes.compareTokens = function compareTokens(tok1, tok2) {
  return compareBytes(tokenBytes(tok1), tokenBytes(tok2));
};
function compareBytes(b1, b2) {
  return b1.length < b2.length ? -1 : b1.length > b2.length ? 1 : compare(b1, b2);
}

function toToken$2(data, pos, prefix, length, options) {
  const totLength = prefix + length;
  assertEnoughData(data, pos, totLength);
  const tok = new Token(Type.string, toString(data, pos + prefix, pos + totLength), totLength);
  if (options.retainStringBytes === true) {
    tok.byteValue = slice(data, pos + prefix, pos + totLength);
  }
  return tok;
}
function decodeStringCompact(data, pos, minor, options) {
  return toToken$2(data, pos, 1, minor, options);
}
function decodeString8(data, pos, _minor, options) {
  return toToken$2(data, pos, 2, readUint8(data, pos + 1, options), options);
}
function decodeString16(data, pos, _minor, options) {
  return toToken$2(data, pos, 3, readUint16(data, pos + 1, options), options);
}
function decodeString32(data, pos, _minor, options) {
  return toToken$2(data, pos, 5, readUint32(data, pos + 1, options), options);
}
function decodeString64(data, pos, _minor, options) {
  const l = readUint64(data, pos + 1, options);
  if (typeof l === 'bigint') {
    throw new Error(`${ decodeErrPrefix } 64-bit integer string lengths not supported`);
  }
  return toToken$2(data, pos, 9, l, options);
}
const encodeString = encodeBytes;

function toToken$1(_data, _pos, prefix, length) {
  return new Token(Type.array, length, prefix);
}
function decodeArrayCompact(data, pos, minor, _options) {
  return toToken$1(data, pos, 1, minor);
}
function decodeArray8(data, pos, _minor, options) {
  return toToken$1(data, pos, 2, readUint8(data, pos + 1, options));
}
function decodeArray16(data, pos, _minor, options) {
  return toToken$1(data, pos, 3, readUint16(data, pos + 1, options));
}
function decodeArray32(data, pos, _minor, options) {
  return toToken$1(data, pos, 5, readUint32(data, pos + 1, options));
}
function decodeArray64(data, pos, _minor, options) {
  const l = readUint64(data, pos + 1, options);
  if (typeof l === 'bigint') {
    throw new Error(`${ decodeErrPrefix } 64-bit integer array lengths not supported`);
  }
  return toToken$1(data, pos, 9, l);
}
function decodeArrayIndefinite(data, pos, _minor, options) {
  if (options.allowIndefinite === false) {
    throw new Error(`${ decodeErrPrefix } indefinite length items not allowed`);
  }
  return toToken$1(data, pos, 1, Infinity);
}
function encodeArray(buf, token) {
  encodeUintValue(buf, Type.array.majorEncoded, token.value);
}
encodeArray.compareTokens = encodeUint.compareTokens;
encodeArray.encodedSize = function encodedSize(token) {
  return encodeUintValue.encodedSize(token.value);
};

function toToken(_data, _pos, prefix, length) {
  return new Token(Type.map, length, prefix);
}
function decodeMapCompact(data, pos, minor, _options) {
  return toToken(data, pos, 1, minor);
}
function decodeMap8(data, pos, _minor, options) {
  return toToken(data, pos, 2, readUint8(data, pos + 1, options));
}
function decodeMap16(data, pos, _minor, options) {
  return toToken(data, pos, 3, readUint16(data, pos + 1, options));
}
function decodeMap32(data, pos, _minor, options) {
  return toToken(data, pos, 5, readUint32(data, pos + 1, options));
}
function decodeMap64(data, pos, _minor, options) {
  const l = readUint64(data, pos + 1, options);
  if (typeof l === 'bigint') {
    throw new Error(`${ decodeErrPrefix } 64-bit integer map lengths not supported`);
  }
  return toToken(data, pos, 9, l);
}
function decodeMapIndefinite(data, pos, _minor, options) {
  if (options.allowIndefinite === false) {
    throw new Error(`${ decodeErrPrefix } indefinite length items not allowed`);
  }
  return toToken(data, pos, 1, Infinity);
}
function encodeMap(buf, token) {
  encodeUintValue(buf, Type.map.majorEncoded, token.value);
}
encodeMap.compareTokens = encodeUint.compareTokens;
encodeMap.encodedSize = function encodedSize(token) {
  return encodeUintValue.encodedSize(token.value);
};

function decodeTagCompact(_data, _pos, minor, _options) {
  return new Token(Type.tag, minor, 1);
}
function decodeTag8(data, pos, _minor, options) {
  return new Token(Type.tag, readUint8(data, pos + 1, options), 2);
}
function decodeTag16(data, pos, _minor, options) {
  return new Token(Type.tag, readUint16(data, pos + 1, options), 3);
}
function decodeTag32(data, pos, _minor, options) {
  return new Token(Type.tag, readUint32(data, pos + 1, options), 5);
}
function decodeTag64(data, pos, _minor, options) {
  return new Token(Type.tag, readUint64(data, pos + 1, options), 9);
}
function encodeTag(buf, token) {
  encodeUintValue(buf, Type.tag.majorEncoded, token.value);
}
encodeTag.compareTokens = encodeUint.compareTokens;
encodeTag.encodedSize = function encodedSize(token) {
  return encodeUintValue.encodedSize(token.value);
};

const MINOR_FALSE = 20;
const MINOR_TRUE = 21;
const MINOR_NULL = 22;
const MINOR_UNDEFINED = 23;
function decodeUndefined(_data, _pos, _minor, options) {
  if (options.allowUndefined === false) {
    throw new Error(`${ decodeErrPrefix } undefined values are not supported`);
  } else if (options.coerceUndefinedToNull === true) {
    return new Token(Type.null, null, 1);
  }
  return new Token(Type.undefined, undefined, 1);
}
function decodeBreak(_data, _pos, _minor, options) {
  if (options.allowIndefinite === false) {
    throw new Error(`${ decodeErrPrefix } indefinite length items not allowed`);
  }
  return new Token(Type.break, undefined, 1);
}
function createToken(value, bytes, options) {
  if (options) {
    if (options.allowNaN === false && Number.isNaN(value)) {
      throw new Error(`${ decodeErrPrefix } NaN values are not supported`);
    }
    if (options.allowInfinity === false && (value === Infinity || value === -Infinity)) {
      throw new Error(`${ decodeErrPrefix } Infinity values are not supported`);
    }
  }
  return new Token(Type.float, value, bytes);
}
function decodeFloat16(data, pos, _minor, options) {
  return createToken(readFloat16(data, pos + 1), 3, options);
}
function decodeFloat32(data, pos, _minor, options) {
  return createToken(readFloat32(data, pos + 1), 5, options);
}
function decodeFloat64(data, pos, _minor, options) {
  return createToken(readFloat64(data, pos + 1), 9, options);
}
function encodeFloat(buf, token, options) {
  const float = token.value;
  if (float === false) {
    buf.push([Type.float.majorEncoded | MINOR_FALSE]);
  } else if (float === true) {
    buf.push([Type.float.majorEncoded | MINOR_TRUE]);
  } else if (float === null) {
    buf.push([Type.float.majorEncoded | MINOR_NULL]);
  } else if (float === undefined) {
    buf.push([Type.float.majorEncoded | MINOR_UNDEFINED]);
  } else {
    let decoded;
    let success = false;
    if (!options || options.float64 !== true) {
      encodeFloat16(float);
      decoded = readFloat16(ui8a, 1);
      if (float === decoded || Number.isNaN(float)) {
        ui8a[0] = 249;
        buf.push(ui8a.slice(0, 3));
        success = true;
      } else {
        encodeFloat32(float);
        decoded = readFloat32(ui8a, 1);
        if (float === decoded) {
          ui8a[0] = 250;
          buf.push(ui8a.slice(0, 5));
          success = true;
        }
      }
    }
    if (!success) {
      encodeFloat64(float);
      decoded = readFloat64(ui8a, 1);
      ui8a[0] = 251;
      buf.push(ui8a.slice(0, 9));
    }
  }
}
encodeFloat.encodedSize = function encodedSize(token, options) {
  const float = token.value;
  if (float === false || float === true || float === null || float === undefined) {
    return 1;
  }
  if (!options || options.float64 !== true) {
    encodeFloat16(float);
    let decoded = readFloat16(ui8a, 1);
    if (float === decoded || Number.isNaN(float)) {
      return 3;
    }
    encodeFloat32(float);
    decoded = readFloat32(ui8a, 1);
    if (float === decoded) {
      return 5;
    }
  }
  return 9;
};
const buffer = new ArrayBuffer(9);
const dataView = new DataView(buffer, 1);
const ui8a = new Uint8Array(buffer, 0);
function encodeFloat16(inp) {
  if (inp === Infinity) {
    dataView.setUint16(0, 31744, false);
  } else if (inp === -Infinity) {
    dataView.setUint16(0, 64512, false);
  } else if (Number.isNaN(inp)) {
    dataView.setUint16(0, 32256, false);
  } else {
    dataView.setFloat32(0, inp);
    const valu32 = dataView.getUint32(0);
    const exponent = (valu32 & 2139095040) >> 23;
    const mantissa = valu32 & 8388607;
    if (exponent === 255) {
      dataView.setUint16(0, 31744, false);
    } else if (exponent === 0) {
      dataView.setUint16(0, (inp & 2147483648) >> 16 | mantissa >> 13, false);
    } else {
      const logicalExponent = exponent - 127;
      if (logicalExponent < -24) {
        dataView.setUint16(0, 0);
      } else if (logicalExponent < -14) {
        dataView.setUint16(0, (valu32 & 2147483648) >> 16 | 1 << 24 + logicalExponent, false);
      } else {
        dataView.setUint16(0, (valu32 & 2147483648) >> 16 | logicalExponent + 15 << 10 | mantissa >> 13, false);
      }
    }
  }
}
function readFloat16(ui8a, pos) {
  if (ui8a.length - pos < 2) {
    throw new Error(`${ decodeErrPrefix } not enough data for float16`);
  }
  const half = (ui8a[pos] << 8) + ui8a[pos + 1];
  if (half === 31744) {
    return Infinity;
  }
  if (half === 64512) {
    return -Infinity;
  }
  if (half === 32256) {
    return NaN;
  }
  const exp = half >> 10 & 31;
  const mant = half & 1023;
  let val;
  if (exp === 0) {
    val = mant * 2 ** -24;
  } else if (exp !== 31) {
    val = (mant + 1024) * 2 ** (exp - 25);
  } else {
    val = mant === 0 ? Infinity : NaN;
  }
  return half & 32768 ? -val : val;
}
function encodeFloat32(inp) {
  dataView.setFloat32(0, inp, false);
}
function readFloat32(ui8a, pos) {
  if (ui8a.length - pos < 4) {
    throw new Error(`${ decodeErrPrefix } not enough data for float32`);
  }
  const offset = (ui8a.byteOffset || 0) + pos;
  return new DataView(ui8a.buffer, offset, 4).getFloat32(0, false);
}
function encodeFloat64(inp) {
  dataView.setFloat64(0, inp, false);
}
function readFloat64(ui8a, pos) {
  if (ui8a.length - pos < 8) {
    throw new Error(`${ decodeErrPrefix } not enough data for float64`);
  }
  const offset = (ui8a.byteOffset || 0) + pos;
  return new DataView(ui8a.buffer, offset, 8).getFloat64(0, false);
}
encodeFloat.compareTokens = encodeUint.compareTokens;

function invalidMinor(data, pos, minor) {
  throw new Error(`${ decodeErrPrefix } encountered invalid minor (${ minor }) for major ${ data[pos] >>> 5 }`);
}
function errorer(msg) {
  return () => {
    throw new Error(`${ decodeErrPrefix } ${ msg }`);
  };
}
const jump = [];
for (let i = 0; i <= 23; i++) {
  jump[i] = invalidMinor;
}
jump[24] = decodeUint8;
jump[25] = decodeUint16;
jump[26] = decodeUint32;
jump[27] = decodeUint64;
jump[28] = invalidMinor;
jump[29] = invalidMinor;
jump[30] = invalidMinor;
jump[31] = invalidMinor;
for (let i = 32; i <= 55; i++) {
  jump[i] = invalidMinor;
}
jump[56] = decodeNegint8;
jump[57] = decodeNegint16;
jump[58] = decodeNegint32;
jump[59] = decodeNegint64;
jump[60] = invalidMinor;
jump[61] = invalidMinor;
jump[62] = invalidMinor;
jump[63] = invalidMinor;
for (let i = 64; i <= 87; i++) {
  jump[i] = decodeBytesCompact;
}
jump[88] = decodeBytes8;
jump[89] = decodeBytes16;
jump[90] = decodeBytes32;
jump[91] = decodeBytes64;
jump[92] = invalidMinor;
jump[93] = invalidMinor;
jump[94] = invalidMinor;
jump[95] = errorer('indefinite length bytes/strings are not supported');
for (let i = 96; i <= 119; i++) {
  jump[i] = decodeStringCompact;
}
jump[120] = decodeString8;
jump[121] = decodeString16;
jump[122] = decodeString32;
jump[123] = decodeString64;
jump[124] = invalidMinor;
jump[125] = invalidMinor;
jump[126] = invalidMinor;
jump[127] = errorer('indefinite length bytes/strings are not supported');
for (let i = 128; i <= 151; i++) {
  jump[i] = decodeArrayCompact;
}
jump[152] = decodeArray8;
jump[153] = decodeArray16;
jump[154] = decodeArray32;
jump[155] = decodeArray64;
jump[156] = invalidMinor;
jump[157] = invalidMinor;
jump[158] = invalidMinor;
jump[159] = decodeArrayIndefinite;
for (let i = 160; i <= 183; i++) {
  jump[i] = decodeMapCompact;
}
jump[184] = decodeMap8;
jump[185] = decodeMap16;
jump[186] = decodeMap32;
jump[187] = decodeMap64;
jump[188] = invalidMinor;
jump[189] = invalidMinor;
jump[190] = invalidMinor;
jump[191] = decodeMapIndefinite;
for (let i = 192; i <= 215; i++) {
  jump[i] = decodeTagCompact;
}
jump[216] = decodeTag8;
jump[217] = decodeTag16;
jump[218] = decodeTag32;
jump[219] = decodeTag64;
jump[220] = invalidMinor;
jump[221] = invalidMinor;
jump[222] = invalidMinor;
jump[223] = invalidMinor;
for (let i = 224; i <= 243; i++) {
  jump[i] = errorer('simple values are not supported');
}
jump[244] = invalidMinor;
jump[245] = invalidMinor;
jump[246] = invalidMinor;
jump[247] = decodeUndefined;
jump[248] = errorer('simple values are not supported');
jump[249] = decodeFloat16;
jump[250] = decodeFloat32;
jump[251] = decodeFloat64;
jump[252] = invalidMinor;
jump[253] = invalidMinor;
jump[254] = invalidMinor;
jump[255] = decodeBreak;
const quick = [];
for (let i = 0; i < 24; i++) {
  quick[i] = new Token(Type.uint, i, 1);
}
for (let i = -1; i >= -24; i--) {
  quick[31 - i] = new Token(Type.negint, i, 1);
}
quick[64] = new Token(Type.bytes, new Uint8Array(0), 1);
quick[96] = new Token(Type.string, '', 1);
quick[128] = new Token(Type.array, 0, 1);
quick[160] = new Token(Type.map, 0, 1);
quick[244] = new Token(Type.false, false, 1);
quick[245] = new Token(Type.true, true, 1);
quick[246] = new Token(Type.null, null, 1);
function quickEncodeToken(token) {
  switch (token.type) {
  case Type.false:
    return fromArray([244]);
  case Type.true:
    return fromArray([245]);
  case Type.null:
    return fromArray([246]);
  case Type.bytes:
    if (!token.value.length) {
      return fromArray([64]);
    }
    return;
  case Type.string:
    if (token.value === '') {
      return fromArray([96]);
    }
    return;
  case Type.array:
    if (token.value === 0) {
      return fromArray([128]);
    }
    return;
  case Type.map:
    if (token.value === 0) {
      return fromArray([160]);
    }
    return;
  case Type.uint:
    if (token.value < 24) {
      return fromArray([Number(token.value)]);
    }
    return;
  case Type.negint:
    if (token.value >= -24) {
      return fromArray([31 - Number(token.value)]);
    }
  }
}

const defaultEncodeOptions = {
  float64: false,
  mapSorter,
  quickEncodeToken
};
function makeCborEncoders() {
  const encoders = [];
  encoders[Type.uint.major] = encodeUint;
  encoders[Type.negint.major] = encodeNegint;
  encoders[Type.bytes.major] = encodeBytes;
  encoders[Type.string.major] = encodeString;
  encoders[Type.array.major] = encodeArray;
  encoders[Type.map.major] = encodeMap;
  encoders[Type.tag.major] = encodeTag;
  encoders[Type.float.major] = encodeFloat;
  return encoders;
}
const cborEncoders = makeCborEncoders();
const buf = new Bl();
class Ref {
  constructor(obj, parent) {
    this.obj = obj;
    this.parent = parent;
  }
  includes(obj) {
    let p = this;
    do {
      if (p.obj === obj) {
        return true;
      }
    } while (p = p.parent);
    return false;
  }
  static createCheck(stack, obj) {
    if (stack && stack.includes(obj)) {
      throw new Error(`${ encodeErrPrefix } object contains circular references`);
    }
    return new Ref(obj, stack);
  }
}
const simpleTokens = {
  null: new Token(Type.null, null),
  undefined: new Token(Type.undefined, undefined),
  true: new Token(Type.true, true),
  false: new Token(Type.false, false),
  emptyArray: new Token(Type.array, 0),
  emptyMap: new Token(Type.map, 0)
};
const typeEncoders$1 = {
  number(obj, _typ, _options, _refStack) {
    if (!Number.isInteger(obj) || !Number.isSafeInteger(obj)) {
      return new Token(Type.float, obj);
    } else if (obj >= 0) {
      return new Token(Type.uint, obj);
    } else {
      return new Token(Type.negint, obj);
    }
  },
  bigint(obj, _typ, _options, _refStack) {
    if (obj >= BigInt(0)) {
      return new Token(Type.uint, obj);
    } else {
      return new Token(Type.negint, obj);
    }
  },
  Uint8Array(obj, _typ, _options, _refStack) {
    return new Token(Type.bytes, obj);
  },
  string(obj, _typ, _options, _refStack) {
    return new Token(Type.string, obj);
  },
  boolean(obj, _typ, _options, _refStack) {
    return obj ? simpleTokens.true : simpleTokens.false;
  },
  null(_obj, _typ, _options, _refStack) {
    return simpleTokens.null;
  },
  undefined(_obj, _typ, _options, _refStack) {
    return simpleTokens.undefined;
  },
  ArrayBuffer(obj, _typ, _options, _refStack) {
    return new Token(Type.bytes, new Uint8Array(obj));
  },
  DataView(obj, _typ, _options, _refStack) {
    return new Token(Type.bytes, new Uint8Array(obj.buffer, obj.byteOffset, obj.byteLength));
  },
  Array(obj, _typ, options, refStack) {
    if (!obj.length) {
      if (options.addBreakTokens === true) {
        return [
          simpleTokens.emptyArray,
          new Token(Type.break)
        ];
      }
      return simpleTokens.emptyArray;
    }
    refStack = Ref.createCheck(refStack, obj);
    const entries = [];
    let i = 0;
    for (const e of obj) {
      entries[i++] = objectToTokens(e, options, refStack);
    }
    if (options.addBreakTokens) {
      return [
        new Token(Type.array, obj.length),
        entries,
        new Token(Type.break)
      ];
    }
    return [
      new Token(Type.array, obj.length),
      entries
    ];
  },
  Object(obj, typ, options, refStack) {
    const isMap = typ !== 'Object';
    const keys = isMap ? obj.keys() : Object.keys(obj);
    const length = isMap ? obj.size : keys.length;
    if (!length) {
      if (options.addBreakTokens === true) {
        return [
          simpleTokens.emptyMap,
          new Token(Type.break)
        ];
      }
      return simpleTokens.emptyMap;
    }
    refStack = Ref.createCheck(refStack, obj);
    const entries = [];
    let i = 0;
    for (const key of keys) {
      entries[i++] = [
        objectToTokens(key, options, refStack),
        objectToTokens(isMap ? obj.get(key) : obj[key], options, refStack)
      ];
    }
    sortMapEntries(entries, options);
    if (options.addBreakTokens) {
      return [
        new Token(Type.map, length),
        entries,
        new Token(Type.break)
      ];
    }
    return [
      new Token(Type.map, length),
      entries
    ];
  }
};
typeEncoders$1.Map = typeEncoders$1.Object;
typeEncoders$1.Buffer = typeEncoders$1.Uint8Array;
for (const typ of 'Uint8Clamped Uint16 Uint32 Int8 Int16 Int32 BigUint64 BigInt64 Float32 Float64'.split(' ')) {
  typeEncoders$1[`${ typ }Array`] = typeEncoders$1.DataView;
}
function objectToTokens(obj, options = {}, refStack) {
  const typ = is(obj);
  const customTypeEncoder = options && options.typeEncoders && options.typeEncoders[typ] || typeEncoders$1[typ];
  if (typeof customTypeEncoder === 'function') {
    const tokens = customTypeEncoder(obj, typ, options, refStack);
    if (tokens != null) {
      return tokens;
    }
  }
  const typeEncoder = typeEncoders$1[typ];
  if (!typeEncoder) {
    throw new Error(`${ encodeErrPrefix } unsupported type: ${ typ }`);
  }
  return typeEncoder(obj, typ, options, refStack);
}
function sortMapEntries(entries, options) {
  if (options.mapSorter) {
    entries.sort(options.mapSorter);
  }
}
function mapSorter(e1, e2) {
  const keyToken1 = Array.isArray(e1[0]) ? e1[0][0] : e1[0];
  const keyToken2 = Array.isArray(e2[0]) ? e2[0][0] : e2[0];
  if (keyToken1.type !== keyToken2.type) {
    return keyToken1.type.compare(keyToken2.type);
  }
  const major = keyToken1.type.major;
  const tcmp = cborEncoders[major].compareTokens(keyToken1, keyToken2);
  if (tcmp === 0) {
    console.warn('WARNING: complex key types used, CBOR key sorting guarantees are gone');
  }
  return tcmp;
}
function tokensToEncoded(buf, tokens, encoders, options) {
  if (Array.isArray(tokens)) {
    for (const token of tokens) {
      tokensToEncoded(buf, token, encoders, options);
    }
  } else {
    encoders[tokens.type.major](buf, tokens, options);
  }
}
function encodeCustom(data, encoders, options) {
  const tokens = objectToTokens(data, options);
  if (!Array.isArray(tokens) && options.quickEncodeToken) {
    const quickBytes = options.quickEncodeToken(tokens);
    if (quickBytes) {
      return quickBytes;
    }
    const encoder = encoders[tokens.type.major];
    if (encoder.encodedSize) {
      const size = encoder.encodedSize(tokens, options);
      const buf = new Bl(size);
      encoder(buf, tokens, options);
      if (buf.chunks.length !== 1) {
        throw new Error(`Unexpected error: pre-calculated length for ${ tokens } was wrong`);
      }
      return asU8A(buf.chunks[0]);
    }
  }
  buf.reset();
  tokensToEncoded(buf, tokens, encoders, options);
  return buf.toBytes(true);
}
function encode$4(data, options) {
  options = Object.assign({}, defaultEncodeOptions, options);
  return encodeCustom(data, cborEncoders, options);
}

const defaultDecodeOptions = {
  strict: false,
  allowIndefinite: true,
  allowUndefined: true,
  allowBigInt: true
};
class Tokeniser {
  constructor(data, options = {}) {
    this.pos = 0;
    this.data = data;
    this.options = options;
  }
  done() {
    return this.pos >= this.data.length;
  }
  next() {
    const byt = this.data[this.pos];
    let token = quick[byt];
    if (token === undefined) {
      const decoder = jump[byt];
      if (!decoder) {
        throw new Error(`${ decodeErrPrefix } no decoder for major type ${ byt >>> 5 } (byte 0x${ byt.toString(16).padStart(2, '0') })`);
      }
      const minor = byt & 31;
      token = decoder(this.data, this.pos, minor, this.options);
    }
    this.pos += token.encodedLength;
    return token;
  }
}
const DONE = Symbol.for('DONE');
const BREAK = Symbol.for('BREAK');
function tokenToArray(token, tokeniser, options) {
  const arr = [];
  for (let i = 0; i < token.value; i++) {
    const value = tokensToObject(tokeniser, options);
    if (value === BREAK) {
      if (token.value === Infinity) {
        break;
      }
      throw new Error(`${ decodeErrPrefix } got unexpected break to lengthed array`);
    }
    if (value === DONE) {
      throw new Error(`${ decodeErrPrefix } found array but not enough entries (got ${ i }, expected ${ token.value })`);
    }
    arr[i] = value;
  }
  return arr;
}
function tokenToMap(token, tokeniser, options) {
  const useMaps = options.useMaps === true;
  const obj = useMaps ? undefined : {};
  const m = useMaps ? new Map() : undefined;
  for (let i = 0; i < token.value; i++) {
    const key = tokensToObject(tokeniser, options);
    if (key === BREAK) {
      if (token.value === Infinity) {
        break;
      }
      throw new Error(`${ decodeErrPrefix } got unexpected break to lengthed map`);
    }
    if (key === DONE) {
      throw new Error(`${ decodeErrPrefix } found map but not enough entries (got ${ i } [no key], expected ${ token.value })`);
    }
    if (useMaps !== true && typeof key !== 'string') {
      throw new Error(`${ decodeErrPrefix } non-string keys not supported (got ${ typeof key })`);
    }
    const value = tokensToObject(tokeniser, options);
    if (value === DONE) {
      throw new Error(`${ decodeErrPrefix } found map but not enough entries (got ${ i } [no value], expected ${ token.value })`);
    }
    if (useMaps) {
      m.set(key, value);
    } else {
      obj[key] = value;
    }
  }
  return useMaps ? m : obj;
}
function tokensToObject(tokeniser, options) {
  if (tokeniser.done()) {
    return DONE;
  }
  const token = tokeniser.next();
  if (token.type === Type.break) {
    return BREAK;
  }
  if (token.type.terminal) {
    return token.value;
  }
  if (token.type === Type.array) {
    return tokenToArray(token, tokeniser, options);
  }
  if (token.type === Type.map) {
    return tokenToMap(token, tokeniser, options);
  }
  if (token.type === Type.tag) {
    if (options.tags && typeof options.tags[token.value] === 'function') {
      const tagged = tokensToObject(tokeniser, options);
      return options.tags[token.value](tagged);
    }
    throw new Error(`${ decodeErrPrefix } tag not supported (${ token.value })`);
  }
  throw new Error('unsupported');
}
function decode$4(data, options) {
  if (!(data instanceof Uint8Array)) {
    throw new Error(`${ decodeErrPrefix } data to decode must be a Uint8Array`);
  }
  options = Object.assign({}, defaultDecodeOptions, options);
  const tokeniser = options.tokenizer || new Tokeniser(data, options);
  const decoded = tokensToObject(tokeniser, options);
  if (decoded === DONE) {
    throw new Error(`${ decodeErrPrefix } did not find any content to decode`);
  }
  if (decoded === BREAK) {
    throw new Error(`${ decodeErrPrefix } got unexpected break`);
  }
  if (!tokeniser.done()) {
    throw new Error(`${ decodeErrPrefix } too many terminals, data makes no sense`);
  }
  return decoded;
}

/*!
 * Copyright (c) 2020 Digital Bazaar, Inc. All rights reserved.
 */
class CborldError extends Error {
  constructor(value, message) {
    super();
    this.message = message;
    this.value = value;
    this.stack = (new Error(`${value}: ${message}`)).stack;
    this.name = this.constructor.name;
  }
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
class CborldDecoder {
  // eslint-disable-next-line no-unused-vars
  decode({value} = {}) {
    throw new Error('Must be implemented by derived class.');
  }

  // eslint-disable-next-line no-unused-vars
  static createDecoder({value, transformer} = {}) {
    throw new Error('Must be implemented by derived class.');
  }
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
// known CBOR-LD registry values
const ID_TO_URL = new Map();
const URL_TO_ID = new Map();

/**
 * @see https://digitalbazaar.github.io/cbor-ld-spec/#term-codec-registry
 */
_addRegistration(0x10, 'https://www.w3.org/ns/activitystreams');
_addRegistration(0x11, 'https://www.w3.org/2018/credentials/v1');
_addRegistration(0x12, 'https://www.w3.org/ns/did/v1');
_addRegistration(0x13, 'https://w3id.org/security/suites/ed25519-2018/v1');
_addRegistration(0x14, 'https://w3id.org/security/suites/ed25519-2020/v1');
_addRegistration(0x15, 'https://w3id.org/cit/v1');
_addRegistration(0x16, 'https://w3id.org/age/v1');
_addRegistration(0x17, 'https://w3id.org/security/suites/x25519-2020/v1');
_addRegistration(0x18, 'https://w3id.org/veres-one/v1');
_addRegistration(0x19, 'https://w3id.org/webkms/v1');
_addRegistration(0x1A, 'https://w3id.org/zcap/v1');
_addRegistration(0x1B, 'https://w3id.org/security/suites/hmac-2019/v1');
_addRegistration(0x1C, 'https://w3id.org/security/suites/aes-2019/v1');
_addRegistration(0x1D, 'https://w3id.org/vaccination/v1');
_addRegistration(0x1E, 'https://w3id.org/vc-revocation-list-2020/v1');
_addRegistration(0x1F, 'https://w3id.org/dcc/v1c');
_addRegistration(0x20, 'https://w3id.org/vc/status-list/v1');

function _addRegistration(id, url) {
  URL_TO_ID.set(url, id);
  ID_TO_URL.set(id, url);
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

class ContextDecoder extends CborldDecoder {
  constructor({reverseAppContextMap} = {}) {
    super();
    this.reverseAppContextMap = reverseAppContextMap;
  }

  decode({value} = {}) {
    // handle uncompressed context
    if(typeof value !== 'number') {
      return _mapToObject(value);
    }

    // handle compressed context
    const url = ID_TO_URL.get(value) || this.reverseAppContextMap.get(value);
    if(url === undefined) {
      throw new CborldError(
        'ERR_UNDEFINED_COMPRESSED_CONTEXT',
        `Undefined compressed context "${value}".`);
    }
    return url;
  }

  static createDecoder({transformer} = {}) {
    const {reverseAppContextMap} = transformer;
    return new ContextDecoder({reverseAppContextMap});
  }
}

function _mapToObject(map) {
  if(Array.isArray(map)) {
    return map.map(_mapToObject);
  }
  if(!(map instanceof Map)) {
    return map;
  }

  const obj = {};
  for(const [key, value] of map) {
    obj[key] = _mapToObject(value);
  }
  return obj;
}

/**
 *  base64.ts
 *
 *  Licensed under the BSD 3-Clause License.
 *    http://opensource.org/licenses/BSD-3-Clause
 *
 *  References:
 *    http://en.wikipedia.org/wiki/Base64
 *
 * @author Dan Kogai (https://github.com/dankogai)
 */
const version = '3.7.2';
/**
 * @deprecated use lowercase `version`.
 */
const VERSION = version;
const _hasatob = typeof atob === 'function';
const _hasbtoa = typeof btoa === 'function';
const _hasBuffer = typeof Buffer === 'function';
const _TD = typeof TextDecoder === 'function' ? new TextDecoder() : undefined;
const _TE = typeof TextEncoder === 'function' ? new TextEncoder() : undefined;
const b64ch = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
const b64chs = Array.prototype.slice.call(b64ch);
const b64tab = ((a) => {
    let tab = {};
    a.forEach((c, i) => tab[c] = i);
    return tab;
})(b64chs);
const b64re = /^(?:[A-Za-z\d+\/]{4})*?(?:[A-Za-z\d+\/]{2}(?:==)?|[A-Za-z\d+\/]{3}=?)?$/;
const _fromCC = String.fromCharCode.bind(String);
const _U8Afrom = typeof Uint8Array.from === 'function'
    ? Uint8Array.from.bind(Uint8Array)
    : (it, fn = (x) => x) => new Uint8Array(Array.prototype.slice.call(it, 0).map(fn));
const _mkUriSafe = (src) => src
    .replace(/=/g, '').replace(/[+\/]/g, (m0) => m0 == '+' ? '-' : '_');
const _tidyB64 = (s) => s.replace(/[^A-Za-z0-9\+\/]/g, '');
/**
 * polyfill version of `btoa`
 */
const btoaPolyfill = (bin) => {
    // console.log('polyfilled');
    let u32, c0, c1, c2, asc = '';
    const pad = bin.length % 3;
    for (let i = 0; i < bin.length;) {
        if ((c0 = bin.charCodeAt(i++)) > 255 ||
            (c1 = bin.charCodeAt(i++)) > 255 ||
            (c2 = bin.charCodeAt(i++)) > 255)
            throw new TypeError('invalid character found');
        u32 = (c0 << 16) | (c1 << 8) | c2;
        asc += b64chs[u32 >> 18 & 63]
            + b64chs[u32 >> 12 & 63]
            + b64chs[u32 >> 6 & 63]
            + b64chs[u32 & 63];
    }
    return pad ? asc.slice(0, pad - 3) + "===".substring(pad) : asc;
};
/**
 * does what `window.btoa` of web browsers do.
 * @param {String} bin binary string
 * @returns {string} Base64-encoded string
 */
const _btoa = _hasbtoa ? (bin) => btoa(bin)
    : _hasBuffer ? (bin) => Buffer.from(bin, 'binary').toString('base64')
        : btoaPolyfill;
const _fromUint8Array = _hasBuffer
    ? (u8a) => Buffer.from(u8a).toString('base64')
    : (u8a) => {
        // cf. https://stackoverflow.com/questions/12710001/how-to-convert-uint8-array-to-base64-encoded-string/12713326#12713326
        const maxargs = 0x1000;
        let strs = [];
        for (let i = 0, l = u8a.length; i < l; i += maxargs) {
            strs.push(_fromCC.apply(null, u8a.subarray(i, i + maxargs)));
        }
        return _btoa(strs.join(''));
    };
/**
 * converts a Uint8Array to a Base64 string.
 * @param {boolean} [urlsafe] URL-and-filename-safe a la RFC4648 §5
 * @returns {string} Base64 string
 */
const fromUint8Array = (u8a, urlsafe = false) => urlsafe ? _mkUriSafe(_fromUint8Array(u8a)) : _fromUint8Array(u8a);
// This trick is found broken https://github.com/dankogai/js-base64/issues/130
// const utob = (src: string) => unescape(encodeURIComponent(src));
// reverting good old fationed regexp
const cb_utob = (c) => {
    if (c.length < 2) {
        var cc = c.charCodeAt(0);
        return cc < 0x80 ? c
            : cc < 0x800 ? (_fromCC(0xc0 | (cc >>> 6))
                + _fromCC(0x80 | (cc & 0x3f)))
                : (_fromCC(0xe0 | ((cc >>> 12) & 0x0f))
                    + _fromCC(0x80 | ((cc >>> 6) & 0x3f))
                    + _fromCC(0x80 | (cc & 0x3f)));
    }
    else {
        var cc = 0x10000
            + (c.charCodeAt(0) - 0xD800) * 0x400
            + (c.charCodeAt(1) - 0xDC00);
        return (_fromCC(0xf0 | ((cc >>> 18) & 0x07))
            + _fromCC(0x80 | ((cc >>> 12) & 0x3f))
            + _fromCC(0x80 | ((cc >>> 6) & 0x3f))
            + _fromCC(0x80 | (cc & 0x3f)));
    }
};
const re_utob = /[\uD800-\uDBFF][\uDC00-\uDFFFF]|[^\x00-\x7F]/g;
/**
 * @deprecated should have been internal use only.
 * @param {string} src UTF-8 string
 * @returns {string} UTF-16 string
 */
const utob = (u) => u.replace(re_utob, cb_utob);
//
const _encode = _hasBuffer
    ? (s) => Buffer.from(s, 'utf8').toString('base64')
    : _TE
        ? (s) => _fromUint8Array(_TE.encode(s))
        : (s) => _btoa(utob(s));
/**
 * converts a UTF-8-encoded string to a Base64 string.
 * @param {boolean} [urlsafe] if `true` make the result URL-safe
 * @returns {string} Base64 string
 */
const encode$3 = (src, urlsafe = false) => urlsafe
    ? _mkUriSafe(_encode(src))
    : _encode(src);
/**
 * converts a UTF-8-encoded string to URL-safe Base64 RFC4648 §5.
 * @returns {string} Base64 string
 */
const encodeURI = (src) => encode$3(src, true);
// This trick is found broken https://github.com/dankogai/js-base64/issues/130
// const btou = (src: string) => decodeURIComponent(escape(src));
// reverting good old fationed regexp
const re_btou = /[\xC0-\xDF][\x80-\xBF]|[\xE0-\xEF][\x80-\xBF]{2}|[\xF0-\xF7][\x80-\xBF]{3}/g;
const cb_btou = (cccc) => {
    switch (cccc.length) {
        case 4:
            var cp = ((0x07 & cccc.charCodeAt(0)) << 18)
                | ((0x3f & cccc.charCodeAt(1)) << 12)
                | ((0x3f & cccc.charCodeAt(2)) << 6)
                | (0x3f & cccc.charCodeAt(3)), offset = cp - 0x10000;
            return (_fromCC((offset >>> 10) + 0xD800)
                + _fromCC((offset & 0x3FF) + 0xDC00));
        case 3:
            return _fromCC(((0x0f & cccc.charCodeAt(0)) << 12)
                | ((0x3f & cccc.charCodeAt(1)) << 6)
                | (0x3f & cccc.charCodeAt(2)));
        default:
            return _fromCC(((0x1f & cccc.charCodeAt(0)) << 6)
                | (0x3f & cccc.charCodeAt(1)));
    }
};
/**
 * @deprecated should have been internal use only.
 * @param {string} src UTF-16 string
 * @returns {string} UTF-8 string
 */
const btou = (b) => b.replace(re_btou, cb_btou);
/**
 * polyfill version of `atob`
 */
const atobPolyfill = (asc) => {
    // console.log('polyfilled');
    asc = asc.replace(/\s+/g, '');
    if (!b64re.test(asc))
        throw new TypeError('malformed base64.');
    asc += '=='.slice(2 - (asc.length & 3));
    let u24, bin = '', r1, r2;
    for (let i = 0; i < asc.length;) {
        u24 = b64tab[asc.charAt(i++)] << 18
            | b64tab[asc.charAt(i++)] << 12
            | (r1 = b64tab[asc.charAt(i++)]) << 6
            | (r2 = b64tab[asc.charAt(i++)]);
        bin += r1 === 64 ? _fromCC(u24 >> 16 & 255)
            : r2 === 64 ? _fromCC(u24 >> 16 & 255, u24 >> 8 & 255)
                : _fromCC(u24 >> 16 & 255, u24 >> 8 & 255, u24 & 255);
    }
    return bin;
};
/**
 * does what `window.atob` of web browsers do.
 * @param {String} asc Base64-encoded string
 * @returns {string} binary string
 */
const _atob = _hasatob ? (asc) => atob(_tidyB64(asc))
    : _hasBuffer ? (asc) => Buffer.from(asc, 'base64').toString('binary')
        : atobPolyfill;
//
const _toUint8Array = _hasBuffer
    ? (a) => _U8Afrom(Buffer.from(a, 'base64'))
    : (a) => _U8Afrom(_atob(a), c => c.charCodeAt(0));
/**
 * converts a Base64 string to a Uint8Array.
 */
const toUint8Array = (a) => _toUint8Array(_unURI(a));
//
const _decode = _hasBuffer
    ? (a) => Buffer.from(a, 'base64').toString('utf8')
    : _TD
        ? (a) => _TD.decode(_toUint8Array(a))
        : (a) => btou(_atob(a));
const _unURI = (a) => _tidyB64(a.replace(/[-_]/g, (m0) => m0 == '-' ? '+' : '/'));
/**
 * converts a Base64 string to a UTF-8 string.
 * @param {String} src Base64 string.  Both normal and URL-safe are supported
 * @returns {string} UTF-8 string
 */
const decode$3 = (src) => _decode(_unURI(src));
/**
 * check if a value is a valid Base64 string
 * @param {String} src a value to check
  */
const isValid = (src) => {
    if (typeof src !== 'string')
        return false;
    const s = src.replace(/\s+/g, '').replace(/={0,2}$/, '');
    return !/[^\s0-9a-zA-Z\+/]/.test(s) || !/[^\s0-9a-zA-Z\-_]/.test(s);
};
//
const _noEnum = (v) => {
    return {
        value: v, enumerable: false, writable: true, configurable: true
    };
};
/**
 * extend String.prototype with relevant methods
 */
const extendString = function () {
    const _add = (name, body) => Object.defineProperty(String.prototype, name, _noEnum(body));
    _add('fromBase64', function () { return decode$3(this); });
    _add('toBase64', function (urlsafe) { return encode$3(this, urlsafe); });
    _add('toBase64URI', function () { return encode$3(this, true); });
    _add('toBase64URL', function () { return encode$3(this, true); });
    _add('toUint8Array', function () { return toUint8Array(this); });
};
/**
 * extend Uint8Array.prototype with relevant methods
 */
const extendUint8Array = function () {
    const _add = (name, body) => Object.defineProperty(Uint8Array.prototype, name, _noEnum(body));
    _add('toBase64', function (urlsafe) { return fromUint8Array(this, urlsafe); });
    _add('toBase64URI', function () { return fromUint8Array(this, true); });
    _add('toBase64URL', function () { return fromUint8Array(this, true); });
};
/**
 * extend Builtin prototypes with relevant methods
 */
const extendBuiltins = () => {
    extendString();
    extendUint8Array();
};
const gBase64 = {
    version: version,
    VERSION: VERSION,
    atob: _atob,
    atobPolyfill: atobPolyfill,
    btoa: _btoa,
    btoaPolyfill: btoaPolyfill,
    fromBase64: decode$3,
    toBase64: encode$3,
    encode: encode$3,
    encodeURI: encodeURI,
    encodeURL: encodeURI,
    utob: utob,
    btou: btou,
    decode: decode$3,
    isValid: isValid,
    fromUint8Array: fromUint8Array,
    toUint8Array: toUint8Array,
    extendString: extendString,
    extendUint8Array: extendUint8Array,
    extendBuiltins: extendBuiltins,
};

/**
 * Base-N/Base-X encoding/decoding functions.
 *
 * Original implementation from base-x:
 * https://github.com/cryptocoinjs/base-x
 *
 * Which is MIT licensed:
 *
 * The MIT License (MIT)
 *
 * Copyright base-x contributors (c) 2016
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */
// baseN alphabet indexes
const _reverseAlphabets = {};

/**
 * BaseN-encodes a Uint8Array using the given alphabet.
 *
 * @param {Uint8Array} input - The bytes to encode in a Uint8Array.
 * @param {string} alphabet - The alphabet to use for encoding.
 * @param {number} maxline - The maximum number of encoded characters per line
 *          to use, defaults to none.
 *
 * @returns {string} The baseN-encoded output string.
 */
function encode$2(input, alphabet, maxline) {
  if(!(input instanceof Uint8Array)) {
    throw new TypeError('"input" must be a Uint8Array.');
  }
  if(typeof alphabet !== 'string') {
    throw new TypeError('"alphabet" must be a string.');
  }
  if(maxline !== undefined && typeof maxline !== 'number') {
    throw new TypeError('"maxline" must be a number.');
  }
  if(input.length === 0) {
    return '';
  }

  let output = '';

  let i = 0;
  const base = alphabet.length;
  const first = alphabet.charAt(0);
  const digits = [0];
  for(i = 0; i < input.length; ++i) {
    let carry = input[i];
    for(let j = 0; j < digits.length; ++j) {
      carry += digits[j] << 8;
      digits[j] = carry % base;
      carry = (carry / base) | 0;
    }

    while(carry > 0) {
      digits.push(carry % base);
      carry = (carry / base) | 0;
    }
  }

  // deal with leading zeros
  for(i = 0; input[i] === 0 && i < input.length - 1; ++i) {
    output += first;
  }
  // convert digits to a string
  for(i = digits.length - 1; i >= 0; --i) {
    output += alphabet[digits[i]];
  }

  if(maxline) {
    const regex = new RegExp('.{1,' + maxline + '}', 'g');
    output = output.match(regex).join('\r\n');
  }

  return output;
}

/**
 * Decodes a baseN-encoded (using the given alphabet) string to a
 * Uint8Array.
 *
 * @param {string} input - The baseN-encoded input string.
 * @param {string} alphabet - The alphabet to use for decoding.
 *
 * @returns {Uint8Array} The decoded bytes in a Uint8Array.
 */
function decode$2(input, alphabet) {
  if(typeof input !== 'string') {
    throw new TypeError('"input" must be a string.');
  }
  if(typeof alphabet !== 'string') {
    throw new TypeError('"alphabet" must be a string.');
  }
  if(input.length === 0) {
    return new Uint8Array();
  }

  let table = _reverseAlphabets[alphabet];
  if(!table) {
    // compute reverse alphabet
    table = _reverseAlphabets[alphabet] = [];
    for(let i = 0; i < alphabet.length; ++i) {
      table[alphabet.charCodeAt(i)] = i;
    }
  }

  // remove whitespace characters
  input = input.replace(/\s/g, '');

  const base = alphabet.length;
  const first = alphabet.charAt(0);
  const bytes = [0];
  for(let i = 0; i < input.length; i++) {
    const value = table[input.charCodeAt(i)];
    if(value === undefined) {
      return;
    }

    let carry = value;
    for(let j = 0; j < bytes.length; ++j) {
      carry += bytes[j] * base;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }

    while(carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }

  // deal with leading zeros
  for(let k = 0; input[k] === first && k < input.length - 1; ++k) {
    bytes.push(0);
  }

  return new Uint8Array(bytes.reverse());
}

/*!
 * Copyright (c) 2019-2022 Digital Bazaar, Inc. All rights reserved.
 */

// base58 characters (Bitcoin alphabet)
const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function encode$1(input, maxline) {
  return encode$2(input, alphabet, maxline);
}

function decode$1(input) {
  return decode$2(input, alphabet);
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

// this class is used to encode a multibase encoded value in CBOR-LD, which
// actually means transforming bytes to a multibase-encoded string
class MultibaseDecoder extends CborldDecoder {
  decode({value} = {}) {
    const {buffer, byteOffset, length} = value;
    const suffix = new Uint8Array(buffer, byteOffset + 1, length - 1);
    if(value[0] === 0x7a) {
      // 0x7a === 'z' (multibase code for base58btc)
      return `z${encode$1(suffix)}`;
    }
    if(value[0] === 0x4d) {
      // 0x4d === 'M' (multibase code for base64pad)
      return `M${gBase64.fromUint8Array(suffix)}`;
    }
    return value;
  }

  static createDecoder({value} = {}) {
    if(!(value instanceof Uint8Array)) {
      return false;
    }
    // supported multibase encodings:
    // 0x7a === 'z' (multibase code for base58btc)
    // 0x4d === 'M' (multibase code for base64pad)
    if(value[0] === 0x7a || value[0] === 0x4d) {
      return new MultibaseDecoder();
    }
  }
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
const KEYWORDS = new Map([
  // ordered is important, do not change
  ['@context', 0],
  ['@type', 2],
  ['@id', 4],
  ['@value', 6],
  // alphabetized after `@context`, `@type`, `@id`, `@value`
  // IDs <= 24 represented with 1 byte, IDs > 24 use 2+ bytes
  ['@direction', 8],
  ['@graph', 10],
  ['@included', 12],
  ['@index', 14],
  ['@json', 16],
  ['@language', 18],
  ['@list', 20],
  ['@nest', 22],
  ['@reverse', 24],
  // TODO: remove these? these only appear in frames and contexts
  ['@base', 26],
  ['@container', 28],
  ['@default', 30],
  ['@embed', 32],
  ['@explicit', 34],
  ['@none', 36],
  ['@omitDefault', 38],
  ['@prefix', 40],
  ['@preserve', 42],
  ['@protected', 44],
  ['@requireAll', 46],
  ['@set', 48],
  ['@version', 50],
  ['@vocab', 52]
]);
const FIRST_CUSTOM_TERM_ID = 100;

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

const MAX_CONTEXT_URLS = 10;

class Transformer {
  /**
   * Creates a new Transformer for transforming CBOR-LD <=> JSON-LD.
   *
   * @param {object} options - The options to use when encoding to CBOR-LD.
   * @param {documentLoaderFunction} options.documentLoader -The document
   *   loader to use when resolving JSON-LD Context URLs.
   * @param {Map} [options.appContextMap] - A map of JSON-LD Context URLs and
   *   their encoded CBOR-LD values (must be values greater than 32767
   *   (0x7FFF)).
   * @param {boolean} [options.compressionModeUndefinedTermAllowed] - Allow the
   *   JSON-LD document to contain terms that are not defined in the context.
   *   The original values of the undefined terms will be preserved during
   *   compression. Defaults to `false`, every key that does not have a defined
   *   term will raise an error.
   */
  constructor({appContextMap, documentLoader,
    compressionModeUndefinedTermAllowed} = {}) {
    this.appContextMap = appContextMap;
    this.documentLoader = documentLoader;
    this.compressionModeUndefinedTermAllowed =
      compressionModeUndefinedTermAllowed;
  }

  // default no-op hook functions
  _beforeObjectContexts() {}
  _afterObjectContexts() {}
  _beforeTypeScopedContexts() {}

  async _transform({obj, transformMap, contextStack = []}) {
    // hook before object contexts are applied
    this._beforeObjectContexts({obj, transformMap});

    // apply embedded contexts in the object
    let activeCtx = await this._applyEmbeddedContexts({obj, contextStack});

    // hook after object contexts are applied
    this._afterObjectContexts({obj, transformMap});

    // TODO: support `@propagate: true` on type-scoped contexts; until then
    // throw an error if it is set

    // preserve context stack before applying type-scoped contexts
    const childContextStack = contextStack.slice();

    // hook before type-scoped contexts are applied
    this._beforeTypeScopedContexts({activeCtx, obj, transformMap});

    // apply type-scoped contexts
    activeCtx = await this._applyTypeScopedContexts({obj, contextStack});

    // walk term entries to transform
    const {aliases, scopedContextMap, termMap} = activeCtx;
    const termEntries = this._getEntries(
      {obj, transformMap, transformer: this, termMap});
    for(const [termInfo, value] of termEntries) {
      const {term} = termInfo;

      // transform `@id`
      if(term === '@id' || aliases.id.has(term)) {
        this._transformObjectId({obj, transformMap, termInfo, value});
        continue;
      }

      // transform `@type`
      if(term === '@type' || aliases.type.has(term)) {
        this._transformObjectType({obj, transformMap, termInfo, value});
        continue;
      }

      // use `childContextStack` when processing properties as it will remove
      // type-scoped contexts unless a property-scoped context is applied
      let propertyContextStack = childContextStack;

      // apply any property-scoped context
      let newActiveCtx;
      const propertyScopedContext = scopedContextMap.get(term);
      if(propertyScopedContext) {
        // TODO: support `@propagate: false` on property-scoped contexts; until
        // then throw an error if it is set
        newActiveCtx = await this._applyEmbeddedContexts({
          obj: {'@context': propertyScopedContext},
          contextStack
        });
        propertyContextStack = contextStack.slice();
      }

      // iterate through all values for the current transform entry
      const {plural, def} = termInfo;
      const termType = this._getTermType(
        {activeCtx: newActiveCtx || activeCtx, def});
      const values = plural ? value : [value];
      const entries = [];
      for(const value of values) {
        // `null` is never transformed
        if(value === null) {
          entries.push(null);
          continue;
        }

        // try to transform typed value
        if(this._transformTypedValue({entries, termType, value, termInfo})) {
          continue;
        }

        if(typeof value !== 'object') {
          // value not transformed and cannot recurse, so do not transform
          entries.push(value);
          continue;
        }

        // transform array
        if(Array.isArray(value)) {
          await this._transformArray(
            {entries, contextStack: propertyContextStack, value});
          continue;
        }

        // transform object
        await this._transformObject({
          entries, contextStack: propertyContextStack, value});
      }

      // revert property-scoped active context if one was created
      if(newActiveCtx) {
        newActiveCtx.revert();
      }

      this._assignEntries({entries, obj, transformMap, termInfo});
    }

    // revert active context for this object
    activeCtx.revert();
  }

  /**
   * Apply the embedded contexts in the given object to produce an
   * active context.
   *
   * @param {object} options - The options to use.
   * @param {object} options.obj - The object to get the active context for.
   * @param {Array} [options.contextStack] - The stack of active contexts.
   *
   * @returns {Promise<object>} - The active context instance.
   */
  async _applyEmbeddedContexts({obj, contextStack}) {
    const stackTop = contextStack.length;

    // push any local embedded contexts onto the context stack
    const localContexts = obj['@context'];
    await this._updateContextStack({contextStack, contexts: localContexts});

    // get `id` and `type` aliases for the active context
    let active = contextStack[contextStack.length - 1];
    if(!active) {
      // empty initial context
      active = {
        aliases: {
          id: new Set(),
          type: new Set()
        },
        context: {},
        scopedContextMap: new Map(),
        termMap: new Map()
      };
    }

    return {
      ...active,
      revert() {
        contextStack.length = stackTop;
      }
    };
  }

  async _applyTypeScopedContexts({obj, contextStack}) {
    const stackTop = contextStack.length;

    // get `id` and `type` aliases for the active context
    let active = contextStack[contextStack.length - 1];
    if(!active) {
      // empty initial context
      active = {
        aliases: {
          id: new Set(),
          type: new Set()
        },
        context: {},
        scopedContextMap: new Map(),
        termMap: new Map()
      };
    }
    const {aliases} = active;

    // get unique object type(s)
    let totalTypes = [];
    const typeTerms = ['@type', ...aliases.type];
    for(const term of typeTerms) {
      const types = obj[term];
      if(Array.isArray(types)) {
        totalTypes.push(...types);
      } else {
        totalTypes.push(types);
      }
    }
    // apply types in lexicographically sorted order (per JSON-LD spec)
    totalTypes = [...new Set(totalTypes)].sort();

    // apply any type-scoped contexts
    let {scopedContextMap} = active;
    for(const type of totalTypes) {
      const contexts = scopedContextMap.get(type);
      if(contexts) {
        await this._updateContextStack({contextStack, contexts});
        active = contextStack[contextStack.length - 1];
        ({scopedContextMap} = active);
      }
    }

    return {
      ...active,
      revert() {
        contextStack.length = stackTop;
      }
    };
  }

  async _updateContextStack({contextStack, contexts, transformer,
    cycles = new Set()}) {
    // push any localized contexts onto the context stack
    if(!contexts) {
      return;
    }
    if(!Array.isArray(contexts)) {
      contexts = [contexts];
    }

    const {contextMap} = this;
    for(const context of contexts) {
      let entry = contextMap.get(context);
      if(!entry) {
        let ctx = context;
        let contextUrl;
        if(typeof context === 'string') {
          // check for context URL cycle
          if(cycles.has(context)) {
            throw new CborldError(
              'ERR_CYCLICAL_CONTEXT_URL',
              `Cyclical @context URL '${context}' was detected.`);
          }

          // check for max context URLs fetched during a resolve operation
          if(cycles.size > MAX_CONTEXT_URLS) {
            throw new CborldError(
              'ERR_EXCEEDED_MAX_CONTEXT_URLS',
              'Maximum number of @context URLs exceeded.');
          }

          // fetch context
          contextUrl = context;
          ({'@context': ctx} = await this._getDocument({url: contextUrl}));
        }

        // support parsing context lists recursively. only top-level @context or
        // or remote context can be an array based on the JSON-LD spec.
        if(Array.isArray(ctx) || typeof ctx === 'string') {

          // track cycles
          const branch = new Set(cycles.values());
          branch.add(context);

          await this._updateContextStack({
            contextStack,
            contexts: ctx,
            cycles: branch
          });
          continue;
        }

        // FIXME: validate `ctx` to ensure its a valid JSON-LD context value
        // add context
        entry = await this._addContext({context: ctx, contextUrl, transformer});
      }

      // clone entry to create new active context entry for context stack
      const newActive = {
        aliases: {
          id: new Set(entry.aliases.id),
          type: new Set(entry.aliases.type)
        },
        context,
        scopedContextMap: new Map(entry.scopedContextMap),
        termMap: new Map(entry.termMap)
      };

      // push new active context and get old one
      const oldActive = contextStack[contextStack.length - 1];
      contextStack.push(newActive);
      if(!oldActive) {
        continue;
      }

      // compute `id` and `type` aliases by including any previous aliases that
      // have not been replaced by the new context
      const {aliases, termMap} = newActive;
      for(const key of ['id', 'type']) {
        for(const alias of oldActive.aliases[key]) {
          if(!(context[alias] === null || newActive.termMap.has(alias))) {
            aliases[key].add(alias);
          }
        }
      }

      // compute scoped context map by including any scoped contexts that have
      // not been replaced by the new context
      const {scopedContextMap} = newActive;
      for(const [key, value] of oldActive.scopedContextMap) {
        if(!(context[key] === null || scopedContextMap.has(key))) {
          scopedContextMap.set(key, value);
        }
      }

      // compute new terms map
      for(const [key, value] of oldActive.termMap) {
        if(!(context[key] === null || termMap.has(key))) {
          termMap.set(key, value);
        }
      }
    }
  }

  async _addContext({context, contextUrl}) {
    const {contextMap, termToId, idToTerm} = this;

    // handle `@import`
    const importUrl = context['@import'];
    if(importUrl) {
      let importEntry = contextMap.get(importUrl);
      if(!importEntry) {
        const {'@context': importCtx} = await this._getDocument(
          {url: importUrl});
        importEntry = await this._addContext(
          {context: importCtx, contextUrl: importUrl});
      }
      context = {...importEntry.context, ...context};
    }

    // precompute any `@id` and `@type` aliases, scoped contexts, and terms
    const scopedContextMap = new Map();
    const termMap = new Map();
    const entry = {
      aliases: {id: new Set(), type: new Set()},
      context,
      scopedContextMap,
      termMap
    };

    // process context keys in sorted order to ensure term IDs are assigned
    // consistently
    const keys = Object.keys(context).sort();
    for(const key of keys) {
      const def = context[key];
      if(!def) {
        continue;
      }
      if(def === '@id' || def.id === '@id') {
        entry.aliases.id.add(key);
      } else if(def === '@type' || def.id === '@type') {
        entry.aliases.type.add(key);
      }
      if(KEYWORDS.has(key)) {
        // skip keywords
        continue;
      }
      // ensure the term has been assigned an ID
      if(!termToId.has(key)) {
        const id = this.nextTermId;
        this.nextTermId += 2;
        termToId.set(key, id);
        if(idToTerm) {
          idToTerm.set(id, key);
        }
      }
      termMap.set(key, def);
      const scopedContext = def['@context'];
      if(scopedContext) {
        scopedContextMap.set(key, scopedContext);
      }
    }

    // add entry for context URL or context object
    contextMap.set(contextUrl || context, entry);

    return entry;
  }

  async _getDocument({url}) {
    const {document} = await this.documentLoader(url);
    if(typeof document === 'string') {
      return JSON.parse(document);
    }
    return document;
  }

  _getTermType({activeCtx, def}) {
    const {'@type': type} = def || {};
    if(!type) {
      // no term type
      return;
    }

    // check for potential CURIE value
    const [prefix, ...suffix] = type.split(':');
    const prefixDef = activeCtx.termMap.get(prefix);
    if(prefixDef === undefined) {
      // no CURIE
      return type;
    }

    // handle CURIE
    if(typeof prefixDef === 'string') {
      return prefixDef + suffix.join(':');
    }

    // prefix definition must be an object
    if(!(typeof prefixDef === 'object' &&
      typeof prefixDef['@id'] === 'string')) {
      throw new CborldError(
        'ERR_INVALID_TERM_DEFINITION',
        'JSON-LD term definitions must be strings or objects with "@id".');
    }
    return prefixDef['@id'] + suffix.join(':');
  }

  _getIdForTerm({term, plural}) {
    const id = this.termToId.get(term);
    if(id === undefined) {
      // preserve the original term key if undefined terms are allowed
      if(this.compressionModeUndefinedTermAllowed) {
        return term;
      }
      throw new CborldError(
        'ERR_UNDEFINED_TERM',
        'CBOR-LD compression requires all terms to be defined in a JSON-LD ' +
        'context.');
    }
    return plural ? id + 1 : id;
  }

  _getTermForId({id}) {
    const plural = (id & 1) === 1;
    const term = this.idToTerm.get(plural ? id - 1 : id);
    return {term, plural};
  }
}

/**
 * Fetches a resource given a URL and returns it as a string.
 *
 * @callback documentLoaderFunction
 * @param {string} url - The URL to retrieve.
 *
 * @returns {string} The resource associated with the URL as a string.
 */

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

const ID_TO_SCHEME = new Map([
  // Note: only v1 mainnet is supported
  [1024, 'did:v1:nym:'],
  [1025, 'did:key:']
]);

class Base58DidUrlDecoder extends CborldDecoder {
  decode({value} = {}) {
    let url = ID_TO_SCHEME.get(value[0]);
    if(typeof value[1] === 'string') {
      url += value[1];
    } else {
      url += `z${encode$1(value[1])}`;
    }
    if(value.length > 2) {
      if(typeof value[2] === 'string') {
        url += `#${value[2]}`;
      } else {
        url += `#z${encode$1(value[2])}`;
      }
    }
    return url;
  }

  static createDecoder({value} = {}) {
    if(!(Array.isArray(value) && value.length > 1 && value.length <= 3)) {
      return false;
    }
    if(!ID_TO_SCHEME.has(value[0])) {
      return false;
    }
    return new Base58DidUrlDecoder();
  }
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

class HttpUrlDecoder extends CborldDecoder {
  constructor({secure} = {}) {
    super();
    this.secure = secure;
  }

  decode({value} = {}) {
    const scheme = this.secure ? 'https://' : 'http://';
    return `${scheme}${value[1]}`;
  }

  static createDecoder({value} = {}) {
    if(!(value.length === 2 && typeof value[1] === 'string')) {
      return false;
    }
    return new HttpUrlDecoder({secure: value[0] === 2});
  }
}

var REGEX = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;

function validate(uuid) {
  return typeof uuid === 'string' && REGEX.test(uuid);
}

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */

var byteToHex = [];

for (var i = 0; i < 256; ++i) {
  byteToHex.push((i + 0x100).toString(16).substr(1));
}

function stringify(arr) {
  var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  // Note: Be careful editing this code!  It's been tuned for performance
  // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
  var uuid = (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase(); // Consistency check for valid UUID.  If this throws, it's likely due to one
  // of the following:
  // - One or more input array values don't map to a hex octet (leading to
  // "undefined" in the uuid)
  // - Invalid input values for the RFC `version` or `variant` fields

  if (!validate(uuid)) {
    throw TypeError('Stringified UUID is invalid');
  }

  return uuid;
}

function parse(uuid) {
  if (!validate(uuid)) {
    throw TypeError('Invalid UUID');
  }

  var v;
  var arr = new Uint8Array(16); // Parse ########-....-....-....-............

  arr[0] = (v = parseInt(uuid.slice(0, 8), 16)) >>> 24;
  arr[1] = v >>> 16 & 0xff;
  arr[2] = v >>> 8 & 0xff;
  arr[3] = v & 0xff; // Parse ........-####-....-....-............

  arr[4] = (v = parseInt(uuid.slice(9, 13), 16)) >>> 8;
  arr[5] = v & 0xff; // Parse ........-....-####-....-............

  arr[6] = (v = parseInt(uuid.slice(14, 18), 16)) >>> 8;
  arr[7] = v & 0xff; // Parse ........-....-....-####-............

  arr[8] = (v = parseInt(uuid.slice(19, 23), 16)) >>> 8;
  arr[9] = v & 0xff; // Parse ........-....-....-....-############
  // (Use "/" to avoid 32-bit truncation when bit-shifting high-order bytes)

  arr[10] = (v = parseInt(uuid.slice(24, 36), 16)) / 0x10000000000 & 0xff;
  arr[11] = v / 0x100000000 & 0xff;
  arr[12] = v >>> 24 & 0xff;
  arr[13] = v >>> 16 & 0xff;
  arr[14] = v >>> 8 & 0xff;
  arr[15] = v & 0xff;
  return arr;
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

class UuidUrnDecoder extends CborldDecoder {
  decode({value} = {}) {
    const uuid = typeof value[1] === 'string' ?
      value[1] : stringify(value[1]);
    return `urn:uuid:${uuid}`;
  }

  static createDecoder({value} = {}) {
    if(value.length === 2 &&
      (typeof value[1] === 'string' || value[1] instanceof Uint8Array)) {
      return new UuidUrnDecoder();
    }
  }
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

const SCHEME_ID_TO_DECODER = new Map([
  [1, HttpUrlDecoder],
  [2, HttpUrlDecoder],
  [3, UuidUrnDecoder],
  [1024, Base58DidUrlDecoder],
  [1025, Base58DidUrlDecoder]
]);

class UriDecoder extends CborldDecoder {
  static createDecoder({value} = {}) {
    if(!(Array.isArray(value) || value.length > 1)) {
      return false;
    }

    const DecoderClass = SCHEME_ID_TO_DECODER.get(value[0]);
    return DecoderClass && DecoderClass.createDecoder({value});
  }
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

class VocabTermDecoder extends CborldDecoder {
  constructor({term} = {}) {
    super();
    this.term = term;
  }

  decode() {
    return this.term;
  }

  static createDecoder({value, transformer} = {}) {
    if(Array.isArray(value)) {
      return UriDecoder.createDecoder({value, transformer});
    }
    const term = transformer.idToTerm.get(value);
    if(term !== undefined) {
      return new VocabTermDecoder({term});
    }
  }
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

class XsdDateDecoder extends CborldDecoder {
  decode({value} = {}) {
    const dateString = new Date(value * 1000).toISOString();
    return dateString.substring(0, dateString.indexOf('T'));
  }

  static createDecoder({value} = {}) {
    if(typeof value === 'number') {
      return new XsdDateDecoder();
    }
  }
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

class XsdDateTimeDecoder extends CborldDecoder {
  constructor({value} = {}) {
    super();
    this.value = value;
  }

  decode({value} = {}) {
    if(typeof value === 'number') {
      return new Date(value * 1000).toISOString().replace('.000Z', 'Z');
    }
    return new Date(value[0] * 1000 + value[1]).toISOString();
  }

  static createDecoder({value} = {}) {
    if(typeof value === 'number') {
      return new XsdDateTimeDecoder();
    }
    if(Array.isArray(value) && value.length === 2 &&
      (typeof value[0] === 'number' || typeof value[1] === 'number')) {
      return new XsdDateTimeDecoder();
    }
  }
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

const TYPE_DECODERS = new Map([
  ['@id', UriDecoder],
  ['@vocab', VocabTermDecoder],
  ['https://w3id.org/security#multibase', MultibaseDecoder],
  ['http://www.w3.org/2001/XMLSchema#date', XsdDateDecoder],
  ['http://www.w3.org/2001/XMLSchema#dateTime', XsdDateTimeDecoder]
]);

const CONTEXT_TERM_ID$1 = KEYWORDS.get('@context');
const CONTEXT_TERM_ID_PLURAL$1 = CONTEXT_TERM_ID$1 + 1;

class Decompressor extends Transformer {
  /**
   * Creates a new Decompressor for generating a JSON-LD document from
   * compressed CBOR-LD. The created instance may only be used on a single
   * CBOR-LD input at a time.
   *
   * @param {object} options - The options to use when encoding to CBOR-LD.
   * @param {documentLoaderFunction} options.documentLoader - The document
   *   loader to use when resolving JSON-LD Context URLs.
   * @param {Map} [options.appContextMap] - A map of JSON-LD Context URLs and
   *   their encoded CBOR-LD values (must be values greater than 32767
   *   (0x7FFF)).
   * @param {boolean} [options.compressionModeUndefinedTermAllowed] - Allow the
   *   JSON-LD document to contain terms that are not defined in the context.
   *   The original values of terms that cannot be resolved from the context map
   *   will be preserved. Defaults to `false`, every key that does not have a
   *   defined term will raise an error.
   */
  constructor({documentLoader, appContextMap,
    compressionModeUndefinedTermAllowed} = {}) {
    super({documentLoader, appContextMap, compressionModeUndefinedTermAllowed});
    this.reverseAppContextMap = new Map();
    // build reverse contxt map
    if(appContextMap) {
      for(const [k, v] of appContextMap) {
        this.reverseAppContextMap.set(v, k);
      }
    }
  }

  /**
   * Decompresses the given CBOR-LD byte array to a JSON-LD document.
   *
   * @param {object} options - The options to use.
   * @param {Uint8Array} options.compressedBytes - The CBOR-LD compressed
   *   bytes that follow the compressed CBOR-LD CBOR tag.
   * @param {diagnosticFunction} [options.diagnose] - A function that, if
   *   provided, is called with diagnostic information.
   *
   * @returns {Promise<object>} - The JSON-LD document.
   */
  async decompress({compressedBytes, diagnose} = {}) {
    this.contextMap = new Map();
    this.termToId = new Map(KEYWORDS);
    this.nextTermId = FIRST_CUSTOM_TERM_ID;
    this.idToTerm = new Map();
    for(const [term, id] of this.termToId) {
      this.idToTerm.set(id, term);
    }

    // decoded output could be one or more transform maps
    const transformMap = decode$4(compressedBytes, {useMaps: true});
    if(diagnose) {
      diagnose('Diagnostic CBOR-LD decompression transform map(s):');
      diagnose(util.inspect(transformMap, {depth: null, colors: true}));
    }

    // handle single or multiple JSON-LD docs
    const results = [];
    const isArray = Array.isArray(transformMap);
    const transformMaps = isArray ? transformMap : [transformMap];
    for(const transformMap of transformMaps) {
      const obj = {};
      await this._transform({obj, transformMap});
      results.push(obj);
    }
    return isArray ? results : results[0];
  }

  _beforeObjectContexts({obj, transformMap}) {
    // decode `@context` for `transformMap`, if any
    const encodedContext = transformMap.get(CONTEXT_TERM_ID$1);
    if(encodedContext) {
      const decoder = ContextDecoder.createDecoder(
        {value: encodedContext, transformer: this});
      obj['@context'] = decoder ?
        decoder.decode({value: encodedContext}) : encodedContext;
    }
    const encodedContexts = transformMap.get(CONTEXT_TERM_ID_PLURAL$1);
    if(encodedContexts) {
      if(encodedContext) {
        // can't use *both* the singular and plural context term ID
        throw new CborldError(
          'ERR_INVALID_ENCODED_CONTEXT',
          'Both singular and plural context IDs were found in the ' +
          'CBOR-LD input.');
      }
      if(!Array.isArray(encodedContexts)) {
        // `encodedContexts` must be an array
        throw new CborldError(
          'ERR_INVALID_ENCODED_CONTEXT',
          'Encoded plural context value must be an array.');
      }
      const entries = [];
      for(const value of encodedContexts) {
        const decoder = ContextDecoder.createDecoder(
          {value, transformer: this});
        entries.push(decoder ? decoder.decode({value}) : value);
      }
      obj['@context'] = entries;
    }
  }

  _beforeTypeScopedContexts({activeCtx, obj, transformMap}) {
    // decode object types
    const {termToId} = this;
    const typeTerms = ['@type', ...activeCtx.aliases.type];
    for(const term of typeTerms) {
      // check both singular and plural term IDs
      const termId = termToId.get(term);
      let value = transformMap.get(termId);
      if(value === undefined) {
        value = transformMap.get(termId + 1);
      }
      if(value !== undefined) {
        if(Array.isArray(value)) {
          obj[term] = value.map(value => {
            const decoder = VocabTermDecoder.createDecoder(
              {value, transformer: this});
            return decoder ? decoder.decode({value}) : value;
          });
        } else {
          const decoder = VocabTermDecoder.createDecoder(
            {value, transformer: this});
          obj[term] = decoder ? decoder.decode({value}) : value;
        }
      }
    }
  }

  _getEntries({transformMap, termMap}) {
    // get term entries to be transformed and sort by *term* to ensure term
    // IDs will be assigned in the same order that the compressor assigned them
    const entries = [];
    for(const [key, value] of transformMap) {
      // skip `@context`; not a term entry
      if(key === CONTEXT_TERM_ID$1 || key === CONTEXT_TERM_ID_PLURAL$1) {
        continue;
      }

      // check for undefined term IDs
      const {term, plural} = this._getTermForId({id: key});
      if(term === undefined && !this.compressionModeUndefinedTermAllowed) {
        throw new CborldError(
          'ERR_UNKNOWN_CBORLD_TERM_ID',
          `Unknown term ID '${key}' was detected in the CBOR-LD input.`);
      }

      // preserve the original term key if undefined terms are allowed
      if(term === undefined && this.compressionModeUndefinedTermAllowed) {
        if(typeof key !== 'string') {
          throw new CborldError(
            'ERR_UNKNOWN_CBORLD_TERM_ID',
            `Unknown term ID "${key}" was detected in the CBOR-LD input. ` +
              `Expected term key to be a string for undefined terms when ` +
              `"compressionModeUndefinedTermAllowed" is enabled. The JSON-LD ` +
              `document must also be encoded with the same policy.`);
        }
        entries.push([{
          term: key,
          termId: key,
          plural: Array.isArray(value),
          def: {'@type': undefined}
        }, value]);
        continue;
      }

      // check for undefined term
      const def = termMap.get(term);
      if(def === undefined && !(term.startsWith('@') && KEYWORDS.has(term))) {
        throw new CborldError(
          'ERR_UNKNOWN_CBORLD_TERM',
          `Unknown term "${term}" was detected in the CBOR-LD input.`);
      }

      entries.push([{term, termId: key, plural, def}, value]);
    }
    return entries.sort(_sortEntriesByTerm);
  }

  _getTermInfo({termMap, key}) {
    // check for undefined term IDs
    const {term, plural} = this._getTermForId({id: key});
    if(term === undefined) {
      throw new CborldError(
        'ERR_UNKNOWN_CBORLD_TERM_ID',
        `Unknown term ID '${key}' was detected in the CBOR-LD input.`);
    }

    // check for undefined term
    const def = termMap.get(term);
    if(def === undefined && !(term.startsWith('@') && KEYWORDS.has(term))) {
      throw new CborldError(
        'ERR_UNKNOWN_CBORLD_TERM',
        `Unknown term "${term}" was detected in the CBOR-LD input.`);
    }

    return {term, termId: key, plural, def};
  }

  _transformObjectId({obj, termInfo, value}) {
    const decoder = UriDecoder.createDecoder({value});
    obj[termInfo.term] = decoder ? decoder.decode({value}) : value;
  }

  _transformObjectType({obj, termInfo, value}) {
    const {term, plural} = termInfo;
    const values = plural ? value : [value];
    const entries = [];
    for(const value of values) {
      const decoder = VocabTermDecoder.createDecoder(
        {value, transformer: this});
      entries.push(decoder ? decoder.decode({value}) : value);
    }
    obj[term] = plural ? entries : entries[0];
  }

  _transformTypedValue({entries, termType, value}) {
    const DecoderClass = TYPE_DECODERS.get(termType);
    const decoder = DecoderClass && DecoderClass.createDecoder(
      {value, transformer: this});
    if(decoder) {
      entries.push(decoder.decode({value}));
      return true;
    }
  }

  async _transformArray({entries, contextStack, value}) {
    // recurse into array
    const children = [];
    for(const transformMap of value) {
      const obj = {};
      children.push(obj);
      await this._transform({obj, transformMap, contextStack});
    }
    entries.push(children);
  }

  async _transformObject({entries, contextStack, value}) {
    // recurse into object
    const child = {};
    entries.push(child);
    return this._transform({obj: child, transformMap: value, contextStack});
  }

  _assignEntries({entries, obj, termInfo}) {
    const {term, plural} = termInfo;
    obj[term] = plural ? entries : entries[0];
  }
}

function _sortEntriesByTerm([{term: t1}], [{term: t2}]) {
  return t1 < t2 ? -1 : t1 > t2 ? 1 : 0;
}

/**
 * Fetches a resource given a URL and returns it as a string.
 *
 * @callback documentLoaderFunction
 * @param {string} url - The URL to retrieve.
 *
 * @returns {string} The resource associated with the URL as a string.
 */

/**
 * A diagnostic function that is called with diagnostic information. Typically
 * set to `console.log` when debugging.
 *
 * @callback diagnosticFunction
 * @param {string} message - The diagnostic message.
 */

/*!
 * Copyright (c) 2020-2021 Digital Bazaar, Inc. All rights reserved.
 */

/**
 * Decodes a CBOR-LD byte array into a JSON-LD document.
 *
 * @param {object} options - The options to use when decoding CBOR-LD.
 * @param {Uint8Array} options.cborldBytes - The encoded CBOR-LD bytes to
 *   decode.
 * @param {Function} options.documentLoader -The document loader to use when
 *   resolving JSON-LD Context URLs.
 * @param {Map} [options.appContextMap] - A map of JSON-LD Context URLs and
 *   their associated CBOR-LD values. The values must be greater than
 *   32767 (0x7FFF)).
 * @param {boolean} [options.compressionModeUndefinedTermAllowed] - Allow the
 *   JSON-LD document to contain terms that are not defined in the context. The
 *   original values of terms that cannot be resolved from the context map will
 *   be preserved. Defaults to `false`, every key that does not have a defined
 *   term will raise an error.
 * @param {diagnosticFunction} [options.diagnose] - A function that, if
 *   provided, is called with diagnostic information.
 *
 * @returns {Promise<object>} - The decoded JSON-LD Document.
 */
async function decode({
  cborldBytes, documentLoader, appContextMap = new Map(),
  compressionModeUndefinedTermAllowed = false, diagnose
}) {
  if(!(cborldBytes instanceof Uint8Array)) {
    throw new TypeError('"cborldBytes" must be a Uint8Array.');
  }

  // 0xd9 == 11011001
  // 110 = CBOR major type 6
  // 11001 = 25, 16-bit tag size (65536 possible values)
  let index = 0;
  if(cborldBytes[index++] !== 0xd9) {
    throw new CborldError(
      'ERR_NOT_CBORLD',
      'CBOR-LD must start with a CBOR major type "Tag" header of `0xd9`.');
  }

  // ensure `cborldBytes` represent CBOR-LD
  if(cborldBytes[index++] !== 0x05) {
    throw new CborldError(
      'ERR_NOT_CBORLD', 'CBOR-LD 16-bit tag must start with `0x05`.');
  }

  const compressionMode = cborldBytes[index];
  if(compressionMode === undefined) {
    throw new CborldError(
      'ERR_NOT_CBORLD', 'Truncated CBOR-LD 16-bit tag.');
  }

  if(!(compressionMode === 0 || compressionMode === 1)) {
    throw new CborldError(
      'ERR_NOT_CBORLD',
      `Unsupported CBOR-LD compression mode "${compressionMode}".`);
  }

  index++;
  const {buffer, byteOffset, length} = cborldBytes;
  const suffix = new Uint8Array(buffer, byteOffset + index, length - index);

  // handle uncompressed CBOR-LD
  if(compressionMode === 0) {
    return decode$4(suffix, {useMaps: false});
  }

  // decompress CBOR-LD
  const decompressor = new Decompressor(
    {documentLoader, appContextMap, compressionModeUndefinedTermAllowed});
  const result = await decompressor.decompress(
    {compressedBytes: suffix, diagnose});

  if(diagnose) {
    diagnose('Diagnostic JSON-LD result:');
    diagnose(util.inspect(result, {depth: null, colors: true}));
  }

  return result;
}

/**
 * A diagnostic function that is called with diagnostic information. Typically
 * set to `console.log` when debugging.
 *
 * @callback diagnosticFunction
 * @param {string} message - The diagnostic message.
 */

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
class CborldEncoder {
  encode() {
    throw new Error('Must be implemented by derived class.');
  }

  // eslint-disable-next-line no-unused-vars
  static createEncoder({value} = {}) {
    throw new Error('Must be implemented by derived class.');
  }
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

class ContextEncoder extends CborldEncoder {
  constructor({context, appContextMap} = {}) {
    super();
    this.context = context;
    this.appContextMap = appContextMap;
  }

  encode() {
    const {context} = this;
    const id = URL_TO_ID.get(context) || this.appContextMap.get(context);
    if(id === undefined) {
      return new Token(Type.string, context);
    }
    return new Token(Type.uint, id);
  }

  static createEncoder({value, transformer} = {}) {
    if(typeof value !== 'string') {
      return false;
    }
    const {appContextMap} = transformer;
    return new ContextEncoder({context: value, appContextMap});
  }
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

// this class is used to encode a multibase encoded value in CBOR-LD, which
// actually means transforming a multibase-encoded string to bytes
class MultibaseEncoder extends CborldEncoder {
  constructor({value} = {}) {
    super();
    this.value = value;
  }

  encode() {
    const {value} = this;

    let prefix;
    let suffix;
    if(value[0] === 'z') {
      // 0x7a === 'z' (multibase code for base58btc)
      prefix = 0x7a;
      suffix = decode$1(value.substr(1));
    } else if(value[0] === 'M') {
      // 0x4d === 'M' (multibase code for base64pad)
      prefix = 0x4d;
      suffix = gBase64.toUint8Array(value.substr(1));
    }

    const bytes = new Uint8Array(1 + suffix.length);
    bytes[0] = prefix;
    bytes.set(suffix, 1);
    return new Token(Type.bytes, bytes);
  }

  static createEncoder({value} = {}) {
    if(typeof value !== 'string') {
      return false;
    }
    // supported multibase encodings:
    // 0x7a === 'z' (multibase code for base58btc)
    // 0x4d === 'M' (multibase code for base64pad)
    if(value[0] === 'z' || value[0] === 'M') {
      return new MultibaseEncoder({value});
    }
  }
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

const SCHEME_TO_ID = new Map([
  ['did:v1:nym:', 1024],
  ['did:key:', 1025]
]);

class Base58DidUrlEncoder extends CborldEncoder {
  constructor({value, scheme} = {}) {
    super();
    this.value = value;
    this.scheme = scheme;
  }

  encode() {
    const {value, scheme} = this;
    const suffix = value.substr(scheme.length);
    const [authority, fragment] = suffix.split('#');
    const entries = [
      new Token(Type.uint, SCHEME_TO_ID.get(scheme)),
      _multibase58ToToken(authority)
    ];
    if(fragment !== undefined) {
      entries.push(_multibase58ToToken(fragment));
    }
    return [new Token(Type.array, entries.length), entries];
  }

  static createEncoder({value} = {}) {
    const keys = [...SCHEME_TO_ID.keys()];
    for(const key of keys) {
      if(value.startsWith(key)) {
        return new Base58DidUrlEncoder({value, scheme: key});
      }
    }
  }
}

function _multibase58ToToken(str) {
  if(str.startsWith('z')) {
    const decoded = decode$1(str.substr(1));
    if(decoded) {
      return new Token(Type.bytes, decoded);
    }
  }
  // cannot compress
  return new Token(Type.string, str);
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

class HttpUrlEncoder extends CborldEncoder {
  constructor({value, secure} = {}) {
    super();
    this.value = value;
    this.secure = secure;
  }

  encode() {
    const {value, secure} = this;
    const length = secure ? 'https://'.length : 'http://'.length;
    const entries = [
      new Token(Type.uint, secure ? 2 : 1),
      new Token(Type.string, value.substr(length))
    ];
    return [new Token(Type.array, entries.length), entries];
  }

  static createEncoder({value} = {}) {
    // presume HTTPS is more common, check for it first
    if(value.startsWith('https://')) {
      return new HttpUrlEncoder({value, secure: true});
    }
    if(value.startsWith('http://')) {
      return new HttpUrlEncoder({value, secure: false});
    }
  }
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

class UuidUrnEncoder extends CborldEncoder {
  constructor({value} = {}) {
    super();
    this.value = value;
  }

  encode() {
    const {value} = this;
    const rest = value.substr('urn:uuid:'.length);
    const entries = [new Token(Type.uint, 3)];
    if(rest.toLowerCase() === rest) {
      const uuidBytes = parse(rest);
      entries.push(new Token(Type.bytes, uuidBytes));
    } else {
      // cannot compress
      entries.push(new Token(Type.string, rest));
    }
    return [new Token(Type.array, entries.length), entries];
  }

  static createEncoder({value} = {}) {
    if(value.startsWith('urn:uuid:')) {
      return new UuidUrnEncoder({value});
    }
  }
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

const SCHEME_TO_ENCODER = new Map([
  ['http', HttpUrlEncoder],
  ['https', HttpUrlEncoder],
  ['urn:uuid', UuidUrnEncoder],
  ['did:v1:nym', Base58DidUrlEncoder],
  ['did:key', Base58DidUrlEncoder]
]);

class UriEncoder extends CborldEncoder {
  static createEncoder({value} = {}) {
    if(typeof value !== 'string') {
      return false;
    }

    // get full colon-delimited prefix
    let scheme;
    try {
      // this handles URIs both with authority followed by `//` and without
      const {protocol, pathname} = new URL(value);
      scheme = protocol;
      if(pathname.includes(':')) {
        scheme += pathname;
      }
      const split = value.split(':');
      split.pop();
      scheme = split.join(':');
    } catch(e) {
      return false;
    }

    const EncoderClass = SCHEME_TO_ENCODER.get(scheme);
    return EncoderClass && EncoderClass.createEncoder({value});
  }
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

class VocabTermEncoder extends CborldEncoder {
  constructor({termId} = {}) {
    super();
    this.termId = termId;
  }

  encode() {
    return new Token(Type.uint, this.termId);
  }

  static createEncoder({value, transformer} = {}) {
    const {termToId} = transformer;
    const termId = termToId.get(value);
    if(termId !== undefined) {
      return new VocabTermEncoder({termId});
    }
    return UriEncoder.createEncoder({value});
  }
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

class XsdDateEncoder extends CborldEncoder {
  constructor({value, parsed} = {}) {
    super();
    this.value = value;
    this.parsed = parsed;
  }

  encode() {
    const {value, parsed} = this;
    const secondsSinceEpoch = Math.floor(parsed / 1000);
    const dateString = new Date(secondsSinceEpoch * 1000).toISOString();
    const expectedDate = dateString.substring(0, dateString.indexOf('T'));
    if(value !== expectedDate) {
      // compression would be lossy, do not compress
      return new Token(Type.string, value);
    }
    return new Token(Type.uint, secondsSinceEpoch);
  }

  static createEncoder({value} = {}) {
    if(value.includes('T')) {
      // time included, cannot compress
      return false;
    }
    const parsed = Date.parse(value);
    if(isNaN(parsed)) {
      // no date parsed, cannot compress
      return false;
    }

    return new XsdDateEncoder({value, parsed});
  }
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

class XsdDateTimeEncoder extends CborldEncoder {
  constructor({value, parsed} = {}) {
    super();
    this.value = value;
    this.parsed = parsed;
  }

  encode() {
    const {value, parsed} = this;
    const secondsSinceEpoch = Math.floor(parsed / 1000);
    const secondsToken = new Token(Type.uint, secondsSinceEpoch);
    const millisecondIndex = value.indexOf('.');
    if(millisecondIndex === -1) {
      const expectedDate = new Date(
        secondsSinceEpoch * 1000).toISOString().replace('.000Z', 'Z');
      if(value !== expectedDate) {
        // compression would be lossy, do not compress
        return new Token(Type.string, value);
      }
      // compress with second precision
      return secondsToken;
    }

    const milliseconds = parseInt(value.substr(millisecondIndex + 1), 10);
    const expectedDate = new Date(
      secondsSinceEpoch * 1000 + milliseconds).toISOString();
    if(value !== expectedDate) {
      // compress would be lossy, do not compress
      return new Token(Type.string, value);
    }

    // compress with subsecond precision
    const entries = [
      secondsToken,
      new Token(Type.uint, milliseconds)
    ];
    return [new Token(Type.array, entries.length), entries];
  }

  static createEncoder({value} = {}) {
    if(!value.includes('T')) {
      // no time included, cannot compress
      return false;
    }
    const parsed = Date.parse(value);
    if(isNaN(parsed)) {
      // no date parsed, cannot compress
      return false;
    }

    return new XsdDateTimeEncoder({value, parsed});
  }
}

/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

const TYPE_ENCODERS = new Map([
  ['@id', UriEncoder],
  ['@vocab', VocabTermEncoder],
  ['https://w3id.org/security#multibase', MultibaseEncoder],
  ['http://www.w3.org/2001/XMLSchema#date', XsdDateEncoder],
  ['http://www.w3.org/2001/XMLSchema#dateTime', XsdDateTimeEncoder]
]);

const CONTEXT_TERM_ID = KEYWORDS.get('@context');
const CONTEXT_TERM_ID_PLURAL = CONTEXT_TERM_ID + 1;

// override cborg object encoder to use cborld encoders
const typeEncoders = {
  Object(obj) {
    if(obj instanceof CborldEncoder) {
      return obj.encode({obj});
    }
  }
};

class Compressor extends Transformer {
  /**
   * Creates a new Compressor for generating compressed CBOR-LD from a
   * JSON-LD document. The created instance may only be used on a single
   * JSON-LD document at a time.
   *
   * @param {object} options - The options to use when encoding to CBOR-LD.
   * @param {documentLoaderFunction} options.documentLoader -The document
   *   loader to use when resolving JSON-LD Context URLs.
   * @param {Map} [options.appContextMap] - A map of JSON-LD Context URLs and
   *   their encoded CBOR-LD values (must be values greater than 32767
   *   (0x7FFF)).
   * @param {boolean} [options.compressionModeUndefinedTermAllowed] - Allow the
   *   JSON-LD document to contain terms that are not defined in the context.
   *   The original values of the undefined terms will be preserved during
   *   compression. Defaults to `false`, every key that does not have a defined
   *   term will raise an error.
   */
  constructor({documentLoader, appContextMap,
    compressionModeUndefinedTermAllowed} = {}) {
    super({documentLoader, appContextMap, compressionModeUndefinedTermAllowed});
  }

  /**
   * Compresses the given JSON-LD document into a CBOR-LD byte array of
   * compressed bytes that should follow the compressed CBOR-LD CBOR tag.
   *
   * @param {object} options - The options to use.
   * @param {object} options.jsonldDocument - The JSON-LD Document to convert
   *   to CBOR-LD bytes.
   * @param {diagnosticFunction} [options.diagnose] - A function that, if
   *   provided, is called with diagnostic information.
   *
   * @returns {Promise<Uint8Array>} - The compressed CBOR-LD bytes.
   */
  async compress({jsonldDocument, diagnose} = {}) {
    const transformMaps = await this._createTransformMaps({jsonldDocument});
    if(diagnose) {
      diagnose('Diagnostic CBOR-LD compression transform map(s):');
      diagnose(util.inspect(transformMaps, {depth: null, colors: true}));
    }
    return encode$4(transformMaps, {typeEncoders});
  }

  async _createTransformMaps({jsonldDocument}) {
    // initialize state
    this.contextMap = new Map();
    this.termToId = new Map(KEYWORDS);
    this.nextTermId = FIRST_CUSTOM_TERM_ID;

    // handle single or multiple JSON-LD docs
    const transformMaps = [];
    const isArray = Array.isArray(jsonldDocument);
    const docs = isArray ? jsonldDocument : [jsonldDocument];
    for(const obj of docs) {
      const transformMap = new Map();
      await this._transform({obj, transformMap});
      transformMaps.push(transformMap);
    }

    return isArray ? transformMaps : transformMaps[0];
  }

  _afterObjectContexts({obj, transformMap}) {
    // if `@context` is present in the object, encode it
    const context = obj['@context'];
    if(!context) {
      return;
    }

    const entries = [];
    const isArray = Array.isArray(context);
    const contexts = isArray ? context : [context];
    for(const value of contexts) {
      const encoder = ContextEncoder.createEncoder(
        {value, transformer: this});
      entries.push(encoder || value);
    }
    const id = isArray ? CONTEXT_TERM_ID_PLURAL : CONTEXT_TERM_ID;
    transformMap.set(id, isArray ? entries : entries[0]);
  }

  _getEntries({obj, termMap}) {
    // get term entries to be transformed and sort by *term* to ensure term
    // IDs will be assigned in the same order that the decompressor will
    const entries = [];
    const keys = Object.keys(obj).sort();
    for(const key of keys) {
      // skip `@context`; not a term entry
      if(key === '@context') {
        continue;
      }

      // check for undefined terms
      const def = termMap.get(key);
      if(
        def === undefined &&
        !(key.startsWith('@') && KEYWORDS.has(key)) &&
        !this.compressionModeUndefinedTermAllowed
      ) {
        throw new CborldError(
          'ERR_UNKNOWN_CBORLD_TERM',
          `Unknown term '${key}' was detected in the JSON-LD input.`);
      }

      const value = obj[key];
      const plural = Array.isArray(value);
      const termId = this._getIdForTerm({term: key, plural});
      entries.push([{term: key, termId, plural, def}, value]);
    }
    return entries;
  }

  _transformObjectId({transformMap, termInfo, value}) {
    const {termId} = termInfo;
    const encoder = UriEncoder.createEncoder(
      {value, transformer: this, termInfo});
    transformMap.set(termId, encoder || value);
  }

  _transformObjectType({transformMap, termInfo, value}) {
    const {termId, plural} = termInfo;
    const values = plural ? value : [value];
    const entries = [];
    for(const value of values) {
      const encoder = VocabTermEncoder.createEncoder(
        {value, transformer: this, termInfo});
      entries.push(encoder || value);
    }
    transformMap.set(termId, plural ? entries : entries[0]);
  }

  _transformTypedValue({entries, termType, value, termInfo}) {
    const EncoderClass = TYPE_ENCODERS.get(termType);
    const encoder = EncoderClass && EncoderClass.createEncoder(
      {value, transformer: this, termInfo});
    if(encoder) {
      entries.push(encoder);
      return true;
    }
  }

  async _transformArray({entries, contextStack, value}) {
    // recurse into array
    const children = [];
    for(const obj of value) {
      const childMap = new Map();
      children.push(childMap);
      await this._transform({obj, transformMap: childMap, contextStack});
    }
    entries.push(children);
  }

  async _transformObject({entries, contextStack, value}) {
    // recurse into object
    const transformMap = new Map();
    entries.push(transformMap);
    await this._transform({obj: value, transformMap, contextStack});
  }

  _assignEntries({entries, transformMap, termInfo}) {
    const {termId, plural} = termInfo;
    transformMap.set(termId, plural ? entries : entries[0]);
  }
}

/**
 * A diagnostic function that is called with diagnostic information. Typically
 * set to `console.log` when debugging.
 *
 * @callback diagnosticFunction
 * @param {string} message - The diagnostic message.
 */

/**
 * Fetches a resource given a URL and returns it as a string.
 *
 * @callback documentLoaderFunction
 * @param {string} url - The URL to retrieve.
 *
 * @returns {string} The resource associated with the URL as a string.
 */

/*!
 * Copyright (c) 2020-2021 Digital Bazaar, Inc. All rights reserved.
 */

/**
 * Encodes a given JSON-LD document into a CBOR-LD byte array.
 *
 * @param {object} options - The options to use when encoding to CBOR-LD.
 * @param {object} options.jsonldDocument - The JSON-LD Document to convert to
 *   CBOR-LD bytes.
 * @param {documentLoaderFunction} options.documentLoader -The document loader
 *   to use when resolving JSON-LD Context URLs.
 * @param {boolean} [options.compressionMode=1] - `1` to use compression mode
 *   version 1, `0` to use no compression.
 * @param {Map} [options.appContextMap] - A map of JSON-LD Context URLs and
 *   their encoded CBOR-LD values (must be values greater than 32767 (0x7FFF)).
 * @param {boolean} [options.compressionModeUndefinedTermAllowed] - Allow the
 *   JSON-LD document to contain terms that are not defined in the context. The
 *   original values of the undefined terms will be preserved during
 *   compression. Defaults to `false`, every key that does not have a defined
 *   term will raise an error.
 * @param {diagnosticFunction} [options.diagnose] - A function that, if
 * provided, is called with diagnostic information.
 *
 * @returns {Promise<Uint8Array>} - The encoded CBOR-LD bytes.
 */
async function encode({
  jsonldDocument, documentLoader, appContextMap = new Map(),
  compressionModeUndefinedTermAllowed = false, compressionMode = 1, diagnose
} = {}) {
  if(!(compressionMode === 0 || compressionMode === 1)) {
    throw new TypeError(
      '"compressionMode" must be "0" (no compression) or "1" ' +
      'for compression mode version 1.');
  }

  // 0xd9 == 11011001
  // 110 = CBOR major type 6
  // 11001 = 25, 16-bit tag size (65536 possible values)
  // 0x05 = always the first 8-bits of a CBOR-LD tag
  // compressionMode = last 8-bits of a CBOR-LD tag indicating compression type
  const prefix = new Uint8Array([0xd9, 0x05, compressionMode]);
  let suffix;

  if(compressionMode === 0) {
    // handle uncompressed CBOR-LD
    suffix = encode$4(jsonldDocument);
  } else {
    // compress CBOR-LD
    const compressor = new Compressor(
      {documentLoader, appContextMap, compressionModeUndefinedTermAllowed});
    suffix = await compressor.compress({jsonldDocument, diagnose});
  }

  // concatenate prefix and suffix
  const length = prefix.length + suffix.length;
  const bytes = new Uint8Array(length);
  bytes.set(prefix);
  bytes.set(suffix, prefix.length);

  if(diagnose) {
    diagnose('Diagnostic CBOR-LD result:');
    diagnose(util.inspect(bytes, {depth: null, colors: true}));
  }

  return bytes;
}

/**
 * A diagnostic function that is called with diagnostic information. Typically
 * set to `console.log` when debugging.
 *
 * @callback diagnosticFunction
 * @param {string} message - The diagnostic message.
 */

/**
 * Fetches a resource given a URL and returns it as a string.
 *
 * @callback documentLoaderFunction
 * @param {string} url - The URL to retrieve.
 *
 * @returns {string} The resource associated with the URL as a string.
 */

exports.decode = decode;
exports.encode = encode;
//# sourceMappingURL=main.js.map
