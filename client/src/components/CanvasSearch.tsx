import React, { useEffect, useRef, useState } from 'react';
import { Search, X, ChevronUp, ChevronDown, Filter, Activity, GitBranch, Users, Building2, Database, StickyNote, PlayCircle } from 'lucide-react';
import { useDiagramStore } from '../stores/diagramStore';

interface CanvasSearchProps {
  onClose: () => void;
}

export const CanvasSearch: React.FC<CanvasSearchProps> = ({ onClose }) => {
  const {
    searchQuery,
    searchResults,
    currentSearchIndex,
    setSearchQuery,
    nextSearchResult,
    previousSearchResult,
  } = useDiagramStore();

  const inputRef = useRef<HTMLInputElement>(null);
  const [searchFilter, setSearchFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'Enter') {
        if (event.shiftKey) {
          previousSearchResult();
        } else {
          nextSearchResult();
        }
        event.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, nextSearchResult, previousSearchResult]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const getFilterIcon = (type: string) => {
    switch (type) {
      case 'process': return <Activity size={14} />;
      case 'event': return <PlayCircle size={14} />;
      case 'gateway': return <GitBranch size={14} />;
      case 'lane': return <Users size={14} />;
      case 'pool': return <Building2 size={14} />;
      case 'data-object': return <Database size={14} />;
      case 'sticky-note': return <StickyNote size={14} />;
      default: return <Search size={14} />;
    }
  };

  const filterOptions = [
    { value: 'all', label: 'All Elements', icon: getFilterIcon('all') },
    { value: 'process', label: 'Tasks', icon: getFilterIcon('process') },
    { value: 'event', label: 'Events', icon: getFilterIcon('event') },
    { value: 'gateway', label: 'Gateways', icon: getFilterIcon('gateway') },
    { value: 'lane', label: 'Lanes', icon: getFilterIcon('lane') },
    { value: 'pool', label: 'Pools', icon: getFilterIcon('pool') },
    { value: 'data-object', label: 'Data Objects', icon: getFilterIcon('data-object') },
    { value: 'sticky-note', label: 'Notes', icon: getFilterIcon('sticky-note') },
  ];

  return (
    <div className="absolute top-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-3 min-w-[350px]">
      <div className="flex items-center space-x-2 mb-2">
        <Search size={16} className="text-gray-500" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          placeholder="Search elements, labels, descriptions..."
          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-1 rounded transition-colors ${
            showFilters ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
          title="Filter by element type"
        >
          <Filter size={16} />
        </button>
        <button
          onClick={onClose}
          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
        >
          <X size={16} />
        </button>
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="mb-2 p-2 bg-gray-50 rounded border">
          <div className="text-xs font-medium text-gray-700 mb-2">Filter by type:</div>
          <div className="grid grid-cols-2 gap-1">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSearchFilter(option.value)}
                className={`flex items-center space-x-1 px-2 py-1 text-xs rounded transition-colors ${
                  searchFilter === option.value
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {option.icon}
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {searchQuery && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {searchResults.length === 0 
              ? 'No results' 
              : `${currentSearchIndex + 1} of ${searchResults.length}`
            }
          </span>
          
          {searchResults.length > 0 && (
            <div className="flex items-center space-x-1">
              <button
                onClick={previousSearchResult}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                title="Previous result (Shift+Enter)"
              >
                <ChevronUp size={14} />
              </button>
              <button
                onClick={nextSearchResult}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                title="Next result (Enter)"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-2 text-xs text-gray-500">
        Press <kbd className="px-1 py-0.5 bg-gray-100 rounded">Enter</kbd> to navigate results, 
        <kbd className="px-1 py-0.5 bg-gray-100 rounded">Esc</kbd> to close
      </div>
    </div>
  );
};