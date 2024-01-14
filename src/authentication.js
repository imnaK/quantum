import * as nacl from "tweetnacl";
import * as naclUtil from "tweetnacl-util";
import Quantum from "./quantum";

export default class authentication {
  constructor() {
    if (Quantum.data.getKey("keyPair") == undefined) {
      this.keyPair = nacl.box.keyPair();
      Quantum.setKey("keyPair", this.keyPair);
    } 
    
  }

  getPublicKey() {
    return this.keyPair.publicKey;
  }
  getPrivateKey() {
    return this.keyPair.secretKey;
  }

  sendChatMessage(content, channelId) {
    Webpack.getModule(Webpack.Filters.byKeys("sendMessage", "sendBotMessage")).sendMessage(channelId, {
      content: content,
      invalidEmojis: [],
      tts: false,
      validNonShortcutEmojis: [],
    });
  }
}
