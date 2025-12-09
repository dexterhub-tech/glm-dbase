import { useState, useMemo } from 'react';

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  paginatedData: any[];
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
}

/**
 * Custom hook for client-side pagination
 * 
 * @param data The full array of data to paginate
 * @param initialPage The initial page to display (1-based)
 * @param initialPageSize The initial number of items per page
 * @returns Pagination state and controls
 */
export function usePagination<T>(
  data: T[],
  initialPage: number = 1,
  initialPageSize: number = 10
): PaginationState {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Calculate total pages
  const totalItems = data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Ensure current page is within valid range
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  if (safeCurrentPage !== currentPage) {
    setCurrentPage(safeCurrentPage);
  }

  // Calculate start and end indices
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize - 1, totalItems - 1);

  // Get the current page of data
  const paginatedData = useMemo(() => {
    return data.slice(startIndex, endIndex + 1);
  }, [data, startIndex, endIndex]);

  // Navigation functions
  const goToNextPage = () => {
    if (safeCurrentPage < totalPages) {
      setCurrentPage(safeCurrentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (safeCurrentPage > 1) {
      setCurrentPage(safeCurrentPage - 1);
    }
  };

  const goToFirstPage = () => {
    setCurrentPage(1);
  };

  const goToLastPage = () => {
    setCurrentPage(totalPages);
  };

  // Handle page size changes
  const handlePageSizeChange = (newPageSize: number) => {
    // Calculate the first item index of the current page
    const firstItemIndex = (safeCurrentPage - 1) * pageSize;
    
    // Calculate what page this item would be on with the new page size
    const newPage = Math.floor(firstItemIndex / newPageSize) + 1;
    
    setPageSize(newPageSize);
    setCurrentPage(newPage);
  };

  return {
    currentPage: safeCurrentPage,
    pageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    paginatedData,
    setCurrentPage,
    setPageSize: handlePageSizeChange,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
  };
}

/**
 * Custom hook for server-side pagination
 * 
 * @param totalItems Total number of items across all pages
 * @param initialPage The initial page to display (1-based)
 * @param initialPageSize The initial number of items per page
 * @returns Pagination state and controls
 */
export function useServerPagination(
  totalItems: number,
  initialPage: number = 1,
  initialPageSize: number = 10
): Omit<PaginationState, 'paginatedData'> & { 
  offset: number;
  limit: number;
} {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Ensure current page is within valid range
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages || 1);
  if (safeCurrentPage !== currentPage) {
    setCurrentPage(safeCurrentPage);
  }

  // Calculate start and end indices
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize - 1, totalItems - 1);

  // Calculate offset and limit for server-side pagination
  const offset = startIndex;
  const limit = pageSize;

  // Navigation functions
  const goToNextPage = () => {
    if (safeCurrentPage < totalPages) {
      setCurrentPage(safeCurrentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (safeCurrentPage > 1) {
      setCurrentPage(safeCurrentPage - 1);
    }
  };

  const goToFirstPage = () => {
    setCurrentPage(1);
  };

  const goToLastPage = () => {
    setCurrentPage(totalPages);
  };

  // Handle page size changes
  const handlePageSizeChange = (newPageSize: number) => {
    // Calculate the first item index of the current page
    const firstItemIndex = (safeCurrentPage - 1) * pageSize;
    
    // Calculate what page this item would be on with the new page size
    const newPage = Math.floor(firstItemIndex / newPageSize) + 1;
    
    setPageSize(newPageSize);
    setCurrentPage(newPage);
  };

  return {
    currentPage: safeCurrentPage,
    pageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    offset,
    limit,
    setCurrentPage,
    setPageSize: handlePageSizeChange,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
  };
}
