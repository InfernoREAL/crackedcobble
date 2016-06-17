var path = require('path');
var webpack = require('webpack');
var merge = require('webpack-merge');
var HtmlWebpackPlugin = require('html-webpack-plugin');

// Include this so we can use it's "dependencies" section in our optimized build
const pkg = require('./package.json');

const PATHS = {
    src: path.join(__dirname, 'src'),
    specs: path.join(__dirname, 'specs'),
    specsBuild: path.join(__dirname, 'build', 'specs'),
    build: path.join(__dirname, 'build')
};

const TARGET = process.env.npm_lifecycle_event;
process.env.BABEL_ENV = TARGET;

var common = {
    entry: PATHS.src,
    resolve: {
        extensions: ['', '.js', '.jsx']
    },
    output: {
        path: PATHS.build,
        filename: '[name].js'
    },
    module: {
        preLoaders: [
            { test: /\.jsx?$/, loaders: ['eslint'], includes: [PATHS.src, PATHS.specs] } 
        ],
        loaders: [
            { test: /\.s?css$/, loader: "style!css!sass", includes: [PATHS.src, 'node_modules'] },
            { test: /\.jsx?$/, loader: 'babel', includes: [PATHS.src, PATHS.specs] },
            { test: /\.woff2?$/, loader: 'url-loader?limit=10000&mimetype=application/font-woff' },
            { test: /\.ttf$/, loader: 'file-loader' },
            { test: /\.eot$/, loader: 'file-loader' },
            { test: /\.svg$/, loader: 'file-loader' },
            { test: require.resolve('snapsvg'), loader: 'imports-loader?this=>window,fix=>module.exports=0' }
        ],
        noParse: [
            /\/sinon\.js/,
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: 'Minecraft Server Manager',
            template: 'src/index.html'
        })
    ],
    node: {
        fs: 'empty'
    }
}

if (TARGET === 'start' || !TARGET) {
    module.exports = merge(common, {
        devtool: 'eval-source-map',
        devServer: {
            contentBase: PATHS.src,
            historyApiFallback: true,
            hot: true,
            inline: true,
            progress: true,
            stats: 'error-only',
            host: process.env.HOST,
            port: process.env.PORT,
            proxy: {
                '*': 'http://localhost:4205'
            }
        },
        plugins: [
            new webpack.HotModuleReplacementPlugin()
        ]
    });
}

if (TARGET === 'build') {
    module.exports = merge(common, {
        entry: {
            app: PATHS.src,
            vendor: Object.keys(pkg.dependencies)
        },
        output: {
            path: PATHS.build,
            filename: '[name].[chunkhash].js',
            chunkFilename: '[chunkhash].js'
        },
        plugins: [
            // Setting mode to production makes React optimize
            new webpack.DefinePlugin({
                'process.env.NODE_ENV': JSON.stringify('production')
            }),
            // Minimize output
            new webpack.optimize.UglifyJsPlugin({
                compress: {
                    warnings: false
                }
            }),
            // Extract vendor and manifest files from app.js
            new webpack.optimize.CommonsChunkPlugin({
                names: ['vendor', 'manifest']
            })
        ]
    });
}

if (TARGET === 'test') {
    module.exports = merge(common, {
        entry: {
            app: path.join(PATHS.specs, 'tests.bundle.js')
        },
        output: {
            path: PATHS.specsBuild,
            filename: 'specs.js',
        }
    });
}

