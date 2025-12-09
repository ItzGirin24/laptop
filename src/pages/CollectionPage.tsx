import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Search, CheckCheck, XCircle, Laptop, Download } from 'lucide-react';
import { CLASS_LIST, ClassName } from '@/types';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export default function 
Page() {
  const { students, updateCollectionStatus, bulkUpdateStatus, hasActivePermission } = useData();
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.lockerNumber.toLowerCase().includes(search.toLowerCase());
    const matchesClass = filterClass === 'all' || student.className === filterClass;
    const matchesStatus = filterStatus === 'all' || student.collectionStatus === filterStatus;
    return matchesSearch && matchesClass && matchesStatus;
  }).sort((a, b) => a.studentNumber - b.studentNumber);

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
                          <Laptop className="h-4 w-4" />
                          {student.collectionStatus === 'collected' ? 'Batal' : 'Kumpul'}
                        </Button>
                      </TableCell>
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
