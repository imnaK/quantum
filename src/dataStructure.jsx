import Quantum from "./quantum";
import InputField from "./inputField";

import * as fs from "fs";
import branca from "branca";
import crypto from "crypto";
import { eventNames } from "process";

const dataDirectory = __dirname + "/../quantum/";
const userId = BdApi.Webpack.getModule(
  BdApi.Webpack.Filters.byKeys("getCurrentUser")
).getCurrentUser().id;

let dataObject = {};

export default class dataStructure {
  constructor() {
    //const XChaCha20_Poly1305 = new branca();
    //const key1 = scryptSync("password", userId, 64);

    showPasswordModal((value) => {
      console.log("Password confirmed - Value: " + value);
    });
  }

  save() {
    let dataJSON = JSON.stringify(dataObject);

    if (!fs.existsSync(dataDirectory)) {
      fs.mkdirSync(dataDirectory, { recursive: true });
    }
    fs.writeFile(
      dataDirectory + "data_" + userId,
      Buffer.from(dataObject),
      function (err) {
        if (err) throw err;
        console.log(Quantum.logPrefix + "Saved data");
      }
    );
  }

  get(key) {
    return dataObject[key];
  }

  set(key, value) {
    dataObject[key] = value;
  }

  encrypt() {}
}

function showPasswordModal(callback) {
  const inputRef = BdApi.React.createRef();

  const handleConfirm = () => {
    callback(inputRef.current.getValue());
    BdApi.findModuleByProps("closeModal").closeModal(modalId);
  }

  let modalId = BdApi.UI.showConfirmationModal(
    "Quantum Password",
    <InputField ref={inputRef} handleConfirm={handleConfirm} />,
    {
      confirmText: "Enter",
      cancelText: "Nevermind",
      onConfirm: handleConfirm,
      onCancel: () => console.log("Pressed 'Nevermind'"),
    }
  );
}