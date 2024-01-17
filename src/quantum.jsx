import dataStructure from "./dataStructure";
import secret from "./.secret.json";
import stylesheet from "./stylesheet.css";

import branca from "branca";
const XChaCha20_Poly1305 = new branca(secret.key);

import quantumIcon from '../assets/images/quantum.svg';


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

  // Encrypt message before sending, if it starts with the command prefix
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

    // Test if css is used in arguments
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

  // Return the text sum of all children of an element
  getAllTextOfElement(element) {
    const children = Array.from(element.querySelectorAll("*"));
    const text = children.map((child) => child.textContent.replace(/\s/g, "")).join("");
    return text;
  }

  // Create and append decrypt button to message context menu
  contextMenuCallback = (tree, _) => {
    this.messageId = _.message.id;
    const messageContentElement = document.querySelector("#message-content-" + this.messageId);
    const text = this.getAllTextOfElement(messageContentElement);

    // Checks if it's a Quantum message
    if (text.startsWith(this.commandPrefix)) {
      const quantumClass = "quantum";

      // Checks if the message is encrypted, then adds a decrypt button
      if (messageContentElement.querySelector("." + quantumClass) === null) {
        tree.props.children[2].props.children.splice(
          4,
          0,
          ContextMenu.buildItem({
            label: "Nachricht entschlüsseln",
            type: "text",
            icon: () => {
              return <div className="quantum context-menu icon" dangerouslySetInnerHTML={{ __html: quantumIcon }} />;
            },
            action: (e) => {
              const decoder = new TextDecoder();

              if (text.startsWith(this.commandPrefix)) {
                let decryptedUint8Array = XChaCha20_Poly1305.decode(text.substring(this.commandPrefix.length));
                let decodedMessage = decoder.decode(decryptedUint8Array);

                let allSpanElements = messageContentElement.querySelectorAll("span");
                allSpanElements.forEach((element) => {
                  element.style.display = "none";
                });

                let firstSpanElement = document.createElement("span");
                firstSpanElement.className = quantumClass;
                firstSpanElement.style.color = "DeepSkyBlue";
                firstSpanElement.textContent = this.commandPrefix;
                messageContentElement.appendChild(firstSpanElement);

                let secondSpanElement = document.createElement("span");
                secondSpanElement.className = quantumClass;
                secondSpanElement.textContent = decodedMessage;
                messageContentElement.appendChild(secondSpanElement);
              }
            },
          })
        );
      }
      // If the message is already decrypted, add button which shows the original message
      else {
        tree.props.children[2].props.children.splice(
          4,
          0,
          ContextMenu.buildItem({
            label: "Original anzeigen",
            type: "text",
            icon: () => {
              return <div className="quantum context-menu icon" dangerouslySetInnerHTML={{ __html: quantumIcon }} />;
            },
            action: (e) => {
              let allQuantumElements = messageContentElement.querySelectorAll("." + quantumClass);
              allQuantumElements.forEach((element) => {
                messageContentElement.removeChild(element);
              });

              let allSpanElements = messageContentElement.querySelectorAll("span");
              allSpanElements.forEach((element) => {
                element.removeAttribute("style");
              });
            },
          })
        );
      }
    }
  };
}
