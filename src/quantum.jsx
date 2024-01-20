import dataStructure from "@modules/dataStructure";
import {
  getAllTextOfElement,
  createContextMenu,
  modifyElements,
  createSpan,
} from "@utils";
import { encryptMessage, decryptMessage } from "@modules/encryption";
import * as logger from "@utils/logger";
import mainStyles from "@assets/styles/main.css";
import { QUANTUM_PREFIX, QUANTUM_CLASS } from "@utils/constants";

const { Patcher, Webpack, ContextMenu } = BdApi;

export default class Quantum {
  data = null;

  constructor(meta) {
    this.meta = meta;
  }

  start() {
    // this.data = new dataStructure(this.meta.name);
    BdApi.DOM.addStyle(this.meta.name, mainStyles);
    this.patchSendMessage();
    this.patchSwitchAccount();
    this.patchMessageContextMenu();
  }

  stop() {
    Patcher.unpatchAll("encryptMessage");
    this.unpatchMessageContextMenu();
    BdApi.DOM.removeStyle(this.meta.name);
  }

  patchSendMessage() {
    const _sendMessageModule = Webpack.getModule(
      Webpack.Filters.byKeys("_sendMessage")
    );

    BdApi.Patcher.before(
      "encryptMessage",
      _sendMessageModule,
      "sendMessage",
      (...args) => this.handleMessageSend(...args)
    );
  }

  patchSwitchAccount() {
    const switchAccountModule = Webpack.getModule(
      Webpack.Filters.byKeys("switchAccount")
    );

    Patcher.after(
      "switchAccount",
      switchAccountModule,
      "switchAccount",
      (_, args) => {
        logger.log(
          "Last User ID: ",
          this.data.userId,
          "\nSwitched User ID to: ",
          args[0]
        );
        if (this.data.userId !== args[0]) {
          this.data = new dataStructure(this.meta.name, args[0]);
        }
      }
    );
  }

  patchMessageContextMenu() {
    this.unpatchMessageContextMenu = ContextMenu.patch(
      "message",
      this.contextMenuCallback.bind(this)
    );
  }

  // Encrypt message before sending
  handleMessageSend(_, args) {
    const message = args[1].content;
    if (message.startsWith(QUANTUM_PREFIX))
      args[1].content = encryptMessage(message);
  }

  // Create and append decrypt button to message context menu
  contextMenuCallback = (tree, d) => {
    const messageElement = document.getElementById(
      "message-content-" + d.message.id
    );
    const messageContent = getAllTextOfElement(messageElement);

    // Checks if it's a Quantum message
    if (messageContent.startsWith(QUANTUM_PREFIX)) {
      // Checks if the message is encrypted, then adds a decrypt button
      if (messageElement.querySelector(`.${QUANTUM_CLASS}`) === null) {
        const performDecryptAction = decryptAction(
          messageElement,
          messageContent
        );
        const decryptItem = createContextMenu(
          ContextMenu,
          "Nachricht entschlüsseln",
          performDecryptAction
        );
        insertIntoTree(tree, 4, decryptItem);
      }
      // If the message is already decrypted, add button which shows the original message
      else {
        const performOriginalAction = originalAction(messageElement);
        const originalItem = createContextMenu(
          ContextMenu,
          "Original anzeigen",
          performOriginalAction
        );
        insertIntoTree(tree, 4, originalItem);
      }
    }
  };
}

const insertIntoTree = (tree, position, item) => {
  tree.props.children[2].props.children.splice(position, 0, item);
};

const decryptAction = (messageElement, message) => (e) => {
  const decryptedMessage = decryptMessage(message);

  // Hide original message
  modifyElements(messageElement, "span", (element) => {
    element.style.display = "none";
  });

  // Create and append prefix
  messageElement.append(
    createSpan(QUANTUM_CLASS, QUANTUM_PREFIX, {
      color: "DeepSkyBlue",
    })
  );
  // Create and append decrypted message
  messageElement.append(createSpan(QUANTUM_CLASS, decryptedMessage));
};

const originalAction = (messageElement) => (e) => {
  // Remove all quantum elements
  modifyElements(messageElement, `.${QUANTUM_CLASS}`, (element) => {
    messageElement.removeChild(element);
  });

  // Show original message
  modifyElements(messageElement, "span", (element) => {
    element.removeAttribute("style");
  });
};
