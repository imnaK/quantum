/**
 * @name Quantum
 * @author imnaK .yama_
 * @description Adds the functionality to encrypt and decrypt messages.
 * @version 0.0.1
 */

module.exports = class Quantum {
  elementPrefix = "quantum-";
  commandPrefix = "§";
  elementsIds = [];

  constructor(meta) {}

  start() {
    const myButton = document.createElement("button");
    myButton.textContent = "Click me!";
    myButton.addEventListener("click", () => {
      window.alert("Hello World!");
    });
    this.addElement(myButton, "my-button");

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
            this.rot(args[1].content.substring(this.commandPrefix.length), 13);
      }
    );
  }

  stop() {
    this.elementsIds.forEach((elementId) => {
      document.getElementById(elementId).remove();
    });

    BdApi.Patcher.unpatchAll("encryptMessage");
  }

  sets = ["ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"];
  safeNumber = (num, mod) => ((num % mod) + mod) % mod;

  rot(msg, num) {
    let ret = "";
    for (let i = 0; i < msg.length; i++) {
      let add = msg[i];
      for (let j = 0; j < this.sets.length; j++)
        if (this.sets[j].indexOf(msg[i]) !== -1)
          add =
            this.sets[j][
              this.safeNumber(
                this.sets[j].indexOf(msg[i]) + num,
                this.sets[j].length
              )
            ];
      ret += add;
    }
    return ret;
  }

  addElement(el, id) {
    const newId = this.elementPrefix + id;
    const root = document.getElementById("app-mount");
    el.id = newId;
    this.elementsIds.push(newId);
    root.append(el);
  }
};
