/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true, // Static export 지원
  },
  trailingSlash: true, // URL에 슬래시 추가
  // basePath: '', // 필요시 설정
  // assetPrefix: '', // CDN 사용시 설정
};

module.exports = nextConfig;
