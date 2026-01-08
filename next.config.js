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

      // Exclude all onnxruntime-web .mjs files from Terser optimization
      // Also exclude them from webpack processing entirely
      config.module = config.module || {}
      config.module.rules = config.module.rules || []
      
      // Add rule to prevent webpack from processing onnxruntime-web .mjs files
      // They'll be loaded at runtime via dynamic import
      config.module.rules.push({
        test: /node_modules[\/\\]onnxruntime-web[\/\\]dist[\/\\].*\.mjs$/,
        type: 'javascript/auto',
        parser: {
          javascript: {
            dynamicImportMode: 'eager',
          },
        },
      })

      if (config.optimization && config.optimization.minimizer) {
        config.optimization.minimizer = config.optimization.minimizer.map(
          (plugin) => {
            if (
              plugin.constructor.name === 'TerserPlugin' ||
              (plugin.options && plugin.options.terserOptions)
            ) {
              const originalExclude = plugin.options?.exclude
              // Exclude ALL .mjs files from onnxruntime-web - they're already minified
              // Use a function for more precise matching
              const excludeFunc = (modulePath) => {
                if (typeof modulePath === 'string' && 
                    modulePath.includes('onnxruntime-web') && 
                    modulePath.includes('dist') &&
                    modulePath.endsWith('.mjs')) {
                  return true
                }
                if (originalExclude) {
                  if (typeof originalExclude === 'function') {
                    return originalExclude(modulePath)
                  }
                  if (originalExclude instanceof RegExp) {
                    return originalExclude.test(modulePath)
                  }
                  if (Array.isArray(originalExclude)) {
                    return originalExclude.some(pattern => 
                      typeof pattern === 'function' ? pattern(modulePath) :
                      pattern instanceof RegExp ? pattern.test(modulePath) :
                      typeof pattern === 'string' ? modulePath.includes(pattern) : false
                    )
                  }
                  if (typeof originalExclude === 'string') {
                    return modulePath.includes(originalExclude)
                  }
                }
                return false
              }
              
              plugin.options = {
                ...plugin.options,
                exclude: excludeFunc,
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
                  // Only remove Node.js-specific files, NOT browser bundle files
                  if (
                    filename.includes('onnxruntime-web') &&
                    filename.endsWith('.mjs') &&
                    filename.includes('ort.node.min.mjs')
                  ) {
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
