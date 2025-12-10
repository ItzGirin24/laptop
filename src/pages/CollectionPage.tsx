import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, CheckCheck, XCircle, Laptop, Download, Clock } from 'lucide-react';
import { CLASS_LIST, ClassName, Student } from '@/types';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export default function 
Page() {
  const { students, updateCollectionStatus, bulkUpdateStatus, hasActivePermission, addPermission } = useData();
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [studentForPermission, setStudentForPermission] = useState<Student | null>(null);

  const [permissionFormData, setPermissionFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '20:00',
    endTime: '22:00',
    reason: '',
  });

  const handleOpenPermissionDialog = (student: Student) => {
    setStudentForPermission(student);
    setIsPermissionDialogOpen(true);
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.lockerNumber.toLowerCase().includes(search.toLowerCase());
    const matchesClass = filterClass === 'all' || student.className === filterClass;
    const matchesStatus = filterStatus === 'all' || student.collectionStatus === filterStatus;
    return matchesSearch && matchesClass && matchesStatus;
  }).sort((a, b) => {
    // Sort by class order first
    const classOrder = ['XA', 'XB', 'XIA', 'XIB', 'XIC', 'XIIA', 'XIIB', 'XIIC'];
    const aClassIndex = classOrder.indexOf(a.className);
    const bClassIndex = classOrder.indexOf(b.className);

    if (aClassIndex !== bClassIndex) {
      return aClassIndex - bClassIndex;
    }

    // Then sort by student number within the same class
    return a.studentNumber - b.studentNumber;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredStudents.map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    }
  };

  const handleBulkCollect = () => {
    if (selectedIds.length === 0) {
      toast.error('Pilih siswa terlebih dahulu');
      return;
    }
    bulkUpdateStatus(selectedIds, 'collected');
    setSelectedIds([]);
    toast.success(`${selectedIds.length} siswa ditandai sudah mengumpul`);
  };

  const handleBulkNotCollect = () => {
    if (selectedIds.length === 0) {
      toast.error('Pilih siswa terlebih dahulu');
      return;
    }
    bulkUpdateStatus(selectedIds, 'not_collected');
    setSelectedIds([]);
    toast.success(`${selectedIds.length} siswa ditandai belum mengumpul`);
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'collected' ? 'not_collected' : 'collected';
    updateCollectionStatus(id, newStatus);
    toast.success(`Status diperbarui`);
  };

  const handlePermissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForPermission) return;

    try {
      await addPermission({
        studentId: studentForPermission.id,
        studentName: studentForPermission.name,
        className: studentForPermission.className,
        date: new Date(permissionFormData.date),
        startTime: permissionFormData.startTime,
        endTime: permissionFormData.endTime,
        reason: permissionFormData.reason,
      });

      toast.success(`Izin untuk ${studentForPermission.name} berhasil ditambahkan.`);
      setIsPermissionDialogOpen(false);
      setStudentForPermission(null);
      setPermissionFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '20:00',
        endTime: '22:00',
        reason: '',
      });
    } catch (error) {
      toast.error("Gagal menambahkan izin. Silakan coba lagi.");
    }
  };

  const handlePermissionDialogClose = () => {
    setIsPermissionDialogOpen(false);
    setStudentForPermission(null);
  };

  const isAllSelected = filteredStudents.length > 0 &&
    filteredStudents.every((s) => selectedIds.includes(s.id));

  const exportToExcel = () => {
    const data = filteredStudents.map((student, index) => ({
      'No': index + 1,
      'Nama Siswa': student.name,
      'No. Absen': student.studentNumber,
      'Kelas': student.className,
      'Loker': student.lockerNumber,
      'Status': student.collectionStatus === 'collected' ? 'Sudah Mengumpul' : 'Belum Mengumpul',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pengumpulan Laptop');
    XLSX.writeFile(wb, `Pengumpulan_Laptop_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast.success('Data berhasil diekspor');
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Pengumpulan Laptop</h1>
            <p className="text-muted-foreground mt-1">Kelola status pengumpulan laptop siswa</p>
          </div>
          <Button onClick={exportToExcel} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Ekspor Excel
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama atau nomor loker..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterClass} onValueChange={setFilterClass}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Semua Kelas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kelas</SelectItem>
              {CLASS_LIST.map((cls) => (
                <SelectItem key={cls} value={cls}>{cls}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="collected">Sudah Mengumpul</SelectItem>
              <SelectItem value="not_collected">Belum Mengumpul</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <span className="text-sm font-medium text-foreground">
              {selectedIds.length} siswa dipilih
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="gap-2" onClick={handleBulkCollect}>
                <CheckCheck className="h-4 w-4 text-success" />
                Tandai Sudah
              </Button>
              <Button size="sm" variant="outline" className="gap-2" onClick={handleBulkNotCollect}>
                <XCircle className="h-4 w-4 text-destructive" />
                Tandai Belum
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="table-header">
                <TableHead className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-16">No</TableHead>
                <TableHead>Nama Siswa</TableHead>
                <TableHead className="w-24">Kelas</TableHead>
                <TableHead className="w-28">Loker</TableHead>
                <TableHead className="w-36">Status</TableHead>
                <TableHead className="w-24 text-center">Aksi</TableHead>
                <TableHead className="w-24 text-center">Izin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Tidak ada data siswa
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student, index) => {
                  const hasPermission = hasActivePermission(student.id);
                  return (
                    <TableRow key={student.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(student.id)}
                          onCheckedChange={(checked) => handleSelectOne(student.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground">No. Urut: {student.studentNumber}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                          {student.className}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{student.lockerNumber}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`status-badge ${student.collectionStatus === 'collected' ? 'status-collected' : hasPermission ? 'status-permitted' : 'status-not-collected'}`}>
                            {student.collectionStatus === 'collected'
                              ? 'Sudah'
                              : hasPermission
                              ? 'Berizin'
                              : 'Belum'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(student.id, student.collectionStatus)}
                          className={`gap-1 ${student.collectionStatus === 'collected' ? 'text-destructive hover:text-destructive' : 'text-success hover:text-success'}`}
                        >
                          {student.collectionStatus === 'collected' ? <XCircle className="h-4 w-4" /> : <CheckCheck className="h-4 w-4" />}
                          {student.collectionStatus === 'collected' ? 'Batal' : 'Kumpul'}
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        {student.collectionStatus === 'not_collected' && !hasPermission && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenPermissionDialog(student)}
                            className="gap-1 text-warning hover:text-warning border-warning/50 hover:bg-warning/10"
                          >
                            <Clock className="h-4 w-4" />
                            Izin
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Permission Dialog */}
        <Dialog open={isPermissionDialogOpen} onOpenChange={handlePermissionDialogClose}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Tambah Izin untuk {studentForPermission?.name}</DialogTitle>
              <DialogDescription>
                Siswa: {studentForPermission?.name} ({studentForPermission?.className})
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePermissionSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="date">Tanggal</Label>
                <Input
                  id="date"
                  type="date"
                  value={permissionFormData.date}
                  onChange={(e) => setPermissionFormData({ ...permissionFormData, date: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Waktu Mulai</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={permissionFormData.startTime}
                    onChange={(e) => setPermissionFormData({ ...permissionFormData, startTime: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">Waktu Selesai</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={permissionFormData.endTime}
                    onChange={(e) => setPermissionFormData({ ...permissionFormData, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Keterangan/Keperluan</Label>
                <Textarea
                  id="reason"
                  value={permissionFormData.reason}
                  onChange={(e) => setPermissionFormData({ ...permissionFormData, reason: e.target.value })}
                  placeholder="Contoh: Mengerjakan tugas kelompok"
                  required
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={handlePermissionDialogClose}>
                  Batal
                </Button>
                <Button type="submit">
                  Simpan Izin
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
