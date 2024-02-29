import * as nacl from "tweetnacl";
import * as naclUtil from "tweetnacl-util";
import branca from "branca";
import scryptjs from "scrypt-js";
import { isBase64 } from "@utils";

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

const exchange = {
  generateKeyPair() {
    return nacl.box.keyPair();
  },

  // encrypts a payload (utf8 or base64) and outputs a decryptable object
  encrypt(targetPublicKey, keyPair, payload) {
    const payloadBytes =
      (isBase64(payload) && naclUtil.decodeBase64(payload)) ||
      naclUtil.decodeUTF8(payload);
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const targetPublicKeyBytes = naclUtil.decodeBase64(targetPublicKey);
    const encryptedPayload = nacl.box(
      payloadBytes,
      nonce,
      targetPublicKeyBytes,
      keyPair.secretKey
    );
    return {
      payload: naclUtil.encodeBase64(encryptedPayload),
      pubKey: naclUtil.encodeBase64(keyPair.publicKey),
      nonce: naclUtil.encodeBase64(nonce),
    };
  },

  // decrypts a payload and outputs the decrypted string (utf8 or base64)
  decrypt(keyPair, encryptedData) {
    const secretKeyBytes = keyPair.secretKey;
    const nonceBytes = naclUtil.decodeBase64(encryptedData.nonce);
    const payloadBytes = naclUtil.decodeBase64(encryptedData.payload);
    const pubKeyBytes = naclUtil.decodeBase64(encryptedData.pubKey);
    const decryptedPayload = nacl.box.open(
      payloadBytes,
      nonceBytes,
      pubKeyBytes,
      secretKeyBytes
    );

      try {
        return naclUtil.encodeUTF8(decryptedPayload);
      } catch (err) {
        return naclUtil.encodeBase64(decryptedPayload);
      }
  },
};

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

export { generateMasterPassword, sendChatMessage, exchange };
