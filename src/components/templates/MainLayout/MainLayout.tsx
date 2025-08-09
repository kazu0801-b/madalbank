import { Header } from '../../organisms/Header';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  title = "Medal Bank",
  showSearch = false,
  onSearch,
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title={title} 
        showSearch={showSearch} 
        onSearch={onSearch}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};