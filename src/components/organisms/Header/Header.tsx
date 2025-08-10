import { Button } from '../../atoms/Button';
import { SearchBox } from '../../molecules/SearchBox';

interface HeaderProps {
  title: string;
  onSearch?: (query: string) => void;
  showSearch?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onSearch,
  showSearch = false,
}) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {showSearch && onSearch && (
              <div className="w-64">
                <SearchBox onSearch={onSearch} />
              </div>
            )}
            
            <nav className="flex space-x-4">
              <Button variant="secondary" size="sm">
                ホーム
              </Button>
              <Button variant="secondary" size="sm">
                概要
              </Button>
              <Button size="sm">
                ログイン
              </Button>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};