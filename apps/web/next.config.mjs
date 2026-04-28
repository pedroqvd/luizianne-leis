/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },
  async rewrites() {
    const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
    return [{ source: '/proxy/:path*', destination: `${api}/api/:path*` }];
  },
};
export default nextConfig;
