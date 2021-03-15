const path = require("path");
const webpack = require("webpack");

module.exports = {
  entry: { app: "./index.js" },

  output: {
    filename: "docxTemplater.min.js",
    path: process.cwd() + "/../modules/docxTemplater/",
    publicPath: "",
    library: "cwDocxTemplate",
    libraryTarget: "umd",
  },

  plugins: [],

  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        loader: "babel-loader",
        exclude: [/node_modules/],
        query: {
          presets: ["es2015"],
        },
      },
    ],
  },
};
