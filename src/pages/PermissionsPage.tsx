import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Checkbox } from '@/components/ui/checkbox';
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
  DialogFooter,
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
import { Plus, Search, Trash2, Clock, Edit, CheckCircle, AlertTriangle, XCircle, Download } from 'lucide-react';
import { CLASS_LIST, ClassName, Student, LaptopPermission } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { isPast, parse } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export default function PermissionsPage() {
  const { students, permissions, addPermission, updatePermission, deletePermission, completePermission } = useData();
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isRemoveDuplicatesOpen, setIsRemoveDuplicatesOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingPermission, setEditingPermission] = useState<LaptopPermission | null>(null);

  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '20:00',
    endTime: '22:00',
    reason: '',
  });

  const [editFormData, setEditFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    reason: '',
  });

  // State for export dialog
  const [exportMonth, setExportMonth] = useState<string>('');
  const [exportDate, setExportDate] = useState<string>('');

  /**
   * Memeriksa apakah sebuah izin sudah selesai berdasarkan tanggal dan waktu berakhirnya.
   * @param perm Objek LaptopPermission
   * @returns boolean
   */
  const isPermissionCompleted = (perm: LaptopPermission): boolean => {
    const permDateStr = format(new Date(perm.date), 'yyyy-MM-dd');
    const endDateTimeStr = `${permDateStr} ${perm.endTime}`;
    try {
      const endDateTime = parse(endDateTimeStr, 'yyyy-MM-dd HH:mm', new Date());
      return isPast(endDateTime);
    } catch (error) {
      console.error("Error parsing permission date/time:", error);
      return true; // Anggap selesai jika terjadi galat parsing
    }
  };

  // Hanya tampilkan izin yang belum selesai di tabel utama
  const filteredPermissions = permissions
    .filter(perm => !isPermissionCompleted(perm))
    .filter(perm => perm.studentName.toLowerCase().includes(search.toLowerCase()));

  const studentsInClass = students.filter((s) => s.className === selectedClass);
  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredPermissions.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const isAllSelected = filteredPermissions.length > 0 && selectedIds.length === filteredPermissions.length;
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

  const handleEdit = (permission: LaptopPermission) => {
    setEditingPermission(permission);
    setEditFormData({
      date: format(new Date(permission.date), 'yyyy-MM-dd'),
      startTime: permission.startTime,
      endTime: permission.endTime,
      reason: permission.reason,
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingPermission) return;

    updatePermission(editingPermission.id, {
      date: new Date(editFormData.date),
      startTime: editFormData.startTime,
      endTime: editFormData.endTime,
      reason: editFormData.reason,
    });

    toast.success('Izin berhasil diperbarui');
    setIsEditOpen(false);
    setEditingPermission(null);
  };

  const isPermissionActive = (perm: typeof permissions[0]) => {
    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');
    const permDate = format(new Date(perm.date), 'yyyy-MM-dd');
    const currentTime = format(now, 'HH:mm');

    return permDate === today && perm.startTime <= currentTime && perm.endTime >= currentTime;
  };

  // Find duplicate permissions based on student, date, and time
  const duplicatePermissions = permissions.filter((perm, index, arr) => {
    return arr.findIndex(p =>
      p.studentId === perm.studentId &&
      format(new Date(p.date), 'yyyy-MM-dd') === format(new Date(perm.date), 'yyyy-MM-dd') &&
      p.startTime === perm.startTime &&
      p.endTime === perm.endTime
    ) !== index;
  });

  const handleRemoveDuplicates = () => {
    const uniquePermissions = permissions.filter((perm, index, arr) => {
      return arr.findIndex(p =>
        p.studentId === perm.studentId &&
        format(new Date(p.date), 'yyyy-MM-dd') === format(new Date(perm.date), 'yyyy-MM-dd') &&
        p.startTime === perm.startTime &&
        p.endTime === perm.endTime
      ) === index;
    });

    // Delete duplicate permissions
    duplicatePermissions.forEach(perm => {
      deletePermission(perm.id);
    });

    toast.success(`Berhasil menghapus ${duplicatePermissions.length} data izin ganda`);
    setIsRemoveDuplicatesOpen(false);
  };

  const handleComplete = (id: string) => {
    completePermission(id);
    toast.success('Izin berhasil diselesaikan');
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) {
      toast.error("Pilih izin yang akan dihapus terlebih dahulu.");
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} data izin yang dipilih?`)) {
      selectedIds.forEach(id => {
        deletePermission(id);
      });
      toast.success(`${selectedIds.length} data izin berhasil dihapus.`);
      setSelectedIds([]);
    }
  };

  // --- Export Logic ---
  const availableMonthsForExport = Array.from(
    new Set(
      permissions.map(p => format(new Date(p.date), 'yyyy-MM'))
    )
  ).sort().reverse();

  const availableDatesForExport = Array.from(
    new Set(
      permissions
        .filter(p => format(new Date(p.date), 'yyyy-MM') === exportMonth)
        .map(p => format(new Date(p.date), 'yyyy-MM-dd'))
    )
  ).sort();

  const handleExport = () => {
    if (!exportDate) {
      toast.error("Pilih tanggal terlebih dahulu untuk mengekspor data.");
      return;
    }

    const permissionsToExport = permissions.filter(p => format(new Date(p.date), 'yyyy-MM-dd') === exportDate);

    if (permissionsToExport.length === 0) {
      toast.info("Tidak ada data izin untuk tanggal yang dipilih.");
      return;
    }

    const exportData = permissionsToExport.map((p, index) => ({
      'No': index + 1,
      'Nama Siswa': p.studentName,
      'Kelas': p.className,
      'Tanggal': format(new Date(p.date), 'd MMMM yyyy', { locale: localeId }),
      'Waktu Mulai': p.startTime,
      'Waktu Selesai': p.endTime,
      'Keterangan': p.reason,
      'Status': isPermissionActive(p) ? 'Aktif' : 'Selesai',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Izin ${exportDate}`);

    // Auto-fit columns
    worksheet['!cols'] = [
      { wch: 5 },
      { wch: 30 },
      { wch: 10 },
      { wch: 18 },
      { wch: 12 },
      { wch: 12 },
      { wch: 40 },
      { wch: 10 },
    ];

    XLSX.writeFile(workbook, `Data_Izin_${exportDate}.xlsx`);
    toast.success(`Berhasil mengekspor ${permissionsToExport.length} data izin.`);
    setIsExportOpen(false);
  };

  const handleExportDialogChange = (open: boolean) => {
    if (!open) {
      setExportMonth('');
      setExportDate('');
    }
    setIsExportOpen(open);
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
          <div className="flex flex-wrap gap-2">
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

            <Dialog open={isExportOpen} onOpenChange={handleExportDialogChange}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Export Data Izin</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Pilih Bulan</Label>
                    <Select value={exportMonth} onValueChange={(v) => { setExportMonth(v); setExportDate(''); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih bulan" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableMonthsForExport.map(month => (
                          <SelectItem key={month} value={month}>
                            {format(new Date(month), 'MMMM yyyy', { locale: localeId })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Pilih Tanggal</Label>
                    <Select value={exportDate} onValueChange={setExportDate} disabled={!exportMonth}>
                      <SelectTrigger>
                        <SelectValue placeholder={!exportMonth ? "Pilih bulan dulu" : "Pilih tanggal"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDatesForExport.map(date => (
                          <SelectItem key={date} value={date}>
                            {format(new Date(date), 'EEEE, d MMMM yyyy', { locale: localeId })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsExportOpen(false)}>
                      Batal
                    </Button>
                    <Button onClick={handleExport} disabled={!exportDate}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>

            {duplicatePermissions.length > 0 && (
              <Dialog open={isRemoveDuplicatesOpen} onOpenChange={setIsRemoveDuplicatesOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Hapus Data Ganda ({duplicatePermissions.length})
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Hapus Data Izin Ganda</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                        <div>
                          <p className="font-medium text-destructive">Ditemukan {duplicatePermissions.length} data izin ganda</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Data ganda akan dihapus berdasarkan siswa yang sama, tanggal yang sama, dan waktu yang sama.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Data yang akan dihapus:</p>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {duplicatePermissions.slice(0, 5).map((perm, index) => (
                          <div key={perm.id} className="text-xs bg-muted p-2 rounded">
                            {index + 1}. {perm.studentName} ({perm.className}) - {format(new Date(perm.date), 'd MMM yyyy', { locale: localeId })}
                          </div>
                        ))}
                        {duplicatePermissions.length > 5 && (
                          <div className="text-xs text-muted-foreground p-2">
                            ... dan {duplicatePermissions.length - 5} data lainnya
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsRemoveDuplicatesOpen(false)}
                        className="flex-1"
                      >
                        Batal
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleRemoveDuplicates}
                        className="flex-1"
                      >
                        Hapus Data Ganda
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <Dialog open={isEditOpen} onOpenChange={(open) => { if (!open) setEditingPermission(null); setIsEditOpen(open); }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Izin</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-date">Tanggal</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={editFormData.date}
                    onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-startTime">Waktu Mulai</Label>
                    <Input
                      id="edit-startTime"
                      type="time"
                      value={editFormData.startTime}
                      onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-endTime">Waktu Selesai</Label>
                    <Input
                      id="edit-endTime"
                      type="time"
                      value={editFormData.endTime}
                      onChange={(e) => setEditFormData({ ...editFormData, endTime: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-reason">Keterangan/Keperluan</Label>
                  <Textarea
                    id="edit-reason"
                    value={editFormData.reason}
                    onChange={(e) => setEditFormData({ ...editFormData, reason: e.target.value })}
                    placeholder="Contoh: Mengerjakan tugas kelompok"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="flex-1">
                    Batal
                  </Button>
                  <Button type="submit" className="flex-1">
                    Simpan Perubahan
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

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between gap-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <span className="text-sm font-medium text-foreground">
              {selectedIds.length} izin dipilih
            </span>
            <Button
              size="sm"
              variant="destructive"
              className="gap-2"
              onClick={handleBulkDelete}
            >
              <Trash2 className="h-4 w-4" />
              Hapus yang Dipilih
            </Button>
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
                  <TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-8 text-muted-foreground">
                    Tidak ada data izin
                  </TableCell>
                </TableRow>
              ) : (
                filteredPermissions.map((perm) => {
                  const isActive = isPermissionActive(perm);
                  return (
                    <TableRow key={perm.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(perm.id)}
                          onCheckedChange={(checked) => handleSelectOne(perm.id, checked as boolean)}
                        />
                      </TableCell>
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
                          <div className="flex justify-end gap-1">
                            {isActive && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleComplete(perm.id)}
                                className="h-8 w-8 text-green-600 hover:text-green-700"
                                title="Selesai - Tandai siswa sudah mengumpulkan"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(perm)}
                              className="h-8 w-8 text-blue-600 hover:text-blue-700"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(perm.id)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
