module.exports = {
  assetPrefix: process.env.CDN_PREFIX || "",
  reactStrictMode: true,
  experimental: {
    transpilePackages: ["ui"],
  },
};
