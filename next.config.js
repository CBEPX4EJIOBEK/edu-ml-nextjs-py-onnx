/** @type {import('next').NextConfig} */
const webpack = require('webpack')

const nextConfig = {
  webpack: (config, { isServer, webpack: wp }) => {
    // Exclude Node.js-specific files from onnxruntime-web in browser builds
    if (!isServer) {
      // Ignore Node.js-specific files completely - must be first
      config.plugins.unshift(
        new wp.IgnorePlugin({
          checkResource(resource, context) {
            if (
              context &&
              context.includes('onnxruntime-web') &&
              (resource.includes('ort.node.min.mjs') ||
                resource.includes('.node.'))
            ) {
              return true
            }
            return false
          },
        })
      )

      config.resolve.alias = {
        ...config.resolve.alias,
        'onnxruntime-node': false,
      }
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }

      // Exclude .mjs files from Terser optimization
      if (config.optimization && config.optimization.minimizer) {
        config.optimization.minimizer = config.optimization.minimizer.map(
          (plugin) => {
            if (
              plugin.constructor.name === 'TerserPlugin' ||
              (plugin.options && plugin.options.terserOptions)
            ) {
              const originalExclude = plugin.options?.exclude
              const excludePattern = /ort\.node\.min\.mjs$/
              plugin.options = {
                ...plugin.options,
                exclude: originalExclude
                  ? Array.isArray(originalExclude)
                    ? [...originalExclude, excludePattern]
                    : [originalExclude, excludePattern]
                  : excludePattern,
              }
            }
            return plugin
          }
        )
      }

      // Hook into compilation to remove problematic files from assets
      config.plugins.push({
        apply: (compiler) => {
          compiler.hooks.compilation.tap('RemoveNodeFiles', (compilation) => {
            compilation.hooks.processAssets.tap(
              {
                name: 'RemoveNodeFiles',
                stage: webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE,
              },
              (assets) => {
                Object.keys(assets).forEach((filename) => {
                  if (filename.includes('ort.node.min.mjs')) {
                    delete assets[filename]
                  }
                })
              }
            )
          })
        },
      })
    }
    return config
  },
}

module.exports = nextConfig
