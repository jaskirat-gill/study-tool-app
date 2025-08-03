import React from 'react';
import { Search } from 'lucide-react';

interface NoSearchResultsProps {
  searchQuery: string;
  itemType?: string;
}

export function NoSearchResults({ searchQuery, itemType = 'items' }: NoSearchResultsProps) {
  return (
    <div className="text-center py-8">
      <div className="max-w-md mx-auto">
        <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No {itemType} Found</h3>
        <p className="text-muted-foreground">
          No {itemType} match your search query &quot;{searchQuery}&quot;. Try
          a different search term.
        </p>
      </div>
    </div>
  );
}
