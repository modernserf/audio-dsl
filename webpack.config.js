"use strict";

var webpack =   require('webpack'),
    path =      require('path');

var sassPath  = "includePaths[]=" + (path.resolve(__dirname, "./src"));

module.exports = {
    entry: {
        main: [
            'webpack/hot/dev-server',
            "./src/main.js"
        ]
    },
    output: {
        filename: "js/[name].js",
        path: process.cwd() + "/dist",
        publicPath: "/"
    },
    module: {
        loaders: [
            {test: /\.js$/, exclude: /node_modules/, loader: 'babel'},
        ]
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin()
    ],
    resolve: {
        extensions: ['', '.js','.json','.jsx'],
        modulesDirectories: ['node_modules','src']
    }
};
