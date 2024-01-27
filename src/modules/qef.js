import fs from "fs";
import path from "path";
import log4q from "@utils/log4q";
import branca from "branca";
import jsrsasign from "jsrsasign";
import scryptjs from "scrypt-js";
import { QUANTUM_NAME } from "@utils/constants";

const DEFAULT_DIRECTORY_PATH = path.resolve(__dirname, "..", QUANTUM_NAME);
const QUANTUM_ENCRYPTION_FILE_NAME = `${QUANTUM_NAME}-keys.enc`;
const RSA_KEY_SIZE = 2048;

// Qef is short for Quantum Encryption File
class Qef {
  #filePath = null;
  #key = null;
  #data = null;
  #userId = null;

  init(userId, directoryPath = DEFAULT_DIRECTORY_PATH) {
    this.#filePath = null;
    this.#key = null;
    this.#data = null;
    this.#userId = userId;
    this.setFileDirectory(directoryPath);
    this.ensureData();
  }

  deconstruct() {
    this.#filePath = null;
    this.#key = null;
    this.#data = null;
    this.#userId = null;
  }

  setFileDirectory(directoryPath = DEFAULT_DIRECTORY_PATH) {
    log4q.log("Setting the file directory to:", directoryPath);
    if (
      fs.existsSync(directoryPath) &&
      fs.lstatSync(directoryPath).isDirectory()
    ) {
      const fileName = `${this.#userId}-${QUANTUM_ENCRYPTION_FILE_NAME}`;
      this.#filePath = path.join(directoryPath, fileName);
    } else {
      log4q.error("The provided path is not a valid directory:", directoryPath);
    }
  }

  getFilePath() {
    return this.#filePath;
  }

  fileExists() {
    return fs.existsSync(this.#filePath);
  }

  async setMasterPassword(password) {
    if (!this.#userId) {
      log4q.error("The user ID is not set.");
      return;
    }

    const encoder = new TextEncoder();
    const passwordUint8Array = encoder.encode(password);
    const saltUint8Array = encoder.encode(this.#userId);
    const N = 1024,
      r = 8,
      p = 1,
      dkLen = 32;
    const key = await scryptjs.scrypt(
      passwordUint8Array,
      saltUint8Array,
      N,
      r,
      p,
      dkLen
    );
    this.#key = new branca(key);
  }

  getUserId() {
    return this.#userId;
  }

  getChannelKey(channelId) {
    return this.#data?.channelKeys[channelId];
  }

  setChannelKey(channelId, channelKey) {
    this.#data.channelKeys[channelId] = channelKey;
  }

  getExchangePrivateKey() {
    return this.#data?.exchangeKeyPair.privateKey;
  }

  getExchangePublicKey() {
    return this.#data?.exchangeKeyPair.publicKey;
  }

  generateExchangeKeyPair() {
    log4q.log("Generating a new exchange key pair."); // TODO: Remove this log after testing
    const keyPair = jsrsasign.KEYUTIL.generateKeypair("RSA", RSA_KEY_SIZE);
    this.#data.exchangeKeyPair.privateKey = jsrsasign.KEYUTIL.getPEM(
      keyPair.prvKeyObj,
      "PKCS1PRV"
    );
    this.#data.exchangeKeyPair.publicKey = jsrsasign.KEYUTIL.getPEM(
      keyPair.pubKeyObj,
      "PKCS8PUB"
    );
  }

  dataExist() {
    return !!this.#data;
  }

  ensureData() {
    if (!this.dataExist()) {
      this.#data = { channelKeys: {}, exchangeKeyPair: {} };
      log4q.log("The data model got (re-)initialized."); // TODO: Remove this log after testing
    }
  }

  writeData() {
    if (!this.dataExist()) {
      log4q.error("No data to write.");
      return;
    }
    try {
      const encrypted = this.#key.encode(JSON.stringify(this.#data));
      fs.writeFileSync(this.#filePath, encrypted, "utf8");
    } catch (error) {
      log4q.error("The file could not be written.", error);
    }
  }

  readData() {
    if (this.fileExists()) {
      try {
        const encryptedData = fs.readFileSync(this.#filePath, "utf8");
        const decrypted = this.#key.decode(encryptedData);
        try {
          this.#data = JSON.parse(decrypted.toString());
        } catch (error) {
          log4q.error("The decrypted data is not valid JSON.", error);
        }
      } catch (error) {
        log4q.error("The file could not be read.", error);
      }
    }
  }

  // TODO: Remove this log method after testing
  printData() {
    log4q.log(this.#data);
  }
}

export default new Qef();
