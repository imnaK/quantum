import Quantum from "./quantum";
import InputField from "./inputField";

import * as fs from "fs";
import branca from "branca";
import * as scryptJs from "scrypt-js";

const dataDirectory = __dirname + "/../quantum/";

export default class dataStructure {
  #hashedPassword = null;
  #dataObject = {};
  userId = null;

  constructor(userId) {
    // Probably could be refined using Comma Operator
    this.userId =
      userId == null
        ? BdApi.Webpack.getModule(BdApi.Webpack.Filters.byKeys("getCurrentUser")).getCurrentUser().id
        : userId;

    showPasswordModal(async (password) => {
      Quantum.log("Hashing password...");

      const encoder = new TextEncoder();
      let passwordUint8Array = encoder.encode(password);
      let userIdUint8Array = encoder.encode(this.userId);
      const N = 1024,
        r = 8,
        p = 1,
        dkLen = 32;
      this.#hashedPassword = await scryptJs.scrypt(passwordUint8Array, userIdUint8Array, N, r, p, dkLen, (progress) => {
        console.log(Math.trunc(100 * progress) + "%");
      });
      Quantum.log([...this.#hashedPassword].map((x) => x.toString(16).padStart(2, "0")).join(""));
    });
  }

  decrypt(encryptedData) {
    const XChaCha20_Poly1305 = new branca(this.#hashedPassword);
    return XChaCha20_Poly1305.decode(encryptedData);
  }

  encrypt(jsonData) {
    const XChaCha20_Poly1305 = new branca(this.#hashedPassword);
    return XChaCha20_Poly1305.encode(jsonData);
  }

  load() {
    try {
      let encryptedData = fs.readFileSync(dataDirectory + "data_" + this.userId);
      let decryptedJsonData = this.decrypt(encryptedData);
      let dataObject = JSON.parse(decryptedJsonData);

      console.log("Loaded & decrypted data object: ", dataObject);
    } catch (error) {
      Quantum.error(error);
      return -1;
    }
  }

  save() {
    let jsonData = JSON.stringify(this.#dataObject);

    let encryptedData = this.encrypt(jsonData);
    Quantum.log("Encrypted data: ", encryptedData);

    if (!fs.existsSync(dataDirectory)) {
      fs.mkdirSync(dataDirectory, { recursive: true });
    }
    fs.writeFile(dataDirectory + "data_" + this.userId, Buffer.from(encryptedData), function (error) {
      if (error) {
        Quantum.error(error);
        return -1;
      }
      Quantum.log("Saved data to file");
    });
  }

  get(key) {
    return this.#dataObject[key];
  }

  set(key, value) {
    this.#dataObject[key] = value;
  }
}

function showPasswordModal(callback) {
  const inputRef = BdApi.React.createRef();

  const handleConfirm = () => {
    callback(inputRef.current.getValue());
    BdApi.Webpack.getModule(BdApi.Webpack.Filters.byKeys("closeModal")).closeModal(modalId);
  };

  let modalId = BdApi.UI.showConfirmationModal(
    "Quantum Password",
    <InputField ref={inputRef} handleConfirm={handleConfirm} type="password" />,
    {
      confirmText: "Enter",
      cancelText: "Nevermind",
      onConfirm: handleConfirm,
      onCancel: () => Quantum.log("Pressed 'Nevermind'"),
    }
  );
}
