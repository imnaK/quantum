import * as nacl from "tweetnacl";
import * as naclUtil from "tweetnacl-util";
import Quantum from "@quantum";
import * as log4q from "@utils/log4q";

export default class authentication {
  constructor() {
    log4q.log(Quantum.data.getKey("keyPair"));
    //Quantum.log("Quantum.data.getKey(\"keyPair\")", Quantum.data.getKey("keyPair") || nacl.box.keyPair());
    // if (this.keyPair = Quantum.data.getKey("keyPair") == undefined) {
    //   this.keyPair = nacl.box.keyPair();
    //   Quantum.data.setKey("keyPair", this.keyPair);
    // }
  }

  getPublicKey() {
    return this.keyPair.publicKey;
  }
  getPrivateKey() {
    return this.keyPair.secretKey;
  }

  encrypt(receiverPublicKey, msgParams) {
    const ephemeralKeyPair = nacl.box.keyPair();
    const pubKeyUInt8Array = naclUtil.decodeBase64(receiverPublicKey);
    const msgParamsUInt8Array = naclUtil.decodeUTF8(msgParams);
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const encryptedMessage = nacl.box(
      msgParamsUInt8Array,
      nonce,
      pubKeyUInt8Array,
      ephemeralKeyPair.secretKey
    );
    return {
      ciphertext: naclUtil.encodeBase64(encryptedMessage),
      ephemPubKey: naclUtil.encodeBase64(ephemeralKeyPair.publicKey),
      nonce: naclUtil.encodeBase64(nonce),
    };
  }

  decrypt(receiverSecretKey, encryptedData) {
    const receiverSecretKeyUint8Array = naclUtil.decodeBase64(receiverSecretKey);
    const nonce = naclUtil.decodeBase64(encryptedData.nonce);
    const ciphertext = naclUtil.decodeBase64(encryptedData.ciphertext);
    const ephemPubKey = naclUtil.decodeBase64(encryptedData.ephemPubKey);
    const decryptedMessage = nacl.box.open(
      ciphertext,
      nonce,
      ephemPubKey,
      receiverSecretKeyUint8Array
    );
    return naclUtil.encodeUTF8(decryptedMessage);
  }

  sendChatMessage(content, channelId) {
    Webpack.getModule(
      Webpack.Filters.byKeys("sendMessage", "sendBotMessage")
    ).sendMessage(channelId, {
      content: content,
      invalidEmojis: [],
      tts: false,
      validNonShortcutEmojis: [],
    });
  }
}
