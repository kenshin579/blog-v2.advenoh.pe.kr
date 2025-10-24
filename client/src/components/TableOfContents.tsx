import { useEffect, useState } from "react";
import { TOCItem } from "@/lib/markdown";

interface TableOfContentsProps {
  items: TOCItem[];
}

export function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -66%" }
    );

    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [items]);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (items.length === 0) return null;

  return (
    <nav className="sticky top-24 max-h-[calc(100vh-6rem)] overflow-auto" data-testid="toc">
      <h3 className="text-sm font-semibold mb-4">목차</h3>
      <ul className="space-y-2 text-sm">
        {items.map((item) => (
          <li
            key={item.id}
            style={{ paddingLeft: `${(item.level - 2) * 1}rem` }}
            data-testid={`toc-item-${item.id}`}
          >
            <button
              onClick={() => handleClick(item.id)}
              className={`text-left w-full hover:text-foreground transition-colors ${
                activeId === item.id
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
              }`}
            >
              {item.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
