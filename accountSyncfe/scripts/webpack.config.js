const path = require("path");
require('dotenv').config()
const webpack = require('webpack')
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const Polyfill = require("./polyfill");
const CssCheckLoader = require("./css-check-loader");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const fs = require("fs");

const rootPath = path.resolve(__dirname, '../')
const outDir = process.env.npm_package_config_out ? (path.isAbsolute(process.env.npm_package_config_out) ? process.env.npm_package_config_out : path.join(rootPath, process.env.npm_package_config_out)) : path.resolve(__dirname, "../dist")
const outPath = path.join(outDir, './pack')

const webEntry = path.resolve(__dirname, "../src/web", "index.tsx");
const existWeb = fs.existsSync(webEntry);
const entry = {
  plugin: path.resolve(__dirname, "../src", "index.tsx"),
};
const plugins = [
  new CleanWebpackPlugin(),
  new Polyfill(),
];
if (existWeb) {
  entry.web = webEntry;
  plugins.push(
    new HtmlWebpackPlugin({
      filename: `index.html`,
      template: "./src/web/template.html",
      chunks: ["web"],
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
        minifyJS: true,
        minifyCSS: true,
      },
    }),
    new webpack.DefinePlugin({
      'process.env': {
        ECIS_APPID: '"' + process.env.ECIS_APPID + '"',
        ECIS_APPNAME: '"' + process.env.ECIS_APPNAME + '"',
        ECIS_TYPE: '"' + process.env.ECIS_TYPE + '"',
        ECIS_COMPONENT_ID: '"' + process.env.ECIS_COMPONENT_ID + '"'
      }
    })
  );
}

const isDevelopment = process.argv[process.argv.indexOf('--mode') + 1] === 'development';

module.exports = {
  entry: entry,
  output: {
    path: outPath,
    filename: isDevelopment ? "[name].js" : "[name].[contenthash:7].js",
    environment: {
      arrowFunction: false,
    },
  },
  mode: "development",
  devtool: "source-map",
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".json"],
    alias: {
      "@": path.resolve("src"),
      "@libs": path.resolve("src/libs"),
    },
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: "babel-loader"
      },
      {
        test: /\.module\.(css|less)$/,
        exclude: /(node_modules|bower_components)/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              modules: {
                localIdentName: "[local]-[hash:base64:5]",
              },
            },
          },
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: [["postcss-preset-env"]],
              },
            },
          },
          "less-loader",
        ],
      },
      {
        test: /\.global\.(css|less)$/,
        exclude: /(node_modules|bower_components)/,
        use: [
          {
            loader: "style-loader",
            options: {
              attributes: {
                type: "text/css",
                useby: "ecis",
              },
            },
          },
          "css-loader",
          // path.resolve(__dirname, "../scripts/css-check-loader.js"),
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: ["postcss-preset-env"],
              },
            },
          },
          "less-loader",
        ],
      },
      {
        test: /\.(css|less)$/,
        exclude: /src/,
        include: /node_modules[\\/]antd/,
        use: ['style-loader', 'css-loader',
          {
            loader: 'less-loader',
            options: {
              lessOptions: {
                javascriptEnabled: true,
              },
            },
          }
        ],
      },
      {
        test: /\.(bpm|webp|png|jpg|jpeg|gif)$/,
        loader: "file-loader",
        options: {
          name: "static/media/[name].[contenthash:8].[ext]",
        },
      },
      {
        test: /\.(svg)$/,
        use: ["@svgr/webpack", "url-loader"],
      },
    ],
  },
  plugins: plugins,
  devServer: {
    // static: {
    //   directory: path.join(__dirname, "../build"),
    // },
    port: process.env.PORT || 3600,
    open: false,
    hot: true,
    https: true
  },
};
