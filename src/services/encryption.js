import branca from "branca";
import * as logger from "@utils/logger";
import { QUANTUM_PREFIX } from "@utils/constants";
import secret from "/.secret.json";

const XChaCha20_Poly1305 = new branca(secret.key);

export function encryptMessage(message) {
  try {
    const messageWithoutPrefix = message.substring(QUANTUM_PREFIX.length);
    const encryptedMessage = XChaCha20_Poly1305.encode(messageWithoutPrefix);
    return QUANTUM_PREFIX + encryptedMessage;
  } catch (e) {
    logger.error(e);
  }
}

export function decryptMessage(message) {
  const decoder = new TextDecoder();
  const decryptedUint8Array = XChaCha20_Poly1305.decode(message.substring(QUANTUM_PREFIX.length));
  const decodedMessage = decoder.decode(decryptedUint8Array);
  return decodedMessage;
}
