import { useData } from '@/contexts/DataContext';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export function ClassStatsTable() {
  const { getClassStats } = useData();
  const stats = getClassStats();

  return (
    <div className="stat-card border border-border fade-in">
      <h3 className="text-lg font-semibold text-foreground mb-4">Statistik Per Kelas</h3>
      <div className="space-y-4">
        {stats.map((stat) => (
          <div key={stat.className} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-12 items-center justify-center rounded-md bg-primary/10 text-sm font-semibold text-primary">
                  {stat.className}
                </span>
                <span className="text-sm text-muted-foreground">
                  {stat.collected}/{stat.total} siswa
                </span>
              </div>
              <span
                className={cn(
                  'text-sm font-semibold',
                  stat.percentage >= 80
                    ? 'text-success'
                    : stat.percentage >= 50
                    ? 'text-warning'
                    : 'text-destructive'
                )}
              >
                {stat.percentage}%
              </span>
            </div>
            <Progress
              value={stat.percentage}
              className={cn(
                'h-2',
                stat.percentage >= 80
                  ? '[&>div]:bg-success'
                  : stat.percentage >= 50
                  ? '[&>div]:bg-warning'
                  : '[&>div]:bg-destructive'
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
