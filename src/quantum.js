import branca from "branca";
import secret from "./.secret.json";

const XChaCha20_Poly1305 = new branca(secret.key);
const { Patcher, Webpack } = BdApi;

export default class Quantum {
  commandPrefix = "q:";

  constructor(meta) {}

  start() {
    let _sendMessage = Webpack.getModule(
      Webpack.Filters.byProps("_sendMessage")
    );
    BdApi.Patcher.before(
      "encryptMessage",
      _sendMessage,
      "sendMessage",
      (_, args) => {
        if (args[1].content.startsWith(this.commandPrefix))
          args[1].content =
            this.commandPrefix +
            XChaCha20_Poly1305.encode(
              args[1].content.substring(this.commandPrefix.length)
            );
      }
    );

    let dispatchModule = BdApi.findModuleByProps("dispatch", "subscribe");
    Patcher.after(
      "receiveMessage",
      dispatchModule,
      "dispatch",
      this.handleMessage.bind(this)
    );
  }

  stop() {
    Patcher.unpatchAll("encryptMessage");
    Patcher.unpatchAll("receiveMessage");
  }

  handleMessage(_, args) {
    try {
      if (args[0].type !== "MESSAGE_CREATE") return;

      const decoder = new TextDecoder();

      let { message } = args[0];
      if (message.content.startsWith(this.commandPrefix)) {
        console.log("Received quantum message, starting decryption...")
        let decryptedUint8Array = XChaCha20_Poly1305.decode(message.content.substring(this.commandPrefix.length))
        console.log("Decrypted Message: " + decoder.decode(decryptedUint8Array));
      }
    } catch (e) {
      console.log(error(`${e}`));
    }
  }
}
