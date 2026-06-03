const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { merge: webpackMerge } = require('webpack-merge');
const baseConfig = require('@splunk/webpack-configs/base.config').default;

module.exports = webpackMerge(baseConfig, {
    entry: path.join(__dirname, 'demo'),
    plugins: [
        new HtmlWebpackPlugin({
            hash: true,
            template: path.join(__dirname, 'standalone/index.html'),
        }),
    ],
    devtool: 'eval-source-map',
    devServer: {
        proxy: [
            {
                // Forward the canonical splunkd raw proxy path directly to Splunk Web.
                context: ['/en-US/splunkd'],
                target: 'http://localhost:8000',
                changeOrigin: true,
                secure: false,
            },
            {
                // Legacy bare /servicesNS/ and /services/ paths: rewrite to the raw proxy
                // path to avoid Splunk Web's locale redirect (303 → cross-origin CORS failure).
                context: ['/servicesNS', '/services'],
                target: 'http://localhost:8000',
                changeOrigin: true,
                secure: false,
                pathRewrite: {
                    '^/servicesNS': '/en-US/splunkd/__raw/servicesNS',
                    '^/services':   '/en-US/splunkd/__raw/services',
                },
            },
        ],
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
});
