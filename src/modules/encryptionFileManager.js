import fs from "fs";
import path from "path";
import log4q from "@utils/log4q";
import {
  exchange,
  generateMasterPassword,
} from "@modules/authentication";
import { QUANTUM_NAME } from "@utils/constants";
import {getUser} from "@utils";

const DEFAULT_DIRECTORY_PATH = path.resolve(__dirname, "..", QUANTUM_NAME);
const QUANTUM_ENCRYPTION_FILE_NAME = `${QUANTUM_NAME}-keys.enc`;

class EncryptionFileManager {
  #filePath = null;
  #key = null;
  #data = null;
  #userId = null;

  init(userId, directoryPath = DEFAULT_DIRECTORY_PATH) {
    this.#filePath = null;
    this.#key = null;
    this.#data = null;
    this.#userId = userId ?? getUser().id;
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

    this.#key = await generateMasterPassword(password, this.#userId);
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

  getExchangeSecretKey() {
    return this.#data?.exchangeKeyPair.secretKey;
  }

  getExchangePublicKey() {
    return this.#data?.exchangeKeyPair.publicKey;
  }
  
  getExchangeKeyPair() {
    return this.#data?.exchangeKeyPair;
  }

  dataExist() {
    return !!this.#data;
  }

  ensureData() {
    if (!this.dataExist()) {
      const keyPair = exchange.generateKeyPair();

      this.#data = {
        channelKeys: {},
        exchangeKeyPair: {
          secretKey: keyPair.secretKey,
          publicKey: keyPair.publicKey,
        },
      };

      log4q.log("%cThe data model got (re-)initialized.", "color: yellow;"); // TODO: Remove this log after testing
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

export default new EncryptionFileManager();
