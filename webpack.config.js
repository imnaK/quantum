const webpack = require("webpack");
const path = require("path");
const fs = require("fs");

const TerserPlugin = require("terser-webpack-plugin");

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
  entry: {
    Quantum: "./src/quantum.js",
    "Quantum.min": "./src/quantum.js",
  },
  output: {
    filename: "[name].plugin.js",
    path: path.join(__dirname, "build"),
    libraryTarget: "commonjs2",
    libraryExport: "default",
    compareBeforeEmit: false,
  },
  resolve: {
    extensions: [".js", ".jsx", ".css"],
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        include: /\.min\.plugin\.js$/,
        extractComments: false,
        terserOptions: {
          output: {
            //comments: /@name|@description|@version|@author|^!/,
            comments: (node, comment) => {
              const text = comment.value;
              const type = comment.type;
              if (type == "comment2") {
                // multiline comment
                return /@name/.test(text) && /@description/.test(text) && /@version/.test(text) && /@author/.test(text);
              }
            },
          },
        },
      }),
    ],
  },
  module: {
    rules: [
      { test: /\.css$/, use: "raw-loader" },
      { test: /\.jsx$/, exclude: /node_modules/, use: "babel-loader" },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        use: [
          {
            loader: "url-loader",
            options: {
              limit: Infinity,
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new webpack.BannerPlugin({ raw: true, banner: meta }),
    {
      apply: (compiler) => {
        compiler.hooks.assetEmitted.tap("copyPlugin2Dir", (filename, info) => {
          // Only copy files that end with min.plugin.js
          if (!filename.endsWith("min.plugin.js")) {
            return;
          }

          const userConfig = (() => {
            if (process.platform === "win32") return process.env.APPDATA;
            if (process.platform === "darwin") return path.join(process.env.HOME, "Library", "Application Support");
            if (process.env.XDG_CONFIG_HOME) return process.env.XDG_CONFIG_HOME;
            return path.join(process.env.HOME, ".config");
          })();
          const bdFolder = path.join(userConfig, "BetterDiscord");
          const bdPluginFolder = path.join(bdFolder, "plugins", filename);
          fs.copyFileSync(info.targetPath, bdPluginFolder);
          console.log(
            "\ncopied " +
              ccGreen +
              filename +
              ccReset +
              ' to "' +
              bdPluginFolder +
              '" ' +
              ccGreen +
              "successfully" +
              ccReset
          );
        });
      },
    },
  ],
};
