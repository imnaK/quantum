/**
 * @name Quantum
 * @author imnaK .yama_
 * @description Adds the functionality to encrypt and decrypt messages.
 * @version 0.0.1
 */

// quantum code

const commandPrefix = "§";
const sets = ["ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"];
const safeNumber = (num, mod) => ((num % mod) + mod) % mod;

function rot(msg, num) {
  let ret = "";
  for (let i = 0; i < msg.length; i++) {
    let add = msg[i];
    for (let j = 0; j < sets.length; j++)
      if (sets[j].indexOf(msg[i]) !== -1)
        add =
          sets[j][safeNumber(sets[j].indexOf(msg[i]) + num, sets[j].length)];
    ret += add;
  }
  return ret;
}

function cryptTest() {
  let xcha20 = new XChaCha20();
  let message = "test message";
  let key = Buffer.from(
    "808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9f",
    "hex"
  );
  let nonce = Buffer.from(
    "404142434445464748494a4b4c4d4e4f5051525354555658",
    "hex"
  );

  (async function () {
    let blockCounter = 1; // Optional, defaults to 1 per the RFC
    let ciphertext = await xcha20.encrypt(message, nonce, key, blockCounter);
    let plaintext = await xcha20.decrypt(ciphertext, nonce, key, blockCounter);
    console.log(ciphertext, plaintext);
    console.log(plaintext.toString() === message); // true
  })();
}

module.exports = class Quantum {
  constructor(meta) {}

  start() {
    let _sendMessage = BdApi.Webpack.getModule(
      BdApi.Webpack.Filters.byProps("_sendMessage")
    );
    BdApi.Patcher.before(
      "encryptMessage",
      _sendMessage,
      "sendMessage",
      (_, args) => {
        if (args[1].content.startsWith(commandPrefix))
          args[1].content =
            commandPrefix +
            rot(args[1].content.substring(commandPrefix.length), 13);
        cryptTest();
      }
    );
  }

  stop() {
    BdApi.Patcher.unpatchAll("encryptMessage");
  }
};

const crypto = require("crypto");

// code from https://www.npmjs.com/package/xchacha20-js

function arrayToBuffer(arr) {
  return ArrayBuffer.isView(arr)
    ? // To avoid a copy, use the typed array's underlying ArrayBuffer to back
      // new Buffer, respecting the "view", i.e. byteOffset and byteLength
      Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength)
    : // Pass through all other types to `Buffer.from`
      Buffer.from(arr);
}

class Util {
  /**
   * @param {Buffer} buf
   * @return {Uint32Array}
   */
  static bufferToUint32Array(buf) {
    let arr = [];
    let len = buf.length >>> 2;
    for (let i = 0; i < len; i++) {
      arr.push(Util.load32_be(buf.slice(i << 2, (i << 2) + 4)));
    }
    return Uint32Array.from(arr);
  }
  /**
   * @param {Buffer} buf
   * @return {Uint32Array}
   */
  static bufferToUint32LEArray(buf) {
    let arr = [];
    let len = buf.length >>> 2;
    for (let i = 0; i < len; i++) {
      arr.push(Util.load32_le(buf.slice(i << 2, (i << 2) + 4)));
    }
    return Uint32Array.from(arr);
  }

  /**
   * Gets the string representation of a Buffer.
   *
   * @param {Buffer} buffer
   * @returns {string}
   */
  static fromBuffer(buffer) {
    if (!Buffer.isBuffer(buffer)) {
      throw new TypeError("Invalid type; string or buffer expected");
    }
    return buffer.toString("binary");
  }

  /**
   * Compare two strings without timing leaks.
   *
   * @param {string|Buffer} a
   * @param {string|Buffer} b
   * @returns {boolean}
   */
  static hashEquals(a, b) {
    return crypto.timingSafeEquals(a, b);
  }

  /**
   * Node.js only supports 32-bit numbers so we discard the top 4 bytes.
   *
   * @param {Buffer} buf
   * @return {Number}
   */
  static load32_le(buf) {
    return buf.readInt32LE(0) >>> 0;
  }

  /**
   * Node.js only supports 32-bit numbers so we discard the top 4 bytes.
   *
   * @param {Buffer} buf
   * @return {Number}
   */
  static load32_be(buf) {
    return buf.readInt32BE(0) >>> 0;
  }

