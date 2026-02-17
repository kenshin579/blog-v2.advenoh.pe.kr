"use client";

import { ExternalLink } from "lucide-react";
import type { SourceDocument } from "@/lib/chat-api";

interface SourceLinksProps {
  sources: SourceDocument[];
}

export function SourceLinks({ sources }: SourceLinksProps) {
  if (sources.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {sources.map((source, i) => (
        <a
          key={i}
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          {source.title}
        </a>
      ))}
    </div>
  );
}
