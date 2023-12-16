const webpack = require("webpack");
const path = require('path');


const pkg = require("./package.json");
const pluginConfig = require("./config.json");
pluginConfig.version = pkg.version;
pluginConfig.author = pkg.author.name;

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
