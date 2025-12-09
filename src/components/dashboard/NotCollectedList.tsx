import { useData } from '@/contexts/DataContext';
import { AlertTriangle, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export function NotCollectedList() {
  const { getNotCollectedStudents, hasActivePermission } = useData();
  const notCollected = getNotCollectedStudents();

  // Separate into those with permission and those without
  const withPermission = notCollected.filter((s) => hasActivePermission(s.id));
  const forConfiscation = notCollected.filter((s) => !hasActivePermission(s.id));

  return (
    <div className="stat-card border border-border fade-in">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <h3 className="text-lg font-semibold text-foreground">
          Belum Mengumpul ({forConfiscation.length})
        </h3>
      </div>

      {forConfiscation.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mb-3">
            <User className="h-6 w-6 text-success" />
          </div>
          <p className="text-sm">Semua laptop sudah dikumpulkan!</p>
        </div>
      ) : (
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-2">
            {forConfiscation.slice(0, 20).map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between rounded-lg bg-destructive/5 px-4 py-3 border border-destructive/10"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
                    <span className="text-xs font-semibold text-destructive">
                      {student.studentNumber}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{student.name}</p>
                    <p className="text-xs text-muted-foreground">Loker: {student.lockerNumber}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-destructive border-destructive/30">
                  {student.className}
                </Badge>
              </div>
            ))}
            {forConfiscation.length > 20 && (
              <p className="text-center text-sm text-muted-foreground py-2">
                +{forConfiscation.length - 20} siswa lainnya
              </p>
            )}
          </div>
        </ScrollArea>
      )}

      {withPermission.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground mb-2">
            <span className="font-medium text-warning">{withPermission.length}</span> siswa memiliki izin aktif
          </p>
        </div>
      )}
    </div>
  );
}
