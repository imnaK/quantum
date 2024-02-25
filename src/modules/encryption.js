import branca from "branca";
import * as log4q from "@utils/log4q";
import { QUANTUM_PREFIXES } from "@utils/constants";
import secret from "/.secret.json";

const XChaCha20_Poly1305 = new branca(secret.key);

export function encryptMessage(message, prefix) {
  try {
    const messageWithoutPrefix = message.substring(prefix.length);
    const encryptedMessage = XChaCha20_Poly1305.encode(messageWithoutPrefix);
    return prefix + encryptedMessage;
  } catch (e) {
    log4q.error(e);
  }
}

export function decryptMessage(message, prefix) {
  const decoder = new TextDecoder();
  const decryptedUint8Array = XChaCha20_Poly1305.decode(
    message.substring(prefix.length)
  );
  const decodedMessage = decoder.decode(decryptedUint8Array);
  return decodedMessage;
}
