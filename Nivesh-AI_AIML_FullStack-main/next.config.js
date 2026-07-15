/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Allow external crypto images (CoinGecko)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "coin-images.coingecko.com",
      },
    ],
  },

  // ✅ Proxy backend API (FastAPI)
  async rewrites() {
    return [
      {
        source: "/api/mutual/:path*",
        destination: "http://localhost:8000/api/mutual/:path*",
      },
      {
        source: "/api/stock/:path*",
        destination: "http://localhost:8000/api/stock/:path*",
      },
      {
        source: "/api/crypto/:path*",
        destination: "http://localhost:8000/api/crypto/:path*",
      },
      {
        source: "/api/ai/:path*",
        destination: "http://localhost:8000/api/ai/:path*",
      },
      {
        source: "/api/tradeverse/:path*",
        destination: "http://localhost:8000/api/tradeverse/:path*",
      },
      {
        source: "/api/portfolio/:path*",
        destination: "http://localhost:8000/api/portfolio/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
