import Rot from "./rot";

export default class Quantum {
  commandPrefix = "\u269B\uFE0F";

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
            Rot(args[1].content.substring(this.commandPrefix.length), 13);
      }
    );
  }

  stop() {
    BdApi.Patcher.unpatchAll("encryptMessage");
  }
}
