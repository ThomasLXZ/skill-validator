/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // fully static: deploy to Cloudflare Pages / any CDN
  trailingSlash: true,
  images: { unoptimized: true },
};
export default nextConfig;
