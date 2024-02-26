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
import "@utils/startsWithAny";

const { Patcher, Webpack, ContextMenu } = BdApi;

async function exampleEnc() {
  // get current user id
  const userId = BdApi.Webpack.getModule(
    BdApi.Webpack.Filters.byKeys("getCurrentUser")
  ).getCurrentUser().id;

  // initialize qef
  enc.init(userId);
  await enc.setMasterPassword("mypassword");
  enc.readData();

  // set channel keys
  enc.setChannelKey("231692919638065153", "sec-ret-key-yam");
  enc.setChannelKey("446683526226509827", "sec-ret-key-haz");

  // output data and write to file
  enc.printData();
  enc.writeData();
}

export default class Quantum {
  data = null;

  constructor(meta) {
    Object.assign(Meta, meta);
  }

  start() {
    // exampleEnc();

    // this.data = new dataStructure();
    BdApi.DOM.addStyle(Meta.name, mainStyles);
    i18nInit();
    this.patchSendMessage();
    this.patchSendMessageAttach();
    this.patchSwitchAccount();
    this.patchMessageContextMenu();
  }

  stop() {
    // enc.writeData();
    // enc.deconstruct();
    BdApi.DOM.removeStyle(Meta.name);
    i18nCleanup();
    Patcher.unpatchAll(QUANTUM_NAME);
    this.unpatchMessageContextMenu();
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
      this.contextMenuCallback.bind(this)
    );
  }

  // Encrypt message before sending
  handleMessageSend(_, args) {
    const message = args[1] || args[0].parsedMessage,
      content = message.content,
      prefix = content.startsWithAny(QUANTUM_PREFIXES);
    prefix && (message.content = encryptMessage(content, prefix));
  }

  handleMessageAttachCancel(_, args) {
    const content = args[0].draftContent;
    const prefix = content.startsWithAny(QUANTUM_PREFIXES);
    if (prefix) {
      const decryptedText = decryptMessage(content, prefix);
      args[0].draftContent = prefix + decryptedText;
    }
  }

  // Create and append decrypt button to message context menu
  contextMenuCallback = (tree, d) => {
    const messageElement = document.getElementById(
      "message-content-" + d.message.id
    );
    const messageContent = getAllTextOfElement(messageElement);

    // Checks if it's a Quantum message
    const prefix = messageContent.startsWithAny(QUANTUM_PREFIXES);
    if (prefix) {
      // Checks if the message is encrypted, then adds a decrypt button
      if (messageElement.querySelector(`.${QUANTUM_CLASS}`) === null) {
        const performDecryptAction = decryptAction(
          messageElement,
          messageContent,
          prefix
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