  /**
   * Node.js only supports 32-bit numbers so we discard the top 4 bytes.
   *
   * @param {Buffer} buf
   * @return {Number}
   */
  static load64_le(buf) {
    return buf.readInt32LE(0) >>> 0;
  }

  /**
   * Pack chunks together for feeding into HMAC.
   *
   * @param {Buffer[]} pieces
   * @return Buffer
   */
  static pack(pieces) {
    let output = Util.store32_le(pieces.length);
    let piece;
    let pieceLen;
    for (let i = 0; i < pieces.length; i++) {
      piece = pieces[i];
      pieceLen = Util.store64_le(piece.length);
      output = Buffer.concat([output, pieceLen, piece]);
    }
    return output;
  }

  /**
   * @param {Number} len
   * @return {Buffer}
   */
  static randomBytes(len) {
    let buf = Buffer.alloc(len, 0);
    sodium.randombytes_buf(buf);
    return buf;
  }

  /**
   * Store a 32-bit integer as a buffer of length 4
   *
   * @param {Number} num
   * @return {Buffer}
   */
  static store32_be(num) {
    let result = Buffer.alloc(4, 0);
    result[3] = (num & 0xff) >>> 0;
    result[2] = ((num >>> 8) & 0xff) >>> 0;
    result[1] = ((num >>> 16) & 0xff) >>> 0;
    result[0] = ((num >>> 24) & 0xff) >>> 0;
    return result;
  }

  /**
   * Store a 32-bit integer as a buffer of length 4
   *
   * @param {Number} num
   * @return {Buffer}
   */
  static store32_le(num) {
    let result = Buffer.alloc(4, 0);
    result[0] = num & 0xff;
    result[1] = (num >>> 8) & 0xff;
    result[2] = (num >>> 16) & 0xff;
    result[3] = (num >>> 24) & 0xff;
    return result;
  }

  /**
   * JavaScript only supports 32-bit integers, so we're going to
   * zero-fill the rightmost bytes.
   *
   * @param {Number} num
   * @return {Buffer}
   */
  static store64_le(num) {
    let result = Buffer.alloc(8, 0);
    result[0] = num & 0xff;
    result[1] = (num >>> 8) & 0xff;
    result[2] = (num >>> 16) & 0xff;
    result[3] = (num >>> 24) & 0xff;
    return result;
  }

  /**
   * Coerce input to a Buffer, throwing a TypeError if it cannot be coerced.
   *
   * @param {string|Buffer|Uint8Array|Uint32Array} stringOrBuffer
   * @returns {Buffer}
   */
  static toBuffer(stringOrBuffer) {
    if (Buffer.isBuffer(stringOrBuffer)) {
      return stringOrBuffer;
    } else if (typeof stringOrBuffer === "string") {
      return Buffer.from(stringOrBuffer, "binary");
    } else if (stringOrBuffer instanceof Uint8Array) {
      return arrayToBuffer(stringOrBuffer);
    } else if (stringOrBuffer instanceof Uint32Array) {
      return arrayToBuffer(stringOrBuffer);
    } else {
      throw new TypeError("Invalid type; string or buffer expected");
    }
  }
}

class ChaCha20 {
  static rotate(v, n) {
    v &= 0xffffffff;
    n &= 31;
    return ((v << n) | (v >>> (32 - n))) >>> 0;
  }

  /**
   * @param {Number} a
   * @param {Number} b
   * @param {Number} c
   * @param {Number} d
   * @return {Number[]}
   */
  static quarterRound(a, b, c, d) {
    // a = PLUS(a,b); d = ROTATE(XOR(d,a),16);
    a = (a + b) & 0xffffffff;
    d = ChaCha20.rotate(d ^ a, 16);

    // c = PLUS(c,d); b = ROTATE(XOR(b,c),12);
    c = (c + d) & 0xffffffff;
    b = ChaCha20.rotate(b ^ c, 12);

    // a = PLUS(a,b); d = ROTATE(XOR(d,a), 8);
    a = (a + b) & 0xffffffff;
    d = ChaCha20.rotate(d ^ a, 8);

    // c = PLUS(c,d); b = ROTATE(XOR(b,c), 7);
    c = (c + d) & 0xffffffff;
    b = ChaCha20.rotate(b ^ c, 7);
    return [a >>> 0, b >>> 0, c >>> 0, d >>> 0];
  }

