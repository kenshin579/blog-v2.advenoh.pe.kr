'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import mermaid from 'mermaid';

interface MermaidRendererProps {
  html: string;
}

export function MermaidRenderer({ html }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    mermaid.initialize({
      startOnLoad: false,
      theme: resolvedTheme === 'dark' ? 'dark' : 'default',
      securityLevel: 'loose',
      fontFamily: 'inherit',
    });

    // mermaid 코드를 먼저 수집한다.
    const sources = Array.from(
      container.querySelectorAll<HTMLElement>('code.language-mermaid')
    )
      .map((code) => code.textContent || '')
      .filter((code) => code.trim());

    if (sources.length === 0) return;

    let cancelled = false;

    (async () => {
      // 모든 mermaid 렌더링을 병렬로 실행한 뒤 SVG 결과만 모은다.
      const results = await Promise.all(
        sources.map(async (code, index) => {
          try {
            const id = `mermaid-diagram-${index}-${Date.now()}`;
            const { svg } = await mermaid.render(id, code);
            return svg;
          } catch (error) {
            console.error('Mermaid 렌더링 실패:', error);
            return null;
          }
        })
      );
      if (cancelled) return;

      // await가 끝난 뒤 React가 dangerouslySetInnerHTML을 재적용했을 수 있으므로
      // pre 요소를 다시 조회하여 동기적으로 교체한다.
      const pres = container.querySelectorAll<HTMLElement>('pre.language-mermaid');
      results.forEach((svg, index) => {
        const pre = pres[index];
        if (!pre || !document.contains(pre)) return;
        if (!svg) {
          pre.classList.add('mermaid-error');
          return;
        }
        const wrapper = document.createElement('div');
        wrapper.className = 'mermaid-diagram';
        wrapper.innerHTML = svg;
        pre.replaceWith(wrapper);
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [html, resolvedTheme]);

  return (
    <div
      ref={containerRef}
      className="prose prose-lg dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
