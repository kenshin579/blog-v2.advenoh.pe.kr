/**
 * inspire-me 외부 서비스의 공개 widget API 호출 헬퍼.
 * widget API는 인증 키가 필요 없고 모든 origin을 허용한다.
 */

export const INSPIRE_ME_BASE_URL = 'https://inspire-me.advenoh.pe.kr';

/**
 * widget API의 quote 응답 형태.
 * (backend/pkg/widget/handler.go:281-298의 widgetQuoteResponse 기준,
 *  본 클라이언트에서 사용하는 필드만 정의)
 *
 * 응답은 런타임 검증 없이 캐스팅되므로, 백엔드 변경/오작동에 대비해
 * 모든 필드를 optional로 정의한다. 소비자는 각 필드의 부재를 안전하게 처리해야 한다.
 */
export type InspireMeWidgetQuote = {
  id?: string;
  content?: string;
  author?: string;
  language?: string;
  topics?: string[];
  tags?: string[];
};

type WidgetEnvelope<T> = { data: T };

export function quoteDetailUrl(id: string): string {
  return `${INSPIRE_ME_BASE_URL}/quotes/${id}`;
}

export async function fetchQuoteOfTheDay(
  language: string = 'ko',
): Promise<InspireMeWidgetQuote | null> {
  const url = `${INSPIRE_ME_BASE_URL}/api/widget/quote-of-the-day?lang=${encodeURIComponent(language)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`QOTD widget API returned ${res.status}`);
  }
  const json = (await res.json()) as WidgetEnvelope<InspireMeWidgetQuote>;
  return json?.data ?? null;
}
