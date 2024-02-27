/** @type {import('nextra').NextraConfig} */
const nextraConfig = {
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.jsx',
};

import nextra from 'nextra';
const withNextra = nextra(nextraConfig);

/** @type {import('next').NextConfig} */
const baseConfig = {
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

import { PHASE_PRODUCTION_BUILD } from 'next/constants.js';

export default function (phase, { defaultConfig }) {
  if (phase === PHASE_PRODUCTION_BUILD) {
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
