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

      // Handle .mjs files as ES modules (don't process with Terser)
      config.module.rules.push({
        test: /\.mjs$/,
        type: 'javascript/esm',
        resolve: {
          fullySpecified: false,
        },
      })

      // Exclude .mjs files from static optimization
      if (config.optimization && config.optimization.minimizer) {
        config.optimization.minimizer = config.optimization.minimizer.filter(
          (plugin) => {
            // Don't filter, but modify Terser to exclude .mjs
            if (
              plugin.constructor.name === 'TerserPlugin' ||
              (plugin.options && plugin.options.terserOptions)
            ) {
              const originalExclude = plugin.options?.exclude
              plugin.options = {
                ...plugin.options,
                exclude: originalExclude
                  ? Array.isArray(originalExclude)
                    ? [...originalExclude, /\.mjs$/]
                    : [originalExclude, /\.mjs$/]
                  : /\.mjs$/,
              }
            }
            return true
          }
        )
      }
    }
    return config
  },
}

module.exports = nextConfig
