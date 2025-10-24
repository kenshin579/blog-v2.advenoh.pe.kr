import { TableOfContents } from '../TableOfContents';

export default function TableOfContentsExample() {
  const items = [
    { id: 'intro', text: '소개', level: 2 },
    { id: 'union-types', text: '유니온 타입과 인터섹션 타입', level: 2 },
    { id: 'generics', text: '제네릭 타입', level: 2 },
    { id: 'advanced', text: '고급 기능', level: 3 },
  ];

  return (
    <div className="p-8 max-w-xs">
      <TableOfContents items={items} />
    </div>
  );
}
