const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');

const isDev = process.env.NODE_ENV === 'development';
const isProd = !isDev;
const filename = (ext) => (isDev ? `[name].[hash].${ext}` : `[name].${ext}`);

module.exports = {
  //context: path.resolve(__dirname, 'src'),
  mode: isProd ? 'production' : 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: filename('js'),
  },
  devServer: {
    open: true,
    port: 4200,
    hot: isDev,
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'RSS aggregator',
      template: 'index.html',
      minify: {
        collapseWhitespace: isProd,
      },
    }),
    /* new ESLintPlugin({
      failOnError: !isDev,
      failOnWarning: !isDev,
    }), */
    new CleanWebpackPlugin(),
  ],
};
