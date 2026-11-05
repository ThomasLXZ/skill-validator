/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // fully static: Workers Static Assets from ./out (see wrangler.jsonc)
  trailingSlash: true,
  images: { unoptimized: true },
};
export default nextConfig;