  /**
   * @param {Buffer} key
   * @param {Buffer} nonce
   * @param {Buffer|Number} counter
   * @return {Buffer}
   */
  createCtx(key, nonce, counter = null) {
    if (!counter) {
      counter = Buffer.alloc(4, 0);
    } else if (typeof counter === "number") {
      counter = Util.store32_le(counter);
    }
    let ctx = Buffer.alloc(64, 0);
    const constant = Buffer.from("657870616e642033322d62797465206b", "hex");
    Util.toBuffer(Util.bufferToUint32Array(constant)).copy(ctx, 0, 0, 16);
    Util.toBuffer(Util.bufferToUint32LEArray(key)).copy(ctx, 16, 0, 32);
    Util.toBuffer(Util.bufferToUint32LEArray(counter)).copy(ctx, 48, 0, 8);
    Util.toBuffer(Util.bufferToUint32LEArray(nonce)).copy(ctx, 56, 0, 8);
    key.copy(ctx, 16, 0, 32);
    counter.copy(ctx, 48, 0, 8);
    nonce.copy(ctx, 56, 0, 8);
    return ctx;
  }

  /**
   * @param {Buffer} key
   * @param {Buffer} nonce
   * @param {Buffer|Number} counter
   * @return {Buffer}
   */
  createIetfCtx(key, nonce, counter = null) {
    if (!counter) {
      counter = Buffer.alloc(4, 0);
    } else if (typeof counter === "number") {
      counter = Util.store32_le(counter);
    }
    let ctx = Buffer.alloc(64, 0);
    const constant = Buffer.from("657870616e642033322d62797465206b", "hex");
    Util.toBuffer(Util.bufferToUint32Array(constant)).copy(ctx, 0, 0, 16);
    Util.toBuffer(Util.bufferToUint32LEArray(key)).copy(ctx, 16, 0, 32);
    Util.toBuffer(Util.bufferToUint32LEArray(counter)).copy(ctx, 48, 0, 4);
    Util.toBuffer(Util.bufferToUint32LEArray(nonce)).copy(ctx, 52, 0, 12);
    return ctx;
  }

