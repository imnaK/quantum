import * as nacl from "tweetnacl";
import * as naclUtil from "tweetnacl-util";

export default class publicKeyCrypto {
  constructor() {
    this.keyPair = nacl.box.keyPair();
  }

  getPublicKey() {
    return this.keyPair.publicKey;
  }
}
