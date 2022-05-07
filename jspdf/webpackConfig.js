const path = require("path");
const webpack = require("webpack");

module.exports = {
  entry: { app: "./index.js" },

  output: {
    filename: "jspdf.min.js",
    path: process.cwd() + "/../modules/jspdf/",
    publicPath: "",
    library: "cwJsPdf",
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