  async encryptBytes(ctx, message) {
    let j0 = ctx.readInt32BE(0) >>> 0;
    let j1 = ctx.readInt32BE(1 << 2) >>> 0;
    let j2 = ctx.readInt32BE(2 << 2) >>> 0;
    let j3 = ctx.readInt32BE(3 << 2) >>> 0; // These 4 are kind of weird.
    let j4 = ctx.readInt32LE(4 << 2) >>> 0;
    let j5 = ctx.readInt32LE(5 << 2) >>> 0;
    let j6 = ctx.readInt32LE(6 << 2) >>> 0;
    let j7 = ctx.readInt32LE(7 << 2) >>> 0;
    let j8 = ctx.readInt32LE(8 << 2) >>> 0;
    let j9 = ctx.readInt32LE(9 << 2) >>> 0;
    let j10 = ctx.readInt32LE(10 << 2) >>> 0;
    let j11 = ctx.readInt32LE(11 << 2) >>> 0;
    let j12 = ctx.readInt32LE(12 << 2) >>> 0;
    let j13 = ctx.readInt32LE(13 << 2) >>> 0;
    let j14 = ctx.readInt32LE(14 << 2) >>> 0;
    let j15 = ctx.readInt32LE(15 << 2) >>> 0;

    let x0;
    let x1;
    let x2;
    let x3;
    let x4;
    let x5;
    let x6;
    let x7;
    let x8;
    let x9;
    let x10;
    let x11;
    let x12;
    let x13;
    let x14;
    let x15;

    let start = 0;
    let end;
    let len = message.length;
    let cipher = Buffer.alloc(len, 0);
    let chunk = Buffer.alloc(64, 0);

    while (start < len) {
      end = start + 64 >= len ? len : start + 64;
      chunk.fill(0, 0);
      message.slice(start, end).copy(chunk, 0);
      x0 = j0;
      x1 = j1;
      x2 = j2;
      x3 = j3;
      x4 = j4;
      x5 = j5;
      x6 = j6;
      x7 = j7;
      x8 = j8;
      x9 = j9;
      x10 = j10;
      x11 = j11;
      x12 = j12;
      x13 = j13;
      x14 = j14;
      x15 = j15;
      for (let i = 0; i < 10; i++) {
        [x0, x4, x8, x12] = ChaCha20.quarterRound(x0, x4, x8, x12);
        [x1, x5, x9, x13] = ChaCha20.quarterRound(x1, x5, x9, x13);
        [x2, x6, x10, x14] = ChaCha20.quarterRound(x2, x6, x10, x14);
        [x3, x7, x11, x15] = ChaCha20.quarterRound(x3, x7, x11, x15);

        [x0, x5, x10, x15] = ChaCha20.quarterRound(x0, x5, x10, x15);
        [x1, x6, x11, x12] = ChaCha20.quarterRound(x1, x6, x11, x12);
        [x2, x7, x8, x13] = ChaCha20.quarterRound(x2, x7, x8, x13);
        [x3, x4, x9, x14] = ChaCha20.quarterRound(x3, x4, x9, x14);
      }
      x0 = this.add(x0, j0);
      x1 = this.add(x1, j1);
      x2 = this.add(x2, j2);
      x3 = this.add(x3, j3);
      x4 = this.add(x4, j4);
      x5 = this.add(x5, j5);
      x6 = this.add(x6, j6);
      x7 = this.add(x7, j7);
      x8 = this.add(x8, j8);
      x9 = this.add(x9, j9);
      x10 = this.add(x10, j10);
      x11 = this.add(x11, j11);
      x12 = this.add(x12, j12);
      x13 = this.add(x13, j13);
      x14 = this.add(x14, j14);
      x15 = this.add(x15, j15);

      x0 = this.xor(x0, Util.load32_le(chunk.slice(0, 4)));
      x1 = this.xor(x1, Util.load32_le(chunk.slice(4, 8)));
      x2 = this.xor(x2, Util.load32_le(chunk.slice(8, 12)));
      x3 = this.xor(x3, Util.load32_le(chunk.slice(12, 16)));
      x4 = this.xor(x4, Util.load32_le(chunk.slice(16, 20)));
      x5 = this.xor(x5, Util.load32_le(chunk.slice(20, 24)));
      x6 = this.xor(x6, Util.load32_le(chunk.slice(24, 28)));
      x7 = this.xor(x7, Util.load32_le(chunk.slice(28, 32)));
      x8 = this.xor(x8, Util.load32_le(chunk.slice(32, 36)));
      x9 = this.xor(x9, Util.load32_le(chunk.slice(36, 40)));
      x10 = this.xor(x10, Util.load32_le(chunk.slice(40, 44)));
      x11 = this.xor(x11, Util.load32_le(chunk.slice(44, 48)));
      x12 = this.xor(x12, Util.load32_le(chunk.slice(48, 52)));
      x13 = this.xor(x13, Util.load32_le(chunk.slice(52, 56)));
      x14 = this.xor(x14, Util.load32_le(chunk.slice(56, 60)));
      x15 = this.xor(x15, Util.load32_le(chunk.slice(60, 64)));

      Util.store32_le(x0).copy(cipher, start);
      Util.store32_le(x1).copy(cipher, start + 4);
      Util.store32_le(x2).copy(cipher, start + 8);
      Util.store32_le(x3).copy(cipher, start + 12);
      Util.store32_le(x4).copy(cipher, start + 16);
      Util.store32_le(x5).copy(cipher, start + 20);
      Util.store32_le(x6).copy(cipher, start + 24);
      Util.store32_le(x7).copy(cipher, start + 28);
      Util.store32_le(x8).copy(cipher, start + 32);
      Util.store32_le(x9).copy(cipher, start + 36);
      Util.store32_le(x10).copy(cipher, start + 40);
      Util.store32_le(x11).copy(cipher, start + 44);
      Util.store32_le(x12).copy(cipher, start + 48);
      Util.store32_le(x13).copy(cipher, start + 52);
      Util.store32_le(x14).copy(cipher, start + 56);
      Util.store32_le(x15).copy(cipher, start + 60);

      j12++;
      start += 64;
    }
    return cipher;
  }

