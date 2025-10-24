import { useState } from 'react';
import { Pagination } from '../Pagination';

export default function PaginationExample() {
  const [page, setPage] = useState(1);

  return (
    <div className="p-8">
      <Pagination currentPage={page} totalPages={5} onPageChange={setPage} />
      <p className="text-center mt-4">Current page: {page}</p>
    </div>
  );
}
