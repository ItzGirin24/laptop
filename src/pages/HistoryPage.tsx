import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar, History, CheckCircle2, XCircle, Trash2, AlertTriangle, Clock, Download, Search } from 'lucide-react';
import { CollectionHistory } from '@/types';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

// Asumsi antarmuka Student didefinisikan di tempat lain (misalnya, di '@/types' atau DataContext).
// Jika tidak, Anda perlu mendefinisikannya di sini atau mengimpornya.
// Contoh struktur Student (sesuaikan jika berbeda):
// interface Student { id: string; name: string; studentNumber: string; className: string; lockerNumber: string; /* ... */ }

// Antarmuka untuk mengelompokkan siswa dengan entri riwayat terkait
interface StudentWithHistory {
  student: Student;
  history: CollectionHistory;
}
export default function HistoryPage() {
  const { collectionHistory, students, deleteCollectionHistory, hasActivePermission, getConfiscationByStudent, getNotCollectedCount, getDaysSinceLastCollected } = useData();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [historyToDelete, setHistoryToDelete] = useState<CollectionHistory | null>(null);
  const [searchDate, setSearchDate] = useState<string>('');
  const [exportMonthFilter, setExportMonthFilter] = useState<string>('all');

  // Reset searchDate when exportMonthFilter changes
  const handleExportMonthChange = (value: string) => {
    setExportMonthFilter(value);
    setSearchDate(''); // Reset selected date when month changes
  };

  // Get unique dates from collection history
  const uniqueDates = Array.from(
    new Set(
      collectionHistory.map(h => h.date.toISOString().split('T')[0])
    )
  ).sort().reverse(); // Most recent first

  // Filter dates by month if selected
  const filteredDates = uniqueDates.filter(date => {
    if (monthFilter === 'all') return true;
    return date.startsWith(monthFilter);
  });

  // Fungsi pembantu untuk mendapatkan entri riwayat unik berdasarkan nama siswa
  const getUniqueStudentsWithHistory = (
    historyEntries: CollectionHistory[],
    allStudents: typeof students // Menggunakan typeof students untuk menginferensi tipe Student[]
  ): StudentWithHistory[] => {
    const uniqueStudentNames = new Set<string>();
    const uniqueStudentHistory: StudentWithHistory[] = [];

    for (const entry of historyEntries) {
      const student = allStudents.find(s => s.id === entry.studentId);
      if (student && !uniqueStudentNames.has(student.name)) {
        uniqueStudentNames.add(student.name);
        uniqueStudentHistory.push({ student, history: entry });
      }
    }
    return uniqueStudentHistory;
  };

  // Get collection data for selected date
  const getDateData = (date: string) => {
    const dateHistory = collectionHistory.filter(h =>
      h.date.toISOString().split('T')[0] === date
    );

    const collectedHistory = dateHistory.filter(h => h.status === 'collected');
    const notCollectedHistory = dateHistory.filter(h => h.status === 'not_collected');

    // Deduplikasi berdasarkan nama siswa
    const uniqueCollectedStudentsWithHistory = getUniqueStudentsWithHistory(collectedHistory, students);
    const uniqueNotCollectedStudentsWithHistory = getUniqueStudentsWithHistory(notCollectedHistory, students);

    return {
      collectedCount: uniqueCollectedStudentsWithHistory.length,
      notCollectedCount: uniqueNotCollectedStudentsWithHistory.length,
      total: students.length,
      collectedStudents: uniqueCollectedStudentsWithHistory, // Daftar siswa unik yang sudah mengumpulkan
      notCollectedStudents: uniqueNotCollectedStudentsWithHistory, // Daftar siswa unik yang belum mengumpulkan
      rawDetails: dateHistory // Tetap simpan detail mentah jika diperlukan di tempat lain
    };
  };

  // Get available months for filter
  const availableMonths = Array.from(
    new Set(
      uniqueDates.map(date => date.substring(0, 7)) // YYYY-MM format
    )
  ).sort().reverse();

  const selectedDateData = selectedDate ? getDateData(selectedDate) : null;

  const handleDeleteHistory = async (history: CollectionHistory) => {
    try {
      await deleteCollectionHistory(history.id);
      toast({
        title: "Berhasil",
        description: "Riwayat pengumpulan berhasil dihapus",
      });
      setSelectedDate(null); // Close the dialog
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus riwayat pengumpulan",
        variant: "destructive",
      });
    }
  };

  const handleExportDate = () => {
    if (!searchDate) {
      toast({
        title: "Error",
        description: "Pilih tanggal terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    const dateData = getDateData(searchDate); // Ini sekarang mengembalikan struktur baru
    if (dateData.collectedStudents.length === 0 && dateData.notCollectedStudents.length === 0) {
      toast({
        title: "Error",
        description: "Tidak ada data pengumpulan untuk tanggal tersebut",
        variant: "destructive",
      });
      return;
    }

    // Prepare export data
    const exportData = [
      // Summary row
      {
        'Tanggal': new Date(searchDate).toLocaleDateString('id-ID'),
        'Total Siswa': dateData.total.toString(),
        'Sudah Mengumpul': dateData.collectedCount.toString(),
        'Belum Mengumpul': dateData.notCollectedCount.toString(),
        'Tingkat Kepatuhan': dateData.total > 0 ? `${Math.round((dateData.collectedCount / dateData.total) * 100)}%` : '0%',
        'Nama Siswa': '',
        'No. Absen': '',
        'Kelas': '',
        'Loker': '',
        'Status': '',
        'Jumlah Tidak Ngumpul': '',
        'Hari Sejak Terakhir Ngumpul': '',
        'Status Izin': '',
        'Status Sita': ''
      },
      // Empty row for separation
      {
        'Tanggal': '',
        'Total Siswa': '',
        'Sudah Mengumpul': '',
        'Belum Mengumpul': '',
        'Tingkat Kepatuhan': '',
        'Nama Siswa': '',
        'No. Absen': '',
        'Kelas': '',
        'Loker': '',
        'Status': '',
        'Jumlah Tidak Ngumpul': '',
        'Hari Sejak Terakhir Ngumpul': '',
        'Status Izin': '',
        'Status Sita': ''
      },
      // Header for collected students
      {
        'Tanggal': 'SISWA YANG SUDAH MENGUMPULKAN',
        'Total Siswa': '',
        'Sudah Mengumpul': '',
        'Belum Mengumpul': '',
        'Tingkat Kepatuhan': '',
        'Nama Siswa': '',
        'No. Absen': '',
        'Kelas': '',
        'Loker': '',
        'Status': '',
        'Jumlah Tidak Ngumpul': '',
        'Hari Sejak Terakhir Ngumpul': '',
        'Status Izin': '',
        'Status Sita': ''
      }
    ];

    dateData.collectedStudents // Gunakan daftar yang sudah dideduplikasi
      .forEach(({ student, history }) => { // Destrukturisasi student dan history
          exportData.push({
            'Tanggal': '',
            'Total Siswa': '',
            'Sudah Mengumpul': '',
            'Belum Mengumpul': '',
            'Tingkat Kepatuhan': '',
            'Nama Siswa': student.name,
            'No. Absen': student.studentNumber,
            'Kelas': student.className,
            'Loker': student.lockerNumber,
            'Status': 'Sudah Mengumpul',
            'Jumlah Tidak Ngumpul': getNotCollectedCount(student.id).toString(),
            'Hari Sejak Terakhir Ngumpul': (() => {
              const days = getDaysSinceLastCollected(student.id);
              return days === -1 ? 'Belum pernah' : `${days} hari`;
            })(),
            'Status Izin': hasActivePermission(student.id) ? 'Sedang Izin' : 'Tidak Ada Izin',
            'Status Sita': getConfiscationByStudent(student.id) ? 'Disita' : 'Belum Disita'
          });
      });

    // Add separator
    exportData.push({
      'Tanggal': '',
      'Total Siswa': '',
      'Sudah Mengumpul': '',
      'Belum Mengumpul': '',
      'Tingkat Kepatuhan': '',
      'Nama Siswa': '',
      'No. Absen': '',
      'Kelas': '',
      'Loker': '',
      'Status': '',
      'Jumlah Tidak Ngumpul': '',
      'Hari Sejak Terakhir Ngumpul': '',
      'Status Izin': '',
      'Status Sita': ''
    });

    // Header for not collected students
    exportData.push({
      'Tanggal': 'SISWA YANG BELUM MENGUMPULKAN',
      'Total Siswa': '',
      'Sudah Mengumpul': '',
      'Belum Mengumpul': '',
      'Tingkat Kepatuhan': '',
      'Nama Siswa': '',
      'No. Absen': '',
      'Kelas': '',
      'Loker': '',
      'Status': '',
      'Jumlah Tidak Ngumpul': '',
      'Hari Sejak Terakhir Ngumpul': '',
      'Status Izin': '',
      'Status Sita': ''
    });

    // Add not collected students
    dateData.notCollectedStudents
      .forEach(({ student, history }) => {
          exportData.push({
            'Tanggal': '',
            'Total Siswa': '',
            'Sudah Mengumpul': '',
            'Belum Mengumpul': '',
            'Tingkat Kepatuhan': '',
            'Nama Siswa': student.name,
            'No. Absen': student.studentNumber,
            'Kelas': student.className,
            'Loker': student.lockerNumber,
            'Status': 'Belum Mengumpul',
            'Jumlah Tidak Ngumpul': getNotCollectedCount(student.id).toString(),
            'Hari Sejak Terakhir Ngumpul': (() => {
              const days = getDaysSinceLastCollected(student.id);
              return days === -1 ? 'Belum pernah' : `${days} hari`;
            })(),
            'Status Izin': hasActivePermission(student.id) ? 'Sedang Izin' : 'Tidak Ada Izin',
            'Status Sita': getConfiscationByStudent(student.id) ? 'Disita' : 'Belum Disita'
          });
      });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Riwayat Pengumpulan');

    // Auto-fit columns
    const colWidths = [
      { wch: 15 }, // Tanggal
      { wch: 12 }, // Total Siswa
      { wch: 15 }, // Sudah Mengumpul
      { wch: 15 }, // Belum Mengumpul
      { wch: 18 }, // Tingkat Kepatuhan
      { wch: 30 }, // Nama Siswa
      { wch: 10 }, // No. Absen
      { wch: 10 }, // Kelas
      { wch: 15 }, // Loker
      { wch: 15 }, // Status
      { wch: 20 }, // Jumlah Tidak Ngumpul
      { wch: 25 }, // Hari Sejak Terakhir Ngumpul
      { wch: 15 }, // Status Izin
      { wch: 15 }, // Status Sita
    ];
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, `Riwayat_Pengumpulan_${searchDate}.xlsx`);
    toast({
      title: "Berhasil",
      description: "Data riwayat berhasil diexport",
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Riwayat Pengumpulan</h1>
            <p className="text-muted-foreground">
              Riwayat pengumpulan laptop berdasarkan tanggal
            </p>
          </div>
        </div>

        {/* Month Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Semua Bulan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Bulan</SelectItem>
                  {availableMonths.map((month) => {
                    const [year, monthNum] = month.split('-');
                    const monthNames = [
                      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
                    ];
                    return (
                      <SelectItem key={month} value={month}>
                        {monthNames[parseInt(monthNum) - 1]} {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Data
            </CardTitle>
            <CardDescription>
              Export riwayat pengumpulan berdasarkan tanggal yang sudah ada datanya
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-4">
                <div>
                  <label htmlFor="export-month" className="text-sm font-medium">
                    Pilih Bulan
                  </label>
                  <Select value={exportMonthFilter} onValueChange={handleExportMonthChange}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Pilih bulan terlebih dahulu" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Bulan</SelectItem>
                      {availableMonths.map((month) => {
                        const [year, monthNum] = month.split('-');
                        const monthNames = [
                          'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
                        ];
                        return (
                          <SelectItem key={month} value={month}>
                            {monthNames[parseInt(monthNum) - 1]} {year}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="export-date" className="text-sm font-medium">
                    Pilih Tanggal
                  </label>
                  <Select value={searchDate} onValueChange={setSearchDate} disabled={exportMonthFilter === 'all'}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={exportMonthFilter === 'all' ? "Pilih bulan terlebih dahulu" : "Pilih tanggal yang memiliki data"} />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueDates
                        .filter(date => exportMonthFilter === 'all' || date.startsWith(exportMonthFilter))
                        .map((date) => {
                          const dateObj = new Date(date);
                          const formattedDate = dateObj.toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          });
                          return (
                            <SelectItem key={date} value={date}>
                              {formattedDate}
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleExportDate} className="gap-2" disabled={!searchDate}>
                <Download className="h-4 w-4" />
                Export Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Dates Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Tanggal Pengumpulan
            </CardTitle>
            <CardDescription>
              Klik tanggal untuk melihat detail pengumpulan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Total Siswa</TableHead>
                    <TableHead>Sudah Ngumpul</TableHead>
                    <TableHead>Belum Ngumpul</TableHead>
                    <TableHead>Tingkat Kepatuhan</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        Tidak ada data riwayat
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDates.map((date) => {
                      const data = getDateData(date);
                      const complianceRate = data.total > 0 ? Math.round((data.collectedCount / data.total) * 100) : 0;

                      // Format date for display
                      const dateObj = new Date(date);
                      const formattedDate = dateObj.toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      });

                      return (
                        <TableRow key={date}>
                          <TableCell className="font-medium">{formattedDate}</TableCell>
                          <TableCell>{data.total.toString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-success">
                              <CheckCircle2 className="h-4 w-4 text-success" />
                              {data.collectedCount.toString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-destructive">
                              <XCircle className="h-4 w-4 text-destructive" />
                              {data.notCollectedCount.toString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={complianceRate >= 80 ? "default" : complianceRate >= 60 ? "secondary" : "destructive"}>
                              {complianceRate}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedDate(date)}
                            >
                              Lihat Detail
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Detail Pengumpulan - {selectedDate ? new Date(selectedDate).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : ''}
              </DialogTitle>
              <DialogDescription>
                Daftar siswa yang sudah dan belum mengumpulkan laptop
              </DialogDescription>
            </DialogHeader>

            {selectedDateData && (
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="rounded-full bg-muted p-3">
                          <History className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{selectedDateData.total.toString()}</p>
                          <p className="text-sm text-muted-foreground">Total Siswa</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-success/20 bg-success/5">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="rounded-full bg-success/10 p-3">
                          <CheckCircle2 className="h-6 w-6 text-success" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-success">{selectedDateData.collectedCount.toString()}</p>
                          <p className="text-sm text-muted-foreground">Sudah Ngumpul</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-destructive/20 bg-destructive/5">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="rounded-full bg-destructive/10 p-3">
                          <XCircle className="h-6 w-6 text-destructive" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-destructive">{selectedDateData.notCollectedCount.toString()}</p>
                          <p className="text-sm text-muted-foreground">Belum Ngumpul</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Collected Students */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-success">
                      <CheckCircle2 className="h-5 w-5" /> Sudah Mengumpulkan ({selectedDateData.collectedCount.toString()})
                    </CardTitle>
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
                            {isAdmin && <TableHead className="text-right">Aksi</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedDateData.collectedStudents
                            .map(({ student, history }) => (
                                <TableRow key={history.id}>
                                  <TableCell className="font-medium">{student.name}</TableCell>
                                  <TableCell>{student.studentNumber}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{student.className}</Badge>
                                  </TableCell>
                                  <TableCell>{student.lockerNumber}</TableCell>
                                  {isAdmin && (
                                    <TableCell className="text-right">
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            size="sm"
                                            variant="destructive"
                                            className="gap-1 h-7 px-2 text-xs"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                            Hapus
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Hapus Riwayat</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Apakah Anda yakin ingin menghapus riwayat pengumpulan {student.name} pada tanggal {selectedDate ? new Date(selectedDate).toLocaleDateString('id-ID') : ''}?
                                              <br />
                                              <strong>Tindakan ini tidak dapat dibatalkan.</strong>
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Batal</AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() => handleDeleteHistory(history)}
                                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                              Hapus
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </TableCell>
                                  )}
                                </TableRow>
                              ))
                            }
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Not Collected Students */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-5 w-5" /> Belum Mengumpulkan ({selectedDateData.notCollectedCount.toString()})
                    </CardTitle>
                    <CardDescription>
                      Siswa yang belum mengumpulkan laptop pada tanggal ini
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
                            <TableHead>Jumlah Tidak Ngumpul</TableHead>
                            <TableHead>Hari Sejak Terakhir Ngumpul</TableHead>
                            <TableHead>Status Izin</TableHead>
                            <TableHead>Status Sita</TableHead>
                            {isAdmin && <TableHead className="text-right">Aksi</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedDateData.notCollectedStudents
                            .map(({ student, history }) => {
                              // student dan history dijamin ada di sini karena logika getUniqueStudentsWithHistory

                              const confiscation = getConfiscationByStudent(student.id);
                              const hasPermission = hasActivePermission(student.id);

                              return (
                                <TableRow key={history.id}>
                                  <TableCell className="font-medium">{student.name}</TableCell>
                                  <TableCell>{student.studentNumber}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{student.className}</Badge>
                                  </TableCell>
                                  <TableCell>{student.lockerNumber}</TableCell>
                                  <TableCell>{getNotCollectedCount(student.id).toString()}</TableCell>
                                  <TableCell>
                                    {(() => {
                                      const days = getDaysSinceLastCollected(student.id);
                                      return days === -1 ? 'Belum pernah' : `${days} hari`;
                                    })()}
                                  </TableCell>
                                  <TableCell>
                                    {hasPermission ? (
                                      <Badge className="bg-warning text-warning-foreground">
                                        <Clock className="h-3 w-3 mr-1" />
                                        Sedang Izin
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary">Tidak Ada Izin</Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {confiscation ? (
                                      <Badge className="bg-destructive">Disita</Badge>
                                    ) : (
                                      <Badge variant="secondary">Belum Disita</Badge>
                                    )}
                                  </TableCell>
                                  {isAdmin && (
                                    <TableCell className="text-right">
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            size="sm"
                                            variant="destructive"
                                            className="gap-1 h-7 px-2 text-xs"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                            Hapus
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Hapus Riwayat</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Apakah Anda yakin ingin menghapus riwayat pengumpulan {student.name} pada tanggal {selectedDate ? new Date(selectedDate).toLocaleDateString('id-ID') : ''}?
                                              <br />
                                              <strong>Tindakan ini tidak dapat dibatalkan.</strong>
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Batal</AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() => handleDeleteHistory(history)}
                                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                              Hapus
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </TableCell>
                                  )}
                                </TableRow>
                              );
                            })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
