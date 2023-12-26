import Quantum from "./quantum";

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

    this.passwordWindow();
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

  passwordWindow() {

    function InputField(props) {
      return (
        <input
          type="password"
          placeholder={props.placeholder || ""}
          onKeyDown={props?.onKeyDown}
          ref={passwordInput}
        />
      );
    }

    function passwordConfirmed(event) {
      console.log(Quantum.logPrefix + "Enter pressed - Value: ");
    }

    const handleKeyDown = (event) => {
      if (event.key === "Enter") {
        console.log(event.target.value);
        passwordConfirmed();
        BdApi.findModuleByProps("closeModal").closeModal(modalId);
      }
    };

    let modalId = BdApi.UI.showConfirmationModal(
      "Quantum Password",
      <InputField onKeyDown={handleKeyDown} />,
      {
        confirmText: "Enter",
        cancelText: "Nevermind",
        onConfirm: () => passwordConfirmed(),
        onCancel: () => console.log("Pressed 'Nevermind'"),
      }
    );
  }
}
