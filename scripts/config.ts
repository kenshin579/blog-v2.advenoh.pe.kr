/**
 * 블로그 메타데이터 설정
 * sitemap, RSS 피드 생성에 사용됩니다.
 */
export const blogConfig = {
  title: "프랭크 기술 블로그",
  description: "개발자를 위한 기술 블로그",
  baseUrl: process.env.BLOG_BASE_URL || "https://blog.advenoh.pe.kr",
  language: "ko",
  author: "advenoh",
  email: "advenoh@gmail.com", // RSS 피드에 사용
};
