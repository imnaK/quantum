import dataStructure from "./dataStructure";
import secret from "./.secret.json";
import stylesheet from "./stylesheet.css";

import branca from "branca";

const XChaCha20_Poly1305 = new branca(secret.key);
const { Patcher, Webpack } = BdApi;

export default class Quantum {
  commandPrefix = "q:";
  data = null;

  constructor(meta) {
    this.meta = meta;
  }

  start() {
    // this.data = new dataStructure();
    BdApi.DOM.addStyle(this.meta.name, stylesheet);

    let _sendMessageModule = Webpack.getModule(Webpack.Filters.byKeys("_sendMessage"));
    BdApi.Patcher.before("encryptMessage", _sendMessageModule, "sendMessage", (_, args) => {
      if (args[1].content.startsWith(this.commandPrefix)) {
        let message = args[1].content.substring(this.commandPrefix.length);
        let encryptedMessage = XChaCha20_Poly1305.encode(message);
        args[1].content = this.commandPrefix + encryptedMessage;
      }
    });

    let dispatchModule = Webpack.getModule(Webpack.Filters.byKeys("dispatch", "subscribe"));
    Patcher.after("receiveMessage", dispatchModule, "dispatch", this.handleMessage.bind(this));

    let switchAccountModule = Webpack.getModule(Webpack.Filters.byKeys("switchAccount"));
    Patcher.after("switchAccount", switchAccountModule, "switchAccount", (_, args) => {
      this.data = new dataStructure(args[0]);
      Quantum.log("UserId of constructor: ", this.data.userId, "\nUserId of switchAccount function: ", args[0]);
      this.data.userId = args[0];
    });
  }

  stop() {
    Patcher.unpatchAll("encryptMessage");
    Patcher.unpatchAll("receiveMessage");

    BdApi.DOM.removeStyle(this.meta.name);
  }

  handleMessage(_, args) {
    try {
      if (args[0].type !== "MESSAGE_CREATE") return;
      let { message } = args[0];
      const decoder = new TextDecoder();
      if (message.content.startsWith(this.commandPrefix)) {
        Quantum.log("Detected  message! I shall decrypt...");
        let decryptedUint8Array = XChaCha20_Poly1305.decode(message.content.substring(this.commandPrefix.length));
        let decodedMessage = decoder.decode(decryptedUint8Array);
        Quantum.log(
          "%c" + message.author.globalName + " %c" + message.author.username + "%c\n" + decodedMessage,
          "font-size:1.3em; font-weight:bolder; margin-bottom:0.3em;",
          "font-weight:100;",
          "font-size:1.3em;"
        );
      }
    } catch (e) {
      Quantum.error(e);
    }
  }

  // Console message with prefix
  static consoleMessage(consoleFunction, ...args) {
    let prefix = "[Quantum]";
    let prefixStyle = "color: DeepSkyBlue; font-weight: bolder;";

    // Tests if css is used in arguments
    if (typeof args[0] === "string" && args[0].includes("%c")) {
      args[0] = "%c" + prefix + "%c " + args[0]; // Prepends prefix to first argument & resets styles
      args.splice(1, 0, prefixStyle, ""); // Inserts prefix's style & empty style (reset) before argument's style
      consoleFunction(...args);
    }
    // Otherwise append arguments to end
    else {
      consoleFunction("%c" + prefix, prefixStyle, ...args);
    }
  }
  static log(...args) {
    this.consoleMessage(console.log, ...args);
  }
  static warn(...args) {
    this.consoleMessage(console.warn, ...args);
  }
  static error(...args) {
    this.consoleMessage(console.error, ...args);
  }
}
