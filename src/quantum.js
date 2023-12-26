import dataStructure from "./dataStructure";
import secret from "./.secret.json";

import branca from "branca";

const XChaCha20_Poly1305 = new branca(secret.key);
const { Patcher, Webpack } = BdApi;

export default class Quantum {
  logPrefix = "Quantum - ";
  commandPrefix = "q:";

  constructor(meta) {}

  start() {
    let _sendMessage = Webpack.getModule(
      Webpack.Filters.byProps("_sendMessage")
    );
    BdApi.Patcher.before(
      "encryptMessage",
      _sendMessage,
      "sendMessage",
      (_, args) => {
        if (args[1].content.startsWith(this.commandPrefix)) {
          let message = args[1].content.substring(this.commandPrefix.length);
          let encryptedMessage = XChaCha20_Poly1305.encode(message);
          args[1].content = this.commandPrefix + encryptedMessage;
        }
      }
    );

    let dispatchModule = BdApi.findModuleByProps("dispatch", "subscribe");
    Patcher.after(
      "receiveMessage",
      dispatchModule,
      "dispatch",
      this.handleMessage.bind(this)
    );
  }

  stop() {
    Patcher.unpatchAll("encryptMessage");
    Patcher.unpatchAll("receiveMessage");
  }

  handleMessage(_, args) {
    try {
      if (args[0].type !== "MESSAGE_CREATE") return;
      let { message } = args[0];
      const decoder = new TextDecoder();
      if (message.content.startsWith(this.commandPrefix)) {
        console.log("Detected quantum message! I shall decrypt...");
        let decryptedUint8Array = XChaCha20_Poly1305.decode(
          message.content.substring(this.commandPrefix.length)
        );
        let decodedMessage = decoder.decode(decryptedUint8Array);
        console.log(
          "%c" +
            message.author.globalName +
            " %c" +
            message.author.username +
            "%c\n" +
            decodedMessage,
          "font-size:1.3em; font-weight:bolder; margin-bottom:0.3em;",
          "font-weight:100;",
          "font-size:1.3em;"
        );
      }
    } catch (e) {
      console.log(error(`${e}`));
    }
  }

  // getSettingsPanel() {
  //   const data = new dataStructure();

  //   data.encrypt();
  // }
}
