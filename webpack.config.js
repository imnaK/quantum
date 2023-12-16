const webpack = require("webpack");
const path = require('path');
const fs = require("fs");

const pkg = require("./package.json");
const pluginConfig = require("./config.json");
pluginConfig.version = pkg.version;
pluginConfig.author = pkg.author.name;

const meta = (() => {
  console.log("\u001b[1;34mSystem: " + process.platform + "\u001b[0m");

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
  plugins: [new webpack.BannerPlugin({ raw: true, banner: meta })],
};
