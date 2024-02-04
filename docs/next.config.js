/** @type {import('nextra').NextraConfig} */
const nextraConfig = {
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.jsx',
};
const withNextra = require('nextra')(nextraConfig);

const { PHASE_PRODUCTION_BUILD } = require('next/constants');

module.exports = (phase, { defaultConfig }) => {
  if (phase === PHASE_PRODUCTION_BUILD) {
    /** @type {import('next').NextConfig} */
    const nextConfig = {
      basePath: '/tsargp',
      output: 'export',
      distDir: 'dist',
      images: {
        unoptimized: true,
      },
    };
    return withNextra(nextConfig);
  }
  return withNextra();
};
