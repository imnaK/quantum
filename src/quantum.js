import dataStructure from "./dataStructure";
import secret from "./.secret.json";
import stylesheet from "./stylesheet.css";

import branca from "branca";

const XChaCha20_Poly1305 = new branca(secret.key);
const { Patcher, Webpack, ContextMenu } = BdApi;

export default class Quantum {
  commandPrefix = "q:";
  data = null;

  constructor(meta) {
    this.meta = meta;
  }

  start() {
    //this.data = new dataStructure();
    BdApi.DOM.addStyle(this.meta.name, stylesheet);

    let _sendMessageModule = Webpack.getModule(Webpack.Filters.byKeys("_sendMessage"));
    BdApi.Patcher.before("encryptMessage", _sendMessageModule, "sendMessage", this.handleMessageSend.bind(this));

    let switchAccountModule = Webpack.getModule(Webpack.Filters.byKeys("switchAccount"));
    Patcher.after("switchAccount", switchAccountModule, "switchAccount", (_, args) => {
      Quantum.log("Last User ID: ", this.data.userId, "\nSwitched User ID to: ", args[0]);
      if (this.data.userId !== args[0]) {
        this.data = new dataStructure(args[0]);
      }
    });

    this.unpatchMessageContextMenu = ContextMenu.patch("message", this.contextMenuCallback.bind(this));
  }

  stop() {
    Patcher.unpatchAll("encryptMessage");
    this.unpatchMessageContextMenu();

    BdApi.DOM.removeStyle(this.meta.name);
  }

  // Encrypts message before sending
  handleMessageSend(_, args) {
    try {
      if (args[1].content.startsWith(this.commandPrefix)) {
        let message = args[1].content.substring(this.commandPrefix.length);
        let encryptedMessage = XChaCha20_Poly1305.encode(message);
        args[1].content = this.commandPrefix + encryptedMessage;
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

  // Returns the text sum of all children of an element
  getAllTextOfElement(element) {
    const children = Array.from(element.querySelectorAll("*"));
    const text = children.map((child) => child.textContent.replace(/\s/g, "")).join("");
    return text;
  }

  // Creates and appends decrypt button to message context menu
  contextMenuCallback = (tree, _) => {
    this.messageId = _.message.id;
    Quantum.log("props: ", tree.props.children);

    tree.props.children[2].props.children.splice(
      4,
      0,
      ContextMenu.buildItem({
        label: "Nachricht entschlüsseln",
        type: "text",
        icon: () => {
          return BdApi.React.createElement("img", {
            src: "https://wiki.gbl.gg/images/d/d1/Among-Us-Red-Crewmate.png", // For testing, because funny
            width: "auto",
            height: "100%",
          });
        },
        action: (e) => {
          let spanElement = document.querySelector("#message-content-" + this.messageId);

          const text = this.getAllTextOfElement(spanElement);
          const decoder = new TextDecoder();

          if (text.startsWith(this.commandPrefix)) {
            let decryptedUint8Array = XChaCha20_Poly1305.decode(text.substring(this.commandPrefix.length));
            let decodedMessage = decoder.decode(decryptedUint8Array);

            spanElement.innerHTML = "";

            let firstSpanElement = document.createElement("span");
            firstSpanElement.style.color = "DeepSkyBlue";
            firstSpanElement.textContent = this.commandPrefix;
            spanElement.appendChild(firstSpanElement);

            let secondSpanElement = document.createElement("span");
            secondSpanElement.textContent = decodedMessage;
            secondSpanElement.id = "decrypted-message-" + this.messageId;
            spanElement.appendChild(secondSpanElement);
          }
        },
      })
    );
  };
}
