import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Allow SVG imports to return URLs (replaces Vite's ?url suffix)
  webpack(config) {
    const fileLoaderRule = config.module.rules.find(
      (rule: { test?: { test?: (s: string) => boolean } }) => rule.test?.test?.('.svg'),
    )
    if (fileLoaderRule) {
      fileLoaderRule.exclude = /\.svg$/i
    }
    config.module.rules.push({
      test: /\.svg$/i,
      type: 'asset/resource',
    })
    return config
  },
}

export default nextConfig
