const webpack = require("webpack");
const path = require('path');
const fs = require("fs");

const pkg = require("./package.json");
const pluginConfig = require("./config.json");
pluginConfig.version = pkg.version;
pluginConfig.author = pkg.author.name;

// color codes
const ccGreen = "\u001b[1;32m";
const ccReset = "\u001b[0m";

const meta = (() => {
  const lines = ["/**"];
  for (const key in pluginConfig) {
    lines.push(` * @${key} ${pluginConfig[key]}`);
  }
  lines.push(" */");
  return lines.join("\n");
})();


module.exports = {
  mode: "development",
  target: "node",
  devtool: false,
  watch: true,
  watchOptions: {
    ignored: /node_modules/,
  },
  entry: "./src/quantum.js",
  output: {
    filename: "Quantum.plugin.js",
    path: path.join(__dirname, "build"),
    libraryTarget: "commonjs2",
    libraryExport: "default",
    compareBeforeEmit: false,
  },
  resolve: {
    extensions: [".js"],
  },
  plugins: [
    new webpack.BannerPlugin({ raw: true, banner: meta }),
    {
      apply: (compiler) => {
        compiler.hooks.assetEmitted.tap("copyPlugin2Dir", (filename, info) => {
          const userConfig = (() => {
            if (process.platform === "win32") return process.env.APPDATA;
            if (process.platform === "darwin") return path.join(process.env.HOME, "Library", "Application Support");
            if (process.env.XDG_CONFIG_HOME) return process.env.XDG_CONFIG_HOME;
            return path.join(process.env.HOME, "Library", ".config");
          })();
          const bdFolder = path.join(userConfig, "BetterDiscord");
          const bdPluginFolder = path.join(bdFolder, "plugins", filename);
          fs.copyFileSync(info.targetPath, bdPluginFolder);
          console.log("\ncopied " + ccGreen + filename + ccReset + " to \"" + bdPluginFolder + "\" " + ccGreen + "successfully" + ccReset);
        });
      }
    }
  ],
};
