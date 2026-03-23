/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Proxy all /api requests to the Render backend to bypass browser CORS completely
    const backendUrl = (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000').replace(/\/$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
