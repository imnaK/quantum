const webpack = require("webpack");
const path = require("path");
const fs = require("fs");
const TerserPlugin = require("terser-webpack-plugin");
const ImageMinimizerPlugin = require("image-minimizer-webpack-plugin");

const pkg = require("./package.json");
const pluginConfig = require("./config.json");

// Color codes
const ccGreen = "\u001b[1;32m";
const ccReset = "\u001b[0m";

// Plugin name and entry file
const pluginName = "Quantum";
const entryFile = "./src/quantum.jsx";

const meta = (() => {
  const lines = ["/**"];
  for (const key in pluginConfig) {
    lines.push(` * @${key} ${pluginConfig[key]}`);
    if (key === "description") {
      if (pkg.version) lines.push(` * @version ${pkg.version}`);
      if (pkg.author && pkg.author.name)
        lines.push(` * @author ${pkg.author.name}`);
    }
  }
  lines.push(" */");
  return lines.join("\n");
})();

module.exports = (env) => ({
  mode: "development",
  target: "node",
  devtool: false,
  watch: true,
  watchOptions: {
    ignored: /node_modules/,
  },
  entry: env.production
    ? {
        [pluginName]: entryFile,
        [pluginName + ".min"]: entryFile,
      }
    : { [pluginName]: entryFile },
  output: {
    filename: "[name].plugin.js",
    path: path.join(__dirname, "build"),
    libraryTarget: "commonjs2",
    libraryExport: "default",
    compareBeforeEmit: false,
  },
  resolve: {
    extensions: [".js", ".jsx", ".css"],
    alias: {
      "@assets": path.resolve(__dirname, "assets/"),
      "@components": path.resolve(__dirname, "src/components/"),
      "@modules": path.resolve(__dirname, "src/modules/"),
      "@utils": path.resolve(__dirname, "src/utils/"),
      "@quantum": path.resolve(__dirname, "src/quantum"),
    },
  },
  optimization: {
    minimize: env.production,
    minimizer: [
      new TerserPlugin({
        include: /\.min\.plugin\.js$/,
        extractComments: false,
        terserOptions: {
          output: {
            comments: (node, comment) => {
              const text = comment.value;
              const type = comment.type;
              if (type == "comment2") {
                // multiline comment
                return (
                  /@name/.test(text) &&
                  /@description/.test(text) &&
                  /@version/.test(text) &&
                  /@author/.test(text)
                );
              }
            },
          },
        },
      }),
      new ImageMinimizerPlugin({
        minimizer: {
          implementation: ImageMinimizerPlugin.imageminMinify,
          options: {
            // Lossless optimization with custom option
            // Feel free to experiment with options for better result for you
            plugins: [
              // Svgo configuration here https://github.com/svg/svgo#configuration
              [
                "svgo",
                {
                  plugins: [
                    {
                      name: "preset-default",
                      params: {
                        overrides: {
                          removeViewBox: false,
                          removeXMLNS: true,
                          addAttributesToSVGElement: {
                            params: {
                              attributes: [
                                { xmlns: "http://www.w3.org/2000/svg" },
                              ],
                            },
                          },
                        },
                      },
                    },
                  ],
                },
              ],
            ],
          },
        },
      }),
    ],
  },
  module: {
    rules: [
      { test: /\.css$/, exclude: /node_modules/, use: "raw-loader" },
      { test: /\.jsx$/, exclude: /node_modules/, use: "babel-loader" },
      {
        test: /\.svg$/,
        use: "raw-loader",
      },
      {
        test: /\.(jpe?g|png|gif)$/i,
        exclude: /node_modules/,
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
          if (
            env.production
              ? !filename.endsWith("min.plugin.js")
              : filename.endsWith("min.plugin.js")
          ) {
            return;
          }

          const userConfig = (() => {
            if (process.platform === "win32") return process.env.APPDATA;
            if (process.platform === "darwin")
              return path.join(
                process.env.HOME,
                "Library",
                "Application Support"
              );
            if (process.env.XDG_CONFIG_HOME) return process.env.XDG_CONFIG_HOME;
            return path.join(process.env.HOME, ".config");
          })();

          const bdPluginFolder = path.join(userConfig, "BetterDiscord", "plugins");
          const filePath = path.join(bdPluginFolder, pluginName + ".plugin.js");

          // Copy the plugin file to the plugin folder
          fs.copyFileSync(
            info.targetPath,
            filePath
          );
          console.log(
            "\ncopied " +
              ccGreen +
              filename +
              ccReset +
              ' to "' +
              filePath +
              '" ' +
              ccGreen +
              "successfully" +
              ccReset
          );
        });
      },
    },
  ],
});
