import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar, History, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { CollectionHistory } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function HistoryPage() {
  const { collectionHistory, students, deleteCollectionHistory } = useData();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [historyToDelete, setHistoryToDelete] = useState<CollectionHistory | null>(null);

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

  // Get collection data for selected date
  const getDateData = (date: string) => {
    const dateHistory = collectionHistory.filter(h =>
      h.date.toISOString().split('T')[0] === date
    );

    const collected = dateHistory.filter(h => h.status === 'collected');
    const notCollected = dateHistory.filter(h => h.status === 'not_collected');

    return {
      collected: collected.length,
      notCollected: notCollected.length,
      total: dateHistory.length,
      details: dateHistory
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
                      const complianceRate = data.total > 0 ? Math.round((data.collected / data.total) * 100) : 0;

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
                          <TableCell>{data.total}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-success" />
                              {data.collected}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-destructive" />
                              {data.notCollected}
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
                          <p className="text-2xl font-bold">{selectedDateData.total}</p>
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
                          <p className="text-2xl font-bold text-success">{selectedDateData.collected}</p>
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
                          <p className="text-2xl font-bold text-destructive">{selectedDateData.notCollected}</p>
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
                      <CheckCircle2 className="h-5 w-5" />
                      Sudah Mengumpulkan ({selectedDateData.collected})
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
                          {selectedDateData.details
                            .filter(h => h.status === 'collected')
                            .map((history) => {
                              const student = students.find(s => s.id === history.studentId);
                              return student ? (
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
                              ) : null;
                            })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Not Collected Students */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                      <XCircle className="h-5 w-5" />
                      Belum Mengumpulkan ({selectedDateData.notCollected})
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
                          {selectedDateData.details
                            .filter(h => h.status === 'not_collected')
                            .map((history) => {
                              const student = students.find(s => s.id === history.studentId);
                              return student ? (
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
                              ) : null;
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