  /**
   * @param {number} a
   * @param {number} b
   * @return {number}
   */
  add(a, b) {
    return ((a + b) & 0xffffffff) >>> 0;
  }

  /**
   * @param {number} a
   * @param {number} b
   * @return {number}
   */
  xor(a, b) {
    return ((a ^ b) & 0xffffffff) >>> 0;
  }

  /**
   *
   * @param {Number} len
   * @param {Buffer|null} nonce
   * @param {Buffer|null} key
   * @return {Buffer}
   */
  async ietfStream(len = 64, nonce = null, key = null) {
    if (!key) {
      key = Buffer.alloc(32, 0);
    }
    if (!nonce) {
      nonce = Buffer.alloc(12, 0);
    } else if (nonce.length !== 12) {
      throw new Error("Nonce must be 8 bytes");
    }
    return await this.encryptBytes(
      this.createIetfCtx(key, nonce),
      Buffer.alloc(len, 0)
    );
  }

  /**
   *
   * @param {Number} len
   * @param {Buffer|null} nonce
   * @param {Buffer|null} key
   * @param {number} counter
   * @return {Buffer}
   */
  async ietfStreamIc(len = 64, nonce = null, key = null, counter = 0) {
    if (!key) {
      key = Buffer.alloc(32, 0);
    }
    if (!nonce) {
      nonce = Buffer.alloc(12, 0);
    } else if (nonce.length !== 12) {
      throw new Error("Nonce must be 12 bytes");
    }

    return await this.encryptBytes(
      this.createIetfCtx(key, nonce, counter),
      Buffer.alloc(len, 0)
    );
  }

  /**
   *
   * @param {Number} len
   * @param {Buffer|null} nonce
   * @param {Buffer|null} key
   * @return {Buffer}
   */
  async stream(len = 64, nonce = null, key = null) {
    if (!key) {
      key = Buffer.alloc(32, 0);
    }
    if (!nonce) {
      nonce = Buffer.alloc(8, 0);
    } else if (nonce.length !== 8) {
      throw new Error("Nonce must be 8 bytes");
    }
    return await this.encryptBytes(
      this.createCtx(key, nonce),
      Buffer.alloc(len, 0)
    );
  }

  /**
   *
   * @param {Number} len
   * @param {Buffer|null} nonce
   * @param {Buffer|null} key
   * @param {number} counter
   * @return {Buffer}
   */
  async streamIc(len = 64, nonce = null, key = null, counter = 0) {
    if (!key) {
      key = Buffer.alloc(32, 0);
    }
    if (!nonce) {
      nonce = Buffer.alloc(8, 0);
    } else if (nonce.length !== 8) {
      throw new Error("Nonce must be 8 bytes");
    }
    return await this.encryptBytes(
      this.createCtx(key, nonce, counter),
      Buffer.alloc(len, 0)
    );
  }

  /**
   *
   * @param {string|Buffer} message
   * @param {Buffer} nonce
   * @param {Buffer} key
   * @param {Buffer|Number} ic
   */
  async ietfStreamXorIc(message, nonce, key, ic = 0) {
    if (nonce.length !== 12) {
      throw new Error("Nonce must be 12 bytes");
    }
    return await this.encryptBytes(
      this.createIetfCtx(key, nonce, ic),
      Util.toBuffer(message)
    );
  }

  /**
   *
   * @param {string|Buffer} message
   * @param {Buffer} nonce
   * @param {Buffer} key
   * @param {Buffer|Number} ic
   */
  async streamXorIc(message, nonce, key, ic = 0) {
    if (nonce.length !== 8) {
      throw new Error("Nonce must be 8 bytes");
    }
    return this.encryptBytes(
      this.createCtx(key, nonce, ic),
      Util.toBuffer(message)
    );
  }
}

class HChaCha20 extends ChaCha20 {
  /**
   * @param {Buffer} key
   * @param {Buffer} nonce
   * @return {Buffer}
   */
  createHCtx(key, nonce) {
    let ctx = Buffer.alloc(64, 0);
    const constant = Buffer.from("657870616e642033322d62797465206b", "hex");
    Util.toBuffer(Util.bufferToUint32Array(constant)).copy(ctx, 0, 0, 16);
    Util.toBuffer(Util.bufferToUint32Array(key)).copy(ctx, 16, 0, 32);
    Util.toBuffer(Util.bufferToUint32Array(nonce)).copy(ctx, 48, 0, 16);
    return ctx;
  }

