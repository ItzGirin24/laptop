import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Trash2, Clock } from 'lucide-react';
import { CLASS_LIST, ClassName, Student } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export default function PermissionsPage() {
  const { students, permissions, addPermission, deletePermission } = useData();
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '20:00',
    endTime: '22:00',
    reason: '',
  });

  const filteredPermissions = permissions.filter((perm) =>
    perm.studentName.toLowerCase().includes(search.toLowerCase())
  );

  const studentsInClass = students.filter((s) => s.className === selectedClass);
  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudent) {
      toast.error('Pilih siswa terlebih dahulu');
      return;
    }

    addPermission({
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      className: selectedStudent.className,
      date: new Date(formData.date),
      startTime: formData.startTime,
      endTime: formData.endTime,
      reason: formData.reason,
    });

    toast.success('Izin berhasil ditambahkan');
    setIsAddOpen(false);
    setSelectedClass('');
    setSelectedStudentId('');
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: '20:00',
      endTime: '22:00',
      reason: '',
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus izin ini?')) {
      deletePermission(id);
      toast.success('Izin berhasil dihapus');
    }
  };

  const isPermissionActive = (perm: typeof permissions[0]) => {
    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');
    const permDate = format(new Date(perm.date), 'yyyy-MM-dd');
    const currentTime = format(now, 'HH:mm');

    return permDate === today && perm.startTime <= currentTime && perm.endTime >= currentTime;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Izin Penggunaan Laptop</h1>
            <p className="text-muted-foreground mt-1">Kelola izin peminjaman laptop di luar jam pengumpulan</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Tambah Izin
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Tambah Izin Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Kelas</Label>
                    <Select value={selectedClass} onValueChange={(v) => {
                      setSelectedClass(v);
                      setSelectedStudentId('');
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kelas" />
                      </SelectTrigger>
                      <SelectContent>
                        {CLASS_LIST.map((cls) => (
                          <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Siswa</Label>
                    <Select 
                      value={selectedStudentId} 
                      onValueChange={setSelectedStudentId}
                      disabled={!selectedClass}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih siswa" />
                      </SelectTrigger>
                      <SelectContent>
                        {studentsInClass.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.studentNumber}. {student.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Tanggal</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Waktu Mulai</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">Waktu Selesai</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Keterangan/Keperluan</Label>
                  <Textarea
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Contoh: Mengerjakan tugas kelompok"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="flex-1">
                    Batal
                  </Button>
                  <Button type="submit" className="flex-1">
                    Simpan Izin
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama siswa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="table-header">
                <TableHead className="w-16">No</TableHead>
                <TableHead>Nama Siswa</TableHead>
                <TableHead className="w-24">Kelas</TableHead>
                <TableHead className="w-32">Tanggal</TableHead>
                <TableHead className="w-36">Waktu</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead className="w-24">Status</TableHead>
                {isAdmin && <TableHead className="w-20 text-right">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPermissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 8 : 7} className="text-center py-8 text-muted-foreground">
                    Tidak ada data izin
                  </TableCell>
                </TableRow>
              ) : (
                filteredPermissions.map((perm, index) => {
                  const isActive = isPermissionActive(perm);
                  return (
                    <TableRow key={perm.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-medium">{perm.studentName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                          {perm.className}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(perm.date), 'd MMM yyyy', { locale: localeId })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {perm.startTime} - {perm.endTime}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{perm.reason}</TableCell>
                      <TableCell>
                        <span className={`status-badge ${isActive ? 'status-permitted' : 'bg-muted text-muted-foreground'}`}>
                          {isActive ? 'Aktif' : 'Selesai'}
                        </span>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(perm.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}
