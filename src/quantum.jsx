import dataStructure from "@modules/dataStructure";
import {
  getAllTextOfElement,
  createContextMenu,
  modifyElements,
  createSpan,
} from "@utils";
import { encryptMessage, decryptMessage } from "@modules/encryption";
import * as log4q from "@utils/log4q";
import mainStyles from "@assets/styles/main.scss";
import { QUANTUM_PREFIXES, QUANTUM_CLASS } from "@utils/constants";
import Meta from "@meta";
import { init as i18nInit, cleanup as i18nCleanup, translate as t } from "@i18n";
import "@utils/startsWithAny";

const { Patcher, Webpack, ContextMenu } = BdApi;

export default class Quantum {
  data = null;

  constructor(meta) {
    Object.assign(Meta, meta);
  }

  start() {
    //this.data = new dataStructure();
    BdApi.DOM.addStyle(Meta.name, mainStyles);
    i18nInit();
    this.patchSendMessage();
    this.patchSwitchAccount();
    this.patchMessageContextMenu();
  }

  stop() {
    Patcher.unpatchAll("encryptMessage");
    i18nCleanup();
    this.unpatchMessageContextMenu();
    BdApi.DOM.removeStyle(Meta.name);
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
        log4q.log(
          "Last User ID: ",
          this.data.userId,
          "\nSwitched User ID to: ",
          args[0]
        );
        if (this.data.userId !== args[0]) {
          this.data = new dataStructure(args[0]);
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
    if (message.startsWithAny(QUANTUM_PREFIXES))
      args[1].content = encryptMessage(message);
  }

  // Create and append decrypt button to message context menu
  contextMenuCallback = (tree, d) => {
    const messageElement = document.getElementById(
      "message-content-" + d.message.id
    );
    const messageContent = getAllTextOfElement(messageElement);

    // Checks if it's a Quantum message
    if (messageContent.startsWithAny(QUANTUM_PREFIXES)) {
      // Checks if the message is encrypted, then adds a decrypt button
      if (messageElement.querySelector(`.${QUANTUM_CLASS}`) === null) {
        const performDecryptAction = decryptAction(
          messageElement,
          messageContent
        );
        const decryptItem = createContextMenu(
          ContextMenu,
          t("decrypt_message"),
          performDecryptAction
        );
        insertIntoTree(tree, 4, decryptItem);
      }
      // If the message is already decrypted, add button which shows the original message
      else {
        const performOriginalAction = originalAction(messageElement);
        const originalItem = createContextMenu(
          ContextMenu,
          t("show_original"),
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
    createSpan(QUANTUM_CLASS, QUANTUM_PREFIXES, {
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
