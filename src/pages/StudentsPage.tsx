import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { CLASS_LIST, ClassName, Student } from '@/types';
import { toast } from 'sonner';

export default function StudentsPage() {
  const { students, addStudent, updateStudent, deleteStudent } = useData();
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    studentNumber: '',
    className: '' as ClassName | '',
    lockerNumber: '',
  });

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.lockerNumber.toLowerCase().includes(search.toLowerCase());
    const matchesClass = filterClass === 'all' || student.className === filterClass;
    return matchesSearch && matchesClass;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.className) {
      toast.error('Pilih kelas terlebih dahulu');
      return;
    }

    if (editStudent) {
      updateStudent(editStudent.id, {
        name: formData.name,
        studentNumber: parseInt(formData.studentNumber),
        className: formData.className as ClassName,
        lockerNumber: formData.lockerNumber,
      });
      toast.success('Data siswa berhasil diperbarui');
      setEditStudent(null);
    } else {
      addStudent({
        name: formData.name,
        studentNumber: parseInt(formData.studentNumber),
        className: formData.className as ClassName,
        lockerNumber: formData.lockerNumber,
        collectionStatus: 'not_collected',
      });
      toast.success('Siswa berhasil ditambahkan');
    }

    setFormData({ name: '', studentNumber: '', className: '', lockerNumber: '' });
    setIsAddOpen(false);
  };

  const handleEdit = (student: Student) => {
    setEditStudent(student);
    setFormData({
      name: student.name,
      studentNumber: student.studentNumber.toString(),
      className: student.className,
      lockerNumber: student.lockerNumber,
    });
    setIsAddOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data siswa ini?')) {
      deleteStudent(id);
      toast.success('Data siswa berhasil dihapus');
    }
  };

  const handleDialogClose = () => {
    setIsAddOpen(false);
    setEditStudent(null);
    setFormData({ name: '', studentNumber: '', className: '', lockerNumber: '' });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Data Siswa</h1>
            <p className="text-muted-foreground mt-1">Kelola data siswa dan loker laptop</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={(open) => open ? setIsAddOpen(true) : handleDialogClose()}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Tambah Siswa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editStudent ? 'Edit Siswa' : 'Tambah Siswa Baru'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Siswa</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Masukkan nama siswa"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentNumber">Nomor Urut</Label>
                    <Input
                      id="studentNumber"
                      type="number"
                      value={formData.studentNumber}
                      onChange={(e) => setFormData({ ...formData, studentNumber: e.target.value })}
                      placeholder="1"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="className">Kelas</Label>
                    <Select
                      value={formData.className}
                      onValueChange={(value) => setFormData({ ...formData, className: value as ClassName })}
                    >
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lockerNumber">Nomor Loker</Label>
                  <Input
                    id="lockerNumber"
                    value={formData.lockerNumber}
                    onChange={(e) => setFormData({ ...formData, lockerNumber: e.target.value })}
                    placeholder="L1-01"
                    required
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={handleDialogClose} className="flex-1">
                    Batal
                  </Button>
                  <Button type="submit" className="flex-1">
                    {editStudent ? 'Simpan' : 'Tambah'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
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
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="table-header">
                <TableHead className="w-16">No</TableHead>
                <TableHead>Nama Siswa</TableHead>
                <TableHead className="w-24">Kelas</TableHead>
                <TableHead className="w-28">Loker</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-24 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Tidak ada data siswa
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student, index) => (
                  <TableRow key={student.id}>
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
                      <span className={`status-badge ${student.collectionStatus === 'collected' ? 'status-collected' : 'status-not-collected'}`}>
                        {student.collectionStatus === 'collected' ? 'Sudah' : 'Belum'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(student)}
                          className="h-8 w-8"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(student.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}
