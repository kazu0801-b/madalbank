import { useState } from 'react';
import { Input } from '../../atoms/Input';
import { Button } from '../../atoms/Button';

interface SearchBoxProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const SearchBox: React.FC<SearchBoxProps> = ({
  onSearch,
  placeholder = "Search...",
  disabled = false,
}) => {
  const [query, setQuery] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };
  
  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="flex-1">
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={disabled}
        />
      </div>
      <Button type="submit" disabled={disabled || !query.trim()}>
        Search
      </Button>
    </form>
  );
};