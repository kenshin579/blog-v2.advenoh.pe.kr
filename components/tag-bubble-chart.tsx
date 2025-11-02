'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [topN, setTopN] = useState<string>('50'); // Top N 필터 (기본값: 50)

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

    // Zoom이 적용될 그룹 생성
    const g = svg.append('g').attr('class', 'zoom-group');

    // 태그를 count 기준으로 정렬 (많은 것부터)
    let sortedTags = [...tags].sort((a, b) => b.count - a.count);

    // Top N 필터 적용
    const topNValue = parseInt(topN);
    if (!isNaN(topNValue) && topNValue > 0) {
      sortedTags = sortedTags.slice(0, topNValue);
    }

    // Bubble 크기 계산
    const minCount = d3.min(tags, (d) => d.count) || 1;
    const maxCount = d3.max(tags, (d) => d.count) || 1;

    const isMobile = width < 640;
    const minRadius = isMobile ? 20 : 25;
    const maxRadius = isMobile ? 60 : 80;

    const radiusScale = d3
      .scaleSqrt()
      .domain([minCount, maxCount])
      .range([minRadius, maxRadius]);

    // count에 따른 중심으로부터의 거리 계산 (큰 count = 중심 가까이)
    const radiusFromCenter = d3
      .scaleSqrt()
      .domain([minCount, maxCount])
      .range([Math.min(width, height) * 0.42, 0]); // 반전: 큰 값 = 0 (중심)

    // Bubble 노드 데이터 생성 (초기 위치를 원형으로 배치)
    const nodes: BubbleNode[] = sortedTags.map((tag, i) => {
      const targetRadius = radiusFromCenter(tag.count);
      const angle = (i / sortedTags.length) * Math.PI * 2;

      return {
        id: tag.name,
        name: tag.name,
        count: tag.count,
        radius: radiusScale(tag.count),
        x: width / 2 + Math.cos(angle) * targetRadius,
        y: height / 2 + Math.sin(angle) * targetRadius,
      };
    });

    // Force simulation 설정 (빠른 안정화로 셔플링 최소화)
    const simulation = d3
      .forceSimulation(nodes)
      .force('charge', d3.forceManyBody().strength(-2))
      .force('center', d3.forceCenter(width / 2, height / 2).strength(0.02))
      .force(
        'radial',
        d3.forceRadial(
          (d) => radiusFromCenter((d as BubbleNode).count),
          width / 2,
          height / 2
        ).strength(2)
      )
      .force(
        'collision',
        d3.forceCollide<BubbleNode>().radius((d) => d.radius + 4).strength(1)
      )
      .alpha(0.3) // 낮은 초기 에너지로 셔플링 감소
      .alphaDecay(0.05) // 빠른 감쇠로 빠르게 안정화
      .velocityDecay(0.5); // 빠른 속도 감쇠

    // Bubble 그룹 생성
    const bubbles = g
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .attr('data-tag-bubble', (d) => d.name)
      .on('click', (event, d) => {
        event.stopPropagation(); // zoom 이벤트와 충돌 방지
        if (onTagSelect) {
          onTagSelect(d.name);
        }
      });

    // Bubble 원 그리기
    bubbles
      .append('circle')
      .attr('r', (d) => d.radius)
      .attr('fill', (d) =>
        selectedTag && d.name.toLowerCase() === selectedTag.toLowerCase()
          ? 'hsl(var(--destructive))' // 선택된 태그는 다른 색상
          : 'hsl(var(--primary))'
      )
      .attr('fill-opacity', (d) =>
        selectedTag && d.name.toLowerCase() === selectedTag.toLowerCase()
          ? 0.9 // 선택된 태그는 더 진하게
          : 0.7
      )
      .attr('stroke', (d) =>
        selectedTag && d.name.toLowerCase() === selectedTag.toLowerCase()
          ? 'hsl(var(--destructive))'
          : 'hsl(var(--primary))'
      )
      .attr('stroke-width', (d) =>
        selectedTag && d.name.toLowerCase() === selectedTag.toLowerCase()
          ? 3 // 선택된 태그는 더 두껍게
          : 2
      )
      .style('transition', 'all 0.3s ease')
      .on('mouseenter', function (event, d) {
        const isSelected = selectedTag && d.name.toLowerCase() === selectedTag.toLowerCase();
        d3.select(this)
          .transition()
          .duration(200)
          .attr('fill-opacity', isSelected ? 1 : 0.9)
          .attr('transform', 'scale(1.05)');
      })
      .on('mouseleave', function (event, d) {
        const isSelected = selectedTag && d.name.toLowerCase() === selectedTag.toLowerCase();
        d3.select(this)
          .transition()
          .duration(200)
          .attr('fill-opacity', isSelected ? 0.9 : 0.7)
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

    // Zoom behavior 설정
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3]) // 최소 0.5x, 최대 3x 줌
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    // SVG에 zoom 적용
    svg.call(zoom);

    // zoom behavior를 ref에 저장 (외부에서 제어 가능하도록)
    zoomRef.current = zoom;

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [tags, dimensions, onTagSelect, topN]);

  // selectedTag 변경 시 색상만 업데이트 (재배치 없음)
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);

    // 모든 bubble의 circle 선택하여 색상 업데이트
    svg.selectAll('[data-tag-bubble]').each(function () {
      const bubble = d3.select(this);
      const tagName = bubble.attr('data-tag-bubble');
      const isSelected = selectedTag && tagName.toLowerCase() === selectedTag.toLowerCase();

      bubble
        .select('circle')
        .transition()
        .duration(300)
        .attr('fill', isSelected ? 'hsl(var(--destructive))' : 'hsl(var(--primary))')
        .attr('fill-opacity', isSelected ? 0.9 : 0.7)
        .attr('stroke', isSelected ? 'hsl(var(--destructive))' : 'hsl(var(--primary))')
        .attr('stroke-width', isSelected ? 3 : 2);
    });
  }, [selectedTag]);

  // Zoom 제어 함수들
  const handleZoomIn = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomRef.current.scaleBy, 1.3);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomRef.current.scaleBy, 0.7);
    }
  };

  const handleZoomReset = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(500)
        .call(zoomRef.current.transform, d3.zoomIdentity);
    }
  };

  return (
    <div className="w-full mb-12 relative">
      {/* Top N 필터 및 Zoom 컨트롤 */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start">
        {/* Top N 필터 (왼쪽) */}
        <div className="bg-background/95 backdrop-blur shadow-md border border-border rounded-md p-2">
          <Label htmlFor="topN" className="text-xs mb-1 block">
            Top N
          </Label>
          <Input
            id="topN"
            type="number"
            min="1"
            max={tags.length}
            placeholder="전체"
            value={topN}
            onChange={(e) => setTopN(e.target.value)}
            className="h-8 w-20 text-sm"
          />
        </div>

        {/* Zoom 컨트롤 버튼 (오른쪽) */}
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomIn}
            className="bg-background/95 backdrop-blur shadow-md"
            title="확대 (Zoom In)"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomOut}
            className="bg-background/95 backdrop-blur shadow-md"
            title="축소 (Zoom Out)"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomReset}
            className="bg-background/95 backdrop-blur shadow-md"
            title="초기화 (Reset)"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="mx-auto border border-border rounded-lg"
      />

      {selectedTag && (
        <div className="text-center mt-4">
          <p className="text-lg font-medium">
            선택된 태그:{' '}
            <span className="text-primary font-bold">{selectedTag}</span>
          </p>
        </div>
      )}

      <div className="text-center mt-2 text-sm text-muted-foreground">
        <p>💡 스크롤로 확대/축소, 드래그로 이동할 수 있습니다</p>
      </div>
    </div>
  );
}
