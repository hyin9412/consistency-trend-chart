import { defineConfig } from '@cloudcli/scripts';
import ArcoWebpackPlugin from '@arco-plugins/webpack-react';

module.exports = defineConfig(() => ({
  dev: {
    port: 3099,
  },
  build: {
    outputPath: 'build',
  },
  bundler: {
    type: 'webpack5',
    entry: {
      patterns: 'src/index.tsx',
    },
    tsCheck: true,
    webpackConfig(config, webpack) {
      config.plugins?.push(
        new ArcoWebpackPlugin({
          modifyBabelLoader: true,
          theme: '@arco-design/theme-ve-o-design',
          webpackImplementation: webpack,
        }),
      );
      config.module = config.module || {};
      config.module.rules = config.module.rules || [];
      config.module.rules.push({
        test: /\.m?js$/,
        resolve: { fullySpecified: false },
      });
      return config;
    },
  },
}));
