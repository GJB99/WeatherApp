/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_VISUALCROSSING_API_KEY: process.env.NEXT_PUBLIC_VISUALCROSSING_API_KEY,
    NEXT_PUBLIC_GOOGLE_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
  },
};

module.exports = nextConfig;