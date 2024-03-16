import * as nacl from "tweetnacl";
import * as naclUtil from "tweetnacl-util";
import branca from "branca";
import scryptjs from "scrypt-js";
import { isBase64 } from "@utils";
import log4q from "@utils/log4q";
import { encode, decode } from "@msgpack/msgpack";

const { Webpack } = BdApi;

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
  ENQ: 0x05,
  ACK: 0x06,
  NAK: 0x15,
  CAN: 0x18,

  TASKS: ["request"],

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
      payload: encryptedPayload,
      pubKey: keyPair.publicKey,
      nonce: nonce,
    };
  },

  // decrypts a payload and outputs the decrypted string (utf8 or base64)
  decrypt(keyPair, encryptedData) {
    const decryptedPayload = nacl.box.open(
      encryptedData.payload,
      encryptedData.nonce,
      encryptedData.pubKey,
      keyPair.secretKey
    );

    try {
      return naclUtil.encodeUTF8(decryptedPayload);
    } catch {
      return naclUtil.encodeBase64(decryptedPayload);
    }
  },

  performInit(event, contextData, keyPair) {
    const testObject = { flag: this.ENQ, key: keyPair.publicKey };
    log4q.log("request", testObject);
    sendExchangePacket(
      contextData.channel.id,
      testObject,
      "q:request\n"
    );
  },
};

function sendExchangePacket(channelId, object, prefix) {
  const functionName = sendExchangePacket.name;
  log4q.log("%c" + functionName, "color: hotpink; font-weight: bolder;");

  const binary = log4q.printExecutionTime(() => encode(object));

  const base64 = naclUtil.encodeBase64(binary);

  const promise = sendMessage(
    (prefix ?? "") + base64,
    channelId,
    (response) => {
      const messageId = response.body.id;
      removeEmbeds(channelId, messageId);
      openChannel(channelId);
    }
  );
}

function randomBytes(length) {
  let key = new Uint8Array(length);
  window.crypto.getRandomValues(key);
  return key;
}

function removeEmbeds(channelId, messageId) {
  const module = Webpack.getModule(Webpack.Filters.byKeys("suppressEmbeds"));
  module.suppressEmbeds(channelId, messageId);
}

function openChannel(channelId) {
  const module = Webpack.getModule(
    Webpack.Filters.byKeys("openPrivateChannel")
  );
  const channel = Webpack.getStore("ChannelStore").getChannel(channelId);
  module.openPrivateChannel(channel.recipients[0]);
}

function sendMessage(content, channelId, callback) {
  const module = Webpack.getModule(
    Webpack.Filters.byKeys("sendMessage", "sendBotMessage")
  );
  const promise = module.sendMessage(channelId, {
    content: content,
    invalidEmojis: [],
    tts: false,
    validNonShortcutEmojis: [],
  });
  callback && promise.then(callback);
  promise.catch((error) => {
    log4q.error("Message couldn't be sent: ", error);
  });
}

export { generateMasterPassword, sendMessage, exchange };
