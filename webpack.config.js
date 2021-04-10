const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');

const isDev = process.env.NODE_ENV === 'development';
const isProd = !isDev;
const filename = (ext) => (isDev ? `[name].[hash].${ext}` : `[name].${ext}`);

module.exports = {
  context: path.resolve(__dirname, 'src'),
  mode: isProd ? 'production' : 'development',
  entry: {
    index: './index.js',
  },
  output: {
    filename: filename('js'),
    path: path.resolve(__dirname, 'dist'),
  },
  devServer: {
    open: true,
    port: 4200,
    hot: isDev,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: '../template.html',
      filename: 'index.html',
      minify: {
        collapseWhitespace: isProd,
      },
    }),
    new ESLintPlugin({
      failOnError: !isDev,
      failOnWarning: !isDev,
    }),
    new CleanWebpackPlugin(),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
};
