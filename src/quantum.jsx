import dataStructure from "@modules/dataStructure";
import log4q from "@utils/log4q";
import Meta from "@meta";
import qef from "@modules/qef";
import * as auth from "@modules/authentication";
import { encryptMessage, decryptMessage } from "@modules/encryption";
import { QUANTUM_PREFIX, QUANTUM_CLASS } from "@utils/constants";
import {
  getAllTextOfElement,
  createContextMenu,
  modifyElements,
  createSpan,
} from "@utils";
import {
  init as i18nInit,
  cleanup as i18nCleanup,
  translate as t,
} from "@i18n";
import mainStyles from "@assets/styles/main.scss";

const { Patcher, Webpack, ContextMenu } = BdApi;

async function exampleQef() {
  const userId = BdApi.Webpack.getModule(
    BdApi.Webpack.Filters.byKeys("getCurrentUser")
  ).getCurrentUser().id;

  qef.init(userId);
  await qef.setMasterPassword("mypassword");
  qef.readData();
  if (qef.dataExist()) {
    log4q.log("%cData exists", "color: green");
  } else {
    log4q.log("%cData does not exist", "color: red");
    keyPair = auth.generateExchangeKeyPair();
    qef.setExchangeKeyPair(keyPair);
    qef.setChannelKey("231692919638065153", "sec-ret-key-yam");
    qef.setChannelKey("446683526226509827", "sec-ret-key-haz");
  }
  qef.printData();
  qef.writeData();
}

export default class Quantum {
  data = null;

  constructor(meta) {
    Object.assign(Meta, meta);
  }

  start() {
    exampleQef();

    // this.data = new dataStructure();
    BdApi.DOM.addStyle(Meta.name, mainStyles);
    i18nInit();
    this.patchSendMessage();
    this.patchSwitchAccount();
    this.patchMessageContextMenu();
  }

  stop() {
    qef.writeData();
    qef.deconstruct();

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
