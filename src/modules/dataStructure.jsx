import * as fs from "fs";
import branca from "branca";
import * as scryptJs from "scrypt-js";
import * as log4q from "@utils/log4q";
import InputField from "@components/InputField";
import { classNames } from "@utils";
import { QUANTUM_CLASS } from "@utils/constants";
import Meta from "@meta";

const { React } = BdApi;

const dataDirectory = __dirname + "/../quantum/";

export default class dataStructure {
  #hashedPassword = null;
  #dataObject = {};

  constructor(userId) {
    this.userId =
      userId == null
        ? BdApi.Webpack.getModule(
            BdApi.Webpack.Filters.byKeys("getCurrentUser")
          ).getCurrentUser().id
        : userId;

    this.showPasswordModal(async (password) => {
      log4q.log("Hashing password...");

      const encoder = new TextEncoder();
      let passwordUint8Array = encoder.encode(password);
      let userIdUint8Array = encoder.encode(this.userId);
      const N = 1024,
        r = 8,
        p = 1,
        dkLen = 32;
      this.#hashedPassword = await scryptJs.scrypt(
        passwordUint8Array,
        userIdUint8Array,
        N,
        r,
        p,
        dkLen,
        (progress) => {
          console.log(Math.trunc(100 * progress) + "%");
        }
      );
      // log4q.log([...this.#hashedPassword].map((x) => x.toString(16).padStart(2, "0")).join(""));
      this.load();
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
    let encryptedData;
    try {
      encryptedData = fs.readFileSync(dataDirectory + "data_" + this.userId);
    } catch (error) {
      this.save();
      return 0;
    }
    try {
      let decryptedJsonData = this.decrypt(encryptedData);
      this.#dataObject = JSON.parse(decryptedJsonData);
    } catch (error) {
      log4q.error("Wrong password or data file corrupted\n", error);
      return 0;
    }
    return 1;
  }

  save() {
    let jsonData = JSON.stringify(this.#dataObject);

    let encryptedData = this.encrypt(jsonData);

    if (!fs.existsSync(dataDirectory)) {
      fs.mkdirSync(dataDirectory, { recursive: true });
    }
    fs.writeFile(
      dataDirectory + "data_" + this.userId,
      Buffer.from(encryptedData),
      function (error) {
        if (error) {
          log4q.error(error);
          return -1;
        }
        log4q.log("Saved data to file");
      }
    );
  }

  get(key) {
    return this.#dataObject[key];
  }

  set(key, value) {
    this.#dataObject[key] = value;
    this.save();
  }

  showPasswordModal(
    callback,
    schinken // I asked how i should name this parameter and the answer was schinken. ¯\_(ツ)_/¯
  ) {
    const inputRef = BdApi.React.createRef();
    const closeModule = BdApi.Webpack.getModule(
      BdApi.Webpack.Filters.byKeys("closeModal")
    );

    const handleConfirm = () => {
      callback(inputRef.current.getValue());

      // Close modal
      closeModule.closeModal(modalId);
    };

    const handleCancel = () => {
      // Close modal
      closeModule.closeModal(modalId);

      // disable this plugin
      BdApi.Plugins.disable(Meta.name);
    }

    let modalId = BdApi.UI.showConfirmationModal(
      "Quantum Password", // Try BdApi.React.Fragment
      <React.Fragment>
        <span className={classNames(QUANTUM_CLASS, "inputErrorText")}>
          {schinken || ""}
        </span>
        <InputField
          ref={inputRef}
          handleConfirm={handleConfirm}
          type="password"
        />
      </React.Fragment>,
      {
        confirmText: "Enter",
        cancelText: "Nevermind",
        onConfirm: handleConfirm,
        onCancel: handleCancel,
      }
    );
  }
}
