import * as nacl from "tweetnacl";
import * as naclUtil from "tweetnacl-util";
import branca from "branca";
import scryptjs from "scrypt-js";

function generateExchangeKeyPair() {
  return nacl.box.keyPair();
}

async function generateMasterPassword(password, salt) {
  const encoder = new TextEncoder();
  const passwordUint8Array = encoder.encode(password);
  const saltUint8Array = encoder.encode(salt);
  const N = 1024,
    r = 8,
    p = 1,
    dkLen = 32;
  const key = await scryptjs.scrypt(
    passwordUint8Array,
    saltUint8Array,
    N,
    r,
    p,
    dkLen
  );
  return new branca(key);
}

function encrypt(receiverPublicKey, msgParams) {
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

function decrypt(receiverSecretKey, encryptedData) {
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

function sendChatMessage(content, channelId) {
  Webpack.getModule(
    Webpack.Filters.byKeys("sendMessage", "sendBotMessage")
  ).sendMessage(channelId, {
    content: content,
    invalidEmojis: [],
    tts: false,
    validNonShortcutEmojis: [],
  });
}

export {
  generateExchangeKeyPair,
  generateMasterPassword,
  encrypt,
  decrypt,
  sendChatMessage,
};
