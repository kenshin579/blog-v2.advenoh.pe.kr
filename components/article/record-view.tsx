'use client';

import { useEffect } from 'react';
import { recordView } from '@/lib/cmdk-storage';

type Props = {
  slug: string;       // URL slug (title only, no category prefix)
  title: string;
  category: string;
  date: string;       // formatted yyyy.MM.dd or ISO string
};

export function RecordView({ slug, title, category, date }: Props) {
  useEffect(() => {
    recordView({ slug, title, category, date });
  }, [slug, title, category, date]);

  return null;
}
