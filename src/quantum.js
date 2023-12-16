import branca from "branca";
import secret from "./.secret.json";

const XChaCha20_Poly1305 = new branca(secret.key);

export default class Quantum {
  commandPrefix = "q:";

  constructor(meta) {}

  start() {
    let _sendMessage = BdApi.Webpack.getModule(
      BdApi.Webpack.Filters.byProps("_sendMessage")
    );
    BdApi.Patcher.before(
      "encryptMessage",
      _sendMessage,
      "sendMessage",
      (_, args) => {
        if (args[1].content.startsWith(this.commandPrefix))
          args[1].content =
            this.commandPrefix +
            XChaCha20_Poly1305.encode(args[1].content.substring(this.commandPrefix.length));
      }
    );
  }

  stop() {
    BdApi.Patcher.unpatchAll("encryptMessage");
  }
}
