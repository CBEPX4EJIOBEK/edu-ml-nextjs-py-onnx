/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Exclude Node.js-specific files from onnxruntime-web in browser builds
    if (!isServer) {
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

      // Exclude .mjs files from Terser optimization (only for onnxruntime-web)
      if (config.optimization && config.optimization.minimizer) {
        config.optimization.minimizer = config.optimization.minimizer.map(
          (plugin) => {
            if (
              plugin.constructor.name === 'TerserPlugin' ||
              (plugin.options && plugin.options.terserOptions)
            ) {
              const originalExclude = plugin.options?.exclude
              const excludePattern = /node_modules\/onnxruntime-web.*\.mjs$/
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
    }
    return config
  },
}

module.exports = nextConfig
