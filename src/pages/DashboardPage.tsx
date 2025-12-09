import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { ClassStatsTable } from '@/components/dashboard/ClassStatsTable';
import { NotCollectedList } from '@/components/dashboard/NotCollectedList';
import { Users, Laptop, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function DashboardPage() {
  const { students, getNotCollectedStudents } = useData();
  const { user } = useAuth();

  const notCollected = getNotCollectedStudents();
  const collected = students.filter((s) => s.collectionStatus === 'collected');
  const collectionRate = students.length > 0 
    ? Math.round((collected.length / students.length) * 100) 
    : 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="fade-in">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Selamat datang, {user?.name}! Berikut ringkasan status pengumpulan laptop.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Siswa"
            value={students.length}
            subtitle="8 Kelas"
            icon={Users}
            variant="primary"
          />
          <StatCard
            title="Sudah Mengumpul"
            value={collected.length}
            subtitle={`${collectionRate}% dari total`}
            icon={CheckCircle2}
            variant="success"
          />
          <StatCard
            title="Belum Mengumpul"
            value={notCollected.length}
            subtitle="Perlu ditindaklanjuti"
            icon={AlertTriangle}
            variant="destructive"
          />
          <StatCard
            title="Rate Pengumpulan"
            value={`${collectionRate}%`}
            subtitle="Tingkat kepatuhan"
            icon={Laptop}
            variant="default"
          />
        </div>

        {/* Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ClassStatsTable />
          <NotCollectedList />
        </div>
      </div>
    </AppLayout>
  );
}
