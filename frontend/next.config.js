/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/tl/:path*',
        destination: 'http://ec2-54-204-59-2.compute-1.amazonaws.com:4002/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
