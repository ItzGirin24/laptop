import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, AlertTriangle, Gavel, Download, Clock } from 'lucide-react';
import { CLASS_LIST, ClassName, Student } from '@/types';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

export default function NotCollectedPage() {
  const { getNotCollectedStudents, hasActivePermission, addConfiscation, getConfiscationByStudent } = useData();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [confiscationDays, setConfiscationDays] = useState('30');
  const [confiscationReason, setConfiscationReason] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const notCollectedStudents = getNotCollectedStudents();

  const filteredStudents = notCollectedStudents.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lockerNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = classFilter === 'all' || student.className === classFilter;
    return matchesSearch && matchesClass;
  });

  // Separate students with and without active permissions
  const studentsWithoutPermission = filteredStudents.filter(s => !hasActivePermission(s.id));
  const studentsWithPermission = filteredStudents.filter(s => hasActivePermission(s.id));

  const handleConfiscate = async () => {
    if (!selectedStudent) return;

    const days = parseInt(confiscationDays);
    if (isNaN(days) || days <= 0) {
      toast({
        title: "Error",
        description: "Durasi sita harus lebih dari 0 hari",
        variant: "destructive",
      });
      return;
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    try {
      await addConfiscation({
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        className: selectedStudent.className,
        lockerNumber: selectedStudent.lockerNumber,
        reason: confiscationReason || 'Tidak mengumpulkan laptop',
        startDate,
        endDate,
        duration: days,
      });

      toast({
        title: "Berhasil",
        description: `Laptop ${selectedStudent.name} disita selama ${days} hari`,
      });

      setDialogOpen(false);
      setSelectedStudent(null);
      setConfiscationDays('30');
      setConfiscationReason('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan data sita",
        variant: "destructive",
      });
    }
  };

  const exportToExcel = () => {
    const data = studentsWithoutPermission.map((student, index) => ({
      'No': index + 1,
      'Nama Siswa': student.name,
      'No. Absen': student.studentNumber,
      'Kelas': student.className,
      'Loker': student.lockerNumber,
      'Status': 'Belum Mengumpul',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Belum Mengumpul');
    XLSX.writeFile(wb, `Belum_Mengumpul_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: "Berhasil",
      description: "Data berhasil diekspor",
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Belum Mengumpul</h1>
            <p className="text-muted-foreground">
              Daftar siswa yang belum mengumpulkan laptop
            </p>
          </div>
          <Button onClick={exportToExcel} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-destructive/10 p-3">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-destructive">{studentsWithoutPermission.length}</p>
                  <p className="text-sm text-muted-foreground">Perlu Tindakan</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-warning/20 bg-warning/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-warning/10 p-3">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-warning">{studentsWithPermission.length}</p>
                  <p className="text-sm text-muted-foreground">Sedang Izin</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-muted p-3">
                  <AlertTriangle className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{notCollectedStudents.length}</p>
                  <p className="text-sm text-muted-foreground">Total Belum Ngumpul</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari nama atau loker..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={classFilter} onValueChange={setClassFilter}>
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
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Perlu Tindakan ({studentsWithoutPermission.length})
            </CardTitle>
            <CardDescription>
              Siswa yang tidak mengumpulkan laptop tanpa izin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Siswa</TableHead>
                    <TableHead>No. Absen</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Loker</TableHead>
                    <TableHead>Status Sita</TableHead>
                    {isAdmin && <TableHead className="text-right">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsWithoutPermission.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 6 : 5} className="h-24 text-center text-muted-foreground">
                        Tidak ada siswa yang perlu tindakan
                      </TableCell>
                    </TableRow>
                  ) : (
                    studentsWithoutPermission.map((student) => {
                      const confiscation = getConfiscationByStudent(student.id);
                      return (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>{student.studentNumber}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{student.className}</Badge>
                          </TableCell>
                          <TableCell>{student.lockerNumber}</TableCell>
                          <TableCell>
                            {confiscation ? (
                              <Badge className="bg-destructive">Disita</Badge>
                            ) : (
                              <Badge variant="secondary">Belum Disita</Badge>
                            )}
                          </TableCell>
                          {isAdmin && (
                            <TableCell className="text-right">
                              {!confiscation && (
                                <Dialog open={dialogOpen && selectedStudent?.id === student.id} onOpenChange={(open) => {
                                  setDialogOpen(open);
                                  if (!open) setSelectedStudent(null);
                                }}>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="gap-1"
                                      onClick={() => setSelectedStudent(student)}
                                    >
                                      <Gavel className="h-4 w-4" />
                                      Sita
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Sita Laptop</DialogTitle>
                                      <DialogDescription>
                                        Sita laptop milik {selectedStudent?.name} ({selectedStudent?.className})
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                      <div className="space-y-2">
                                        <Label>Durasi Sita (hari)</Label>
                                        <Input
                                          type="number"
                                          value={confiscationDays}
                                          onChange={(e) => setConfiscationDays(e.target.value)}
                                          min="1"
                                          placeholder="30"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Alasan Sita</Label>
                                        <Textarea
                                          value={confiscationReason}
                                          onChange={(e) => setConfiscationReason(e.target.value)}
                                          placeholder="Tidak mengumpulkan laptop"
                                        />
                                      </div>
                                    </div>
                                    <DialogFooter>
                                      <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                        Batal
                                      </Button>
                                      <Button variant="destructive" onClick={handleConfiscate}>
                                        Konfirmasi Sita
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Students with Permission */}
        {studentsWithPermission.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-warning" />
                Sedang Izin ({studentsWithPermission.length})
              </CardTitle>
              <CardDescription>
                Siswa yang sedang dalam masa izin penggunaan laptop
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Siswa</TableHead>
                      <TableHead>No. Absen</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Loker</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentsWithPermission.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.studentNumber}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{student.className}</Badge>
                        </TableCell>
                        <TableCell>{student.lockerNumber}</TableCell>
                        <TableCell>
                          <Badge className="bg-warning text-warning-foreground">Sedang Izin</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
