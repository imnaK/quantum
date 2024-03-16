import dataStructure from "@modules/dataStructure";
import log4q from "@utils/log4q";
import Meta from "@meta";
import enc from "@modules/encryptionFileManager";
import { encryptMessage, decryptMessage } from "@modules/encryption";
import {
  QUANTUM_PREFIXES,
  QUANTUM_CLASS,
  QUANTUM_NAME,
} from "@utils/constants";
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
import "@utils/getQuantumMessage";
import { exchange } from "@modules/authentication";

import secret from "/.secret.json"; // Remove after testing
import * as naclUtil from "tweetnacl-util"; // Remove after testing

const { Patcher, Webpack, ContextMenu } = BdApi;

async function exampleEnc() {
  // initialize qef
  enc.init();
  await enc.setMasterPassword("mypassword");
  enc.readData();

  // set channel keys
  enc.setChannelKey("231692919638065153", "sec-ret-key-yam");
  enc.setChannelKey("446683526226509827", "sec-ret-key-haz");

  // output data and write to file
  enc.printData();
  enc.writeData();
}

function exampleExchange() {
  const keyPair1 = exchange.generateKeyPair();
  const keyPair2 = exchange.generateKeyPair();

  const testHex = secret.key;
  console.log("Encrypting this Hex: ", testHex);

  let encrypted = exchange.encrypt(
    naclUtil.encodeBase64(keyPair2.publicKey),
    keyPair1,
    testHex
  );
  let decrypted = exchange.decrypt(keyPair2, encrypted);
  console.log("Decrypted Hex: ", decrypted);

  const testString = "Hello Quantum!";
  console.log("Encrypting this String: ", testString);

  encrypted = exchange.encrypt(
    naclUtil.encodeBase64(keyPair2.publicKey),
    keyPair1,
    testString
  );
  decrypted = exchange.decrypt(keyPair2, encrypted);
  console.log("Decrypted String: ", decrypted);
}

export default class Quantum {
  data = null;

  constructor(meta) {
    Object.assign(Meta, meta);
  }

  start() {
    exampleEnc();
    // exampleExchange();

    // this.data = new dataStructure();
    BdApi.DOM.addStyle(Meta.name, mainStyles);
    i18nInit();
    this.patchSendMessage();
    this.patchSendMessageAttach();
    this.patchSwitchAccount();
    this.patchMessageContextMenu();
    this.patchUserContextMenu();
  }

  stop() {
    // enc.writeData();
    // enc.deconstruct();
    BdApi.DOM.removeStyle(Meta.name);
    i18nCleanup();
    Patcher.unpatchAll(QUANTUM_NAME);
    this.unpatchMessageContextMenu();
    this.unpatchUserContextMenu();
  }

  // Catch regular sent messages
  patchSendMessage() {
    const _sendMessageModule = Webpack.getModule(
      Webpack.Filters.byKeys("_sendMessage")
    );

    Patcher.before(QUANTUM_NAME, _sendMessageModule, "sendMessage", (...args) =>
      this.handleMessageSend(...args)
    );
  }

  // Catch sent messages with attachments
  patchSendMessageAttach() {
    const uploadFilesModule = Webpack.getModule(
      Webpack.Filters.byKeys("uploadFiles")
    );

    Patcher.before(
      QUANTUM_NAME,
      uploadFilesModule,
      "uploadFiles",
      (...args) => {
        this.handleMessageSend(...args);
      }
    );

    Patcher.before(QUANTUM_NAME, uploadFilesModule, "cancel", (...args) => {
      this.handleMessageAttachCancel(...args);
    });
  }

  patchSwitchAccount() {
    const switchAccountModule = Webpack.getModule(
      Webpack.Filters.byKeys("switchAccount")
    );

    Patcher.after(
      QUANTUM_NAME,
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
      this.messageContextMenuCallback.bind(this)
    );
  }

  patchUserContextMenu() {
    this.unpatchUserContextMenu = ContextMenu.patch(
      "user-context",
      this.userContextMenuCallback.bind(this)
    );
  }

  // Encrypt message before sending
  handleMessageSend(_, args) {
    const message = args[1] ?? args[0].parsedMessage,
      content = message.content,
      quantumMessage = content.getQuantumMessage();
      quantumMessage.prefix && !quantumMessage.task && (message.content = encryptMessage(content, quantumMessage.prefix));
  }

  handleMessageAttachCancel(_, args) {
    const content = args[0].draftContent,
    quantumMessage = content.getQuantumMessage();
    if (quantumMessage.prefix  && !quantumMessage.task ) {
      const decryptedText = decryptMessage(content, quantumMessage.prefix);
      args[0].draftContent = quantumMessage.prefix + decryptedText;
    }
  }

  userContextMenuCallback = (tree, contextData) => {
    const keyPair = enc.getExchangeKeyPair();
    const initItem = createContextMenu(
      ContextMenu,
      t("request_encryption"),
      (event) => exchange.performInit(event, contextData, keyPair)
    );
    insertIntoTree(tree, initItem, 7, 2, 0);
  };

  // Create and append decrypt button to message context menu
  messageContextMenuCallback = (tree, contextData) => {
    const messageElement = document.getElementById(
      "message-content-" + contextData.message.id
    );
    const messageContent = getAllTextOfElement(messageElement);

    // Checks if it's a Quantum message
    const quantumMessage = messageContent.getQuantumMessage();
    if (quantumMessage) {
      if (!quantumMessage.task) {
        // Checks if the message is encrypted, then adds a decrypt button
        if (messageElement.querySelector(`.${QUANTUM_CLASS}`) === null) {
          const performDecryptAction = decryptAction(
            messageElement,
            messageContent,
            quantumMessage.prefix
          );
          const decryptItem = createContextMenu(
            ContextMenu,
            t("decrypt_message"),
            performDecryptAction
          );
          insertIntoTree(tree, decryptItem, 2, 4);
        }
        // If the message is already decrypted, add button which shows the original message
        else {
          const performOriginalAction = originalAction(messageElement);
          const originalItem = createContextMenu(
            ContextMenu,
            t("show_original"),
            performOriginalAction
          );
          insertIntoTree(tree, originalItem, 2, 4);
        }
      } else if (quantumMessage.task === "request") {
        const acceptItem = createContextMenu(
          ContextMenu,
          t("accept_request"),
          () => {
            console.log("Accepting request: ", quantumMessage);
          }
        );
        insertIntoTree(tree, acceptItem, 2, 4);
      }
    }
  };
}

function insertIntoTree(tree, item, ...position) {
  let node = tree;

  for (let i = 0; i < position.length - 1; i++) {
    node = node.props.children[position[i]];
  }

  node.props.children.splice(position[position.length - 1], 0, item);
}

const decryptAction = (messageElement, message, prefix) => (e) => {
  const decryptedMessage = decryptMessage(message, prefix);

  // Hide original message
  modifyElements(messageElement, "span", (element) => {
    element.style.display = "none";
  });

  // Create and append prefix
  messageElement.append(
    createSpan(QUANTUM_CLASS, prefix, {
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
