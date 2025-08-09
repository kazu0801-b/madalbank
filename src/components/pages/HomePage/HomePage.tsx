import { Card } from '../../molecules/Card';
import { Button } from '../../atoms/Button';
import { MainLayout } from '../../templates/MainLayout';

export const HomePage: React.FC = () => {
  const handleSearch = (query: string) => {
    console.log('Searching for:', query);
  };

  return (
    <MainLayout title="Medal Bank" showSearch onSearch={handleSearch}>
      <div className="space-y-8">
        <section className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Medal Bank
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Track and manage your achievements
          </p>
          <Button size="lg">
            Get Started
          </Button>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card title="Recent Achievements">
            <p className="text-gray-600">View your latest medals and achievements.</p>
            <div className="mt-4">
              <Button variant="secondary">View All</Button>
            </div>
          </Card>

          <Card title="Statistics">
            <p className="text-gray-600">Track your progress and statistics.</p>
            <div className="mt-4">
              <Button variant="secondary">View Stats</Button>
            </div>
          </Card>

          <Card title="Leaderboard">
            <p className="text-gray-600">See how you rank among others.</p>
            <div className="mt-4">
              <Button variant="secondary">View Rankings</Button>
            </div>
          </Card>
        </section>
      </div>
    </MainLayout>
  );
};