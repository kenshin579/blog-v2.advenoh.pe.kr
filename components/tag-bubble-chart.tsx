'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface TagData {
  name: string;
  count: number;
  articles: any[];
}

interface TagBubbleChartProps {
  tags: TagData[];
  onTagSelect?: (tagName: string) => void;
  selectedTag?: string | null;
}

interface BubbleNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  count: number;
  radius: number;
}

export function TagBubbleChart({ tags, onTagSelect, selectedTag }: TagBubbleChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // 반응형 크기 조정
  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const container = svgRef.current.parentElement;
        if (container) {
          const width = container.clientWidth;
          const height = Math.max(500, Math.min(700, width * 0.6));
          setDimensions({ width, height });
        }
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return;

    const { width, height } = dimensions;

    // 기존 SVG 내용 제거
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current);

    // Bubble 크기 계산 (min-max scaling)
    const minCount = d3.min(tags, (d) => d.count) || 1;
    const maxCount = d3.max(tags, (d) => d.count) || 1;

    // 반응형 radius 범위
    const isMobile = width < 640;
    const minRadius = isMobile ? 25 : 30;
    const maxRadius = isMobile ? 70 : 100;

    const radiusScale = d3
      .scaleSqrt()
      .domain([minCount, maxCount])
      .range([minRadius, maxRadius]);

    // Bubble 노드 데이터 생성
    const nodes: BubbleNode[] = tags.map((tag) => ({
      id: tag.name,
      name: tag.name,
      count: tag.count,
      radius: radiusScale(tag.count),
    }));

    // Force simulation 설정
    const simulation = d3
      .forceSimulation(nodes)
      .force('charge', d3.forceManyBody().strength(5))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force(
        'collision',
        d3.forceCollide<BubbleNode>().radius((d) => d.radius + 8)
      );

    // Bubble 그룹 생성
    const bubbles = svg
      .append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .attr('data-tag-bubble', (d) => d.name)
      .on('click', (event, d) => {
        if (onTagSelect) {
          onTagSelect(d.name);
        }
      });

    // Bubble 원 그리기
    bubbles
      .append('circle')
      .attr('r', (d) => d.radius)
      .attr('fill', 'hsl(var(--primary))')
      .attr('fill-opacity', 0.7)
      .attr('stroke', 'hsl(var(--primary))')
      .attr('stroke-width', 2)
      .style('transition', 'all 0.3s ease')
      .on('mouseenter', function () {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('fill-opacity', 0.9)
          .attr('transform', 'scale(1.05)');
      })
      .on('mouseleave', function () {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('fill-opacity', 0.7)
          .attr('transform', 'scale(1)');
      });

    // 태그명 텍스트
    bubbles
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.2em')
      .attr('fill', 'hsl(var(--primary-foreground))')
      .attr('font-size', (d) => Math.max(10, d.radius / 4))
      .attr('font-weight', 'bold')
      .attr('pointer-events', 'none')
      .text((d) => d.name);

    // 개수 텍스트
    bubbles
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1em')
      .attr('fill', 'hsl(var(--primary-foreground))')
      .attr('font-size', (d) => Math.max(9, d.radius / 5))
      .attr('opacity', 0.8)
      .attr('pointer-events', 'none')
      .text((d) => `${d.count}개`);

    // Simulation 틱마다 위치 업데이트
    simulation.on('tick', () => {
      bubbles.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    // 등장 애니메이션
    bubbles
      .style('opacity', 0)
      .transition()
      .duration(300)
      .delay((d, i) => i * 30)
      .style('opacity', 1);

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [tags, dimensions, onTagSelect]);

  return (
    <div className="w-full mb-12">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="mx-auto"
      />
      {selectedTag && (
        <div className="text-center mt-4">
          <p className="text-lg font-medium">
            선택된 태그:{' '}
            <span className="text-primary font-bold">{selectedTag}</span>
          </p>
        </div>
      )}
    </div>
  );
}
