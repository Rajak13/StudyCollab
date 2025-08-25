const path = require('path');

module.exports = {
  // Development configuration for Electron
  main: {
    entry: './electron/main.ts',
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: {
            loader: 'ts-loader',
            options: {
              configFile: path.resolve(__dirname, 'electron/tsconfig.json')
            }
          }
        }
      ]
    },
    resolve: {
      extensions: ['.ts', '.js']
    },
    output: {
      path: path.resolve(__dirname, 'dist/electron'),
      filename: 'main.js'
    },
    target: 'electron-main',
    node: {
      __dirname: false,
      __filename: false
    }
  },
  preload: {
    entry: './electron/preload.ts',
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: {
            loader: 'ts-loader',
            options: {
              configFile: path.resolve(__dirname, 'electron/tsconfig.json')
            }
          }
        }
      ]
    },
    resolve: {
      extensions: ['.ts', '.js']
    },
    output: {
      path: path.resolve(__dirname, 'dist/electron'),
      filename: 'preload.js'
    },
    target: 'electron-preload',
    node: {
      __dirname: false,
      __filename: false
    }
  }
};