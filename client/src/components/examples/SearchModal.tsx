import { useState } from 'react';
import { SearchModal } from '../SearchModal';
import { Button } from '@/components/ui/button';
import { parseMarkdown } from '@/lib/markdown';
import { mockArticles } from '@/lib/mock-articles';

export default function SearchModalExample() {
  const [open, setOpen] = useState(false);
  
  const articles = mockArticles.map(({ slug, markdown }) => 
    parseMarkdown(markdown, slug)
  );

  return (
    <div className="p-8">
      <Button onClick={() => setOpen(true)}>Open Search</Button>
      <SearchModal open={open} onOpenChange={setOpen} articles={articles} />
    </div>
  );
}
