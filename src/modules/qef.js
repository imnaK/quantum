import fs from "fs";
import path from "path";
import branca from "branca";
import log4q from "@utils/log4q";
import crypto from "crypto";
import { QUANTUM_ENCRYPTION_FILE_NAME } from "@utils/constants";

// Qef is short for Quantum Encryption File
class Qef {
  #filePath = null;
  #key = null;
  #data = null;

  constructor() {
    this.reset();
  }

  reset() {
    this.#filePath = null;
    this.#key = null;
    this.#data = null;
    this.setFileDirectory();
  }

  setFileDirectory(directoryPath = __dirname) {
    if (
      fs.existsSync(directoryPath) &&
      fs.lstatSync(directoryPath).isDirectory()
    ) {
      this.#filePath = path.join(directoryPath, QUANTUM_ENCRYPTION_FILE_NAME);
    } else {
      log4q.error("The provided path is not a valid directory.");
    }
  }

  getFilePath() {
    return this.#filePath;
  }

  fileExists() {
    return fs.existsSync(this.#filePath);
  }

  setKey(newKey) {
    if (this.isKeyValid(newKey)) {
      this.#key = new branca(newKey);
    } else {
      log4q.error("The key could not be changed.");
    }
  }

  getUserKey(userId) {
    return this.#data?.userKeys[userId];
  }

  setUserKey(userId, key) {
    this.#data.userKeys[userId] = key;
  }

  getExchangePrivateKey() {
    return this.#data?.exchangeKeyPair.privateKey;
  }

  getExchangePublicKey() {
    return this.#data?.exchangeKeyPair.publicKey;
  }

  generateExchangeKeyPair() {
    const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 4096,
    });

    this.#data.exchangeKeyPair.privateKey = privateKey.export({
      type: "pkcs1",
      format: "pem",
    });

    this.#data.exchangeKeyPair.publicKey = publicKey.export({
      type: "pkcs1",
      format: "pem",
    });
  }

  dataExist() {
    return !!this.#data;
  }

  ensureData() {
    if (!this.dataExist()) {
      this.#data = { userKeys: {}, exchangeKeyPair: {} };
      log4q.log("The data model got (re-)initialized.");
    }
  }

  writeData() {
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
        this.#data = JSON.parse(decrypted.toString());
      } catch (error) {
        log4q.error("The file could not be read.");
      }
    }
  }

  // TODO: Remove this function after testing
  printData() {
    log4q.log(this.#data);
  }
}

export default new Qef();
