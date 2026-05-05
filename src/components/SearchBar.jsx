import React, { useState, useEffect } from 'react';

const SearchBar = ({ data, searchKeys, placeholder, onResults, debounceMs = 300 }) => {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      // If no search term, return full data
      if (!searchTerm.trim()) {
        onResults(data);
        return;
      }

      const lowerSearch = searchTerm.toLowerCase();
      
      const filtered = data.filter((item) => {
        return searchKeys.some((key) => {
          const value = item[key];
          
          if (value === null || value === undefined) return false;
          // Special handling for arrays (tags)
          if (Array.isArray(value)) {
            return value.some((val) => 
              val.toString().toLowerCase().includes(lowerSearch)
            );
          }
          // Default string/number search
          return value.toString().toLowerCase().includes(lowerSearch);
        });
      });

      onResults(filtered);
    }, debounceMs);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, data, searchKeys, onResults, debounceMs]);

  return (
    <div className="search-bar-wrapper">
      <span className="search-icon">🔍</span>
      <input
        type="text"
        className="form-control"
        placeholder={placeholder || "Search..."}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );
};

export default SearchBar;
