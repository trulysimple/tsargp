import nextra from 'nextra';
import { PHASE_PRODUCTION_BUILD } from 'next/constants.js';

// eslint-disable-next-line jsdoc/check-tag-names
/** @type {import('nextra').NextraConfig} */
const nextraConfig = {
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.jsx',
};
const withNextra = nextra(nextraConfig);

// eslint-disable-next-line jsdoc/check-tag-names
/** @type {import('next').NextConfig} */
const baseConfig = {
  swcMinify: false,
  webpack(config) {
    const allowedSvgRegex = /components\/icons\/.+\.svg$/;
    const fileLoaderRule = config.module.rules.find((rule) => rule.test?.test?.('.svg'));
    fileLoaderRule.exclude = allowedSvgRegex;
    config.module.rules.push({
      test: allowedSvgRegex,
      use: ['@svgr/webpack'],
    });
    return config;
  },
};

/** @ignore */
export default function (phase) {
  if (phase === PHASE_PRODUCTION_BUILD) {
    // eslint-disable-next-line jsdoc/check-tag-names
    /** @type {import('next').NextConfig} */
    const nextConfig = {
      ...baseConfig,
      basePath: '/tsargp',
      output: 'export',
      distDir: 'dist',
      images: {
        unoptimized: true,
      },
    };
    return withNextra(nextConfig);
  }
  return withNextra(baseConfig);
}
