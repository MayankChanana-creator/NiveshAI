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
        destination: "http://127.0.0.1:8000/api/mutual/:path*",
      },
      {
        source: "/api/stock/:path*",
        destination: "http://127.0.0.1:8000/api/stock/:path*",
      },
      {
        source: "/api/crypto/:path*",
        destination: "http://127.0.0.1:8000/api/crypto/:path*",
      },
      {
        source: "/api/ai/:path*",
        destination: "http://127.0.0.1:8000/api/ai/:path*",
      },
      {
        source: "/api/tradeverse/:path*",
        destination: "http://127.0.0.1:8000/api/tradeverse/:path*",
      },
      {
        source: "/api/portfolio/:path*",
        destination: "http://127.0.0.1:8000/api/portfolio/:path*",
      },
      {
        source: "/api/goal-plan/:path*",
        destination: "http://127.0.0.1:8000/api/goal-plan/:path*",
      },
      {
        source: "/api/simulator/:path*",
        destination: "http://127.0.0.1:8000/api/simulator/:path*",
      },
      {
        source: "/api/replay/:path*",
        destination: "http://127.0.0.1:8000/api/replay/:path*",
      },
      {
        source: "/api/learn/:path*",
        destination: "http://127.0.0.1:8000/api/learn/:path*",
      },
      {
        source: "/api/wealth-pilot/:path*",
        destination: "http://127.0.0.1:8000/api/wealth-pilot/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
