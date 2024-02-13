/** @type {import('nextra').NextraConfig} */
const nextraConfig = {
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.jsx',
};

import nextra from 'nextra';
const withNextra = nextra(nextraConfig);

import { PHASE_PRODUCTION_BUILD } from 'next/constants.js';

export default function (phase, { defaultConfig }) {
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
}