  async hChaCha20Bytes(n, k) {
    let ctx = this.createHCtx(k, n);
    let x0 = ctx.readInt32BE(0);
    let x1 = ctx.readInt32BE(1 << 2);
    let x2 = ctx.readInt32BE(2 << 2);
    let x3 = ctx.readInt32BE(3 << 2);
    let x4 = ctx.readInt32BE(4 << 2);
    let x5 = ctx.readInt32BE(5 << 2);
    let x6 = ctx.readInt32BE(6 << 2);
    let x7 = ctx.readInt32BE(7 << 2);
    let x8 = ctx.readInt32BE(8 << 2);
    let x9 = ctx.readInt32BE(9 << 2);
    let x10 = ctx.readInt32BE(10 << 2);
    let x11 = ctx.readInt32BE(11 << 2);
    let x12 = ctx.readInt32BE(12 << 2);
    let x13 = ctx.readInt32BE(13 << 2);
    let x14 = ctx.readInt32BE(14 << 2);
    let x15 = ctx.readInt32BE(15 << 2);

    for (let i = 0; i < 10; i++) {
      [x0, x4, x8, x12] = ChaCha20.quarterRound(x0, x4, x8, x12);
      [x1, x5, x9, x13] = ChaCha20.quarterRound(x1, x5, x9, x13);
      [x2, x6, x10, x14] = ChaCha20.quarterRound(x2, x6, x10, x14);
      [x3, x7, x11, x15] = ChaCha20.quarterRound(x3, x7, x11, x15);

      [x0, x5, x10, x15] = ChaCha20.quarterRound(x0, x5, x10, x15);
      [x1, x6, x11, x12] = ChaCha20.quarterRound(x1, x6, x11, x12);
      [x2, x7, x8, x13] = ChaCha20.quarterRound(x2, x7, x8, x13);
      [x3, x4, x9, x14] = ChaCha20.quarterRound(x3, x4, x9, x14);
    }

    return Util.toBuffer(
      Uint32Array.from([x0, x1, x2, x3, x12, x13, x14, x15])
    );
  }
}

class XChaCha20 {
  constructor() {
    this.hchacha20 = new HChaCha20();
  }

  /**
   *
   * @param {Number} length
   * @param {string|Buffer} key
   * @param {string|Buffer} nonce
   * @param {Number|Buffer} counter
   */
  async streamBytes(length, key, nonce, counter = 1) {
    let outnonce = Buffer.alloc(12, 0);
    nonce.slice(16).copy(outnonce, 4);
    return await this.hchacha20.ietfStream(
      length,
      await this.hchacha20.hChaCha20Bytes(nonce.slice(0, 16), key),
      outnonce,
      counter
    );
  }

  /**
   * Encryption (defers to streamXorIc)
   *
   * @param {string|Buffer} message
   * @param {string|Buffer} nonce
   * @param {string|Buffer} key
   * @param {Number|Buffer} counter
   */
  async encrypt(message, nonce, key, counter = 1) {
    return await this.streamXorIc(message, nonce, key, counter);
  }

  /**
   * Decryption (defers to streamXorIc)
   *
   * @param {string|Buffer} message
   * @param {string|Buffer} nonce
   * @param {string|Buffer} key
   * @param {Number|Buffer} counter
   */
  async decrypt(message, nonce, key, counter = 1) {
    return await this.streamXorIc(message, nonce, key, counter);
  }

  /**
   * @param {string|Buffer} message
   * @param {string|Buffer} nonce
   * @param {string|Buffer} key
   * @param {Number|Buffer} counter
   */
  async streamXorIc(message, nonce, key, counter = 1) {
    if (key.length !== 32) {
      throw new Error("Key must be 32 bytes");
    }
    if (nonce.length !== 24) {
      throw new Error("Nonce must be 24 bytes");
    }
    let outnonce = Buffer.alloc(12, 0);
    nonce.slice(16).copy(outnonce, 4);
    return await this.hchacha20.ietfStreamXorIc(
      message,
      outnonce,
      await this.hchacha20.hChaCha20Bytes(nonce.slice(0, 16), key),
      counter
    );
  }
}
