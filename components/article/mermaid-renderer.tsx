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
    if (!containerRef.current) return;

    // Mermaid 초기화
    mermaid.initialize({
      startOnLoad: false,
      theme: resolvedTheme === 'dark' ? 'dark' : 'default',
      securityLevel: 'loose',
      fontFamily: 'inherit',
    });

    // language-mermaid 코드 블록 찾기
    const codeBlocks = containerRef.current.querySelectorAll(
      'code.language-mermaid'
    );

    codeBlocks.forEach(async (codeBlock, index) => {
      const pre = codeBlock.parentElement;
      if (!pre || pre.tagName !== 'PRE') return;

      const code = codeBlock.textContent || '';
      if (!code.trim()) return;

      try {
        const id = `mermaid-diagram-${index}-${Date.now()}`;
        const { svg } = await mermaid.render(id, code);

        // pre 요소를 mermaid 다이어그램으로 교체
        const wrapper = document.createElement('div');
        wrapper.className = 'mermaid-diagram';
        wrapper.innerHTML = svg;
        pre.replaceWith(wrapper);
      } catch (error) {
        console.error('Mermaid 렌더링 실패:', error);
        // 에러 시 원본 코드 블록 유지하고 에러 표시
        pre.classList.add('mermaid-error');
      }
    });
  }, [html, resolvedTheme]);

  return (
    <div
      ref={containerRef}
      className="prose prose-lg dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
