/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['fluent-ffmpeg', 'ffmpeg-static'],
    outputFileTracingIncludes: {
      '/api/generate': ['./node_modules/ffmpeg-static/**/*'],
      '/api/regenerate': ['./node_modules/ffmpeg-static/**/*'],
      '/api/admin/generate-landing-samples': ['./node_modules/ffmpeg-static/**/*'],
    },
  },
};
export default nextConfig;
