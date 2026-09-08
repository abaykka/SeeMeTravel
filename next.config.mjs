/** @type {import('next').NextConfig} */
const nextConfig = {
  // The v1 CRA app still lives in legacy/ for reference. Keep it out of the build.
  outputFileTracingExcludes: {
    "*": ["./legacy/**/*"],
  },
  async redirects() {
    return [];
  },
};

export default nextConfig;
