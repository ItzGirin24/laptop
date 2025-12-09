import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Search, Gavel, RotateCcw, X, Clock, CheckCircle, Download, Bell, Trash2 } from 'lucide-react';
import { CLASS_LIST, Confiscation } from '@/types';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

function ConfiscationTimer({ endDate }: { endDate: Date }) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const difference = end - now;

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
        isExpired: false,
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  if (timeLeft.isExpired) {
    return (
      <div className="flex items-center gap-2 text-destructive">
        <Bell className="h-4 w-4 animate-pulse" />
        <span className="font-medium">Waktunya dikembalikan!</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 font-mono text-sm">
      <span className="rounded bg-primary/10 px-2 py-1 text-primary font-semibold">
        {timeLeft.days}h
      </span>
      <span>:</span>
      <span className="rounded bg-muted px-2 py-1">
        {String(timeLeft.hours).padStart(2, '0')}j
      </span>
      <span>:</span>
      <span className="rounded bg-muted px-2 py-1">
        {String(timeLeft.minutes).padStart(2, '0')}m
      </span>
      <span>:</span>
      <span className="rounded bg-muted px-2 py-1">
        {String(timeLeft.seconds).padStart(2, '0')}d
      </span>
    </div>
  );
}

export default function ConfiscationPage() {
  const { confiscations, returnConfiscation, cancelConfiscation, deleteConfiscation } = useData();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('active');

  const activeConfiscations = confiscations.filter((c) => c.status === 'active');
  const returnedConfiscations = confiscations.filter((c) => c.status === 'returned');
  const cancelledConfiscations = confiscations.filter((c) => c.status === 'cancelled');

  // Check for expired confiscations
  const expiredConfiscations = activeConfiscations.filter((c) => new Date(c.endDate) <= new Date());

  const filterConfiscations = (list: Confiscation[]) => {
    return list.filter((c) => {
      const matchesSearch = c.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.lockerNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClass = classFilter === 'all' || c.className === classFilter;
      return matchesSearch && matchesClass;
    });
  };

  const handleReturn = async (id: string, studentName: string) => {
    try {
      await returnConfiscation(id);
      toast({
        title: "Berhasil",
        description: `Laptop ${studentName} telah dikembalikan`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengembalikan laptop",
        variant: "destructive",
      });
    }
  };

  const handleCancel = async (id: string, studentName: string) => {
    try {
      await cancelConfiscation(id);
      toast({
        title: "Berhasil",
        description: `Sita laptop ${studentName} dibatalkan`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal membatalkan sita",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string, studentName: string) => {
    try {
      await deleteConfiscation(id);
      toast({
        title: "Berhasil",
        description: `Riwayat sita ${studentName} berhasil dihapus`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus riwayat sita",
        variant: "destructive",
      });
    }
  };

  const exportToExcel = () => {
    const data = activeConfiscations.map((c, index) => ({
      'No': index + 1,
      'Nama Siswa': c.studentName,
      'Kelas': c.className,
      'Loker': c.lockerNumber,
      'Alasan': c.reason,
      'Tanggal Sita': new Date(c.startDate).toLocaleDateString('id-ID'),
      'Tanggal Pengembalian': new Date(c.endDate).toLocaleDateString('id-ID'),
      'Durasi (Hari)': c.duration,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Sita');
    XLSX.writeFile(wb, `Data_Sita_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: "Berhasil",
      description: "Data sita berhasil diekspor",
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Penyitaan Laptop</h1>
            <p className="text-muted-foreground">
              Kelola laptop yang disita dengan timer pengembalian
            </p>
          </div>
          <Button onClick={exportToExcel} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Data Sita
          </Button>
        </div>

        {/* Notification for expired */}
        {expiredConfiscations.length > 0 && (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-full bg-destructive/10 p-3">
                <Bell className="h-6 w-6 text-destructive animate-pulse" />
              </div>
              <div>
                <p className="font-semibold text-destructive">
                  {expiredConfiscations.length} laptop perlu dikembalikan!
                </p>
                <p className="text-sm text-muted-foreground">
                  Masa sita sudah berakhir, segera kembalikan laptop ke siswa
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-destructive/10 p-3">
                  <Gavel className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeConfiscations.length}</p>
                  <p className="text-sm text-muted-foreground">Sedang Disita</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-warning/10 p-3">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{expiredConfiscations.length}</p>
                  <p className="text-sm text-muted-foreground">Perlu Dikembalikan</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-success/10 p-3">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{returnedConfiscations.length}</p>
                  <p className="text-sm text-muted-foreground">Sudah Dikembalikan</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-muted p-3">
                  <X className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{cancelledConfiscations.length}</p>
                  <p className="text-sm text-muted-foreground">Dibatalkan</p>
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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="active" className="gap-2">
              <Gavel className="h-4 w-4" />
              Sedang Disita ({activeConfiscations.length})
            </TabsTrigger>
            <TabsTrigger value="returned" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Dikembalikan ({returnedConfiscations.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="gap-2">
              <X className="h-4 w-4" />
              Dibatalkan ({cancelledConfiscations.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle>Laptop Sedang Disita</CardTitle>
                <CardDescription>
                  Timer menunjukkan sisa waktu sampai pengembalian
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Siswa</TableHead>
                        <TableHead>Kelas</TableHead>
                        <TableHead>Loker</TableHead>
                        <TableHead>Alasan</TableHead>
                        <TableHead>Sisa Waktu</TableHead>
                        {isAdmin && <TableHead className="text-right">Aksi</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterConfiscations(activeConfiscations).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={isAdmin ? 6 : 5} className="h-24 text-center text-muted-foreground">
                            Tidak ada laptop yang sedang disita
                          </TableCell>
                        </TableRow>
                      ) : (
                        filterConfiscations(activeConfiscations).map((confiscation) => (
                          <TableRow key={confiscation.id}>
                            <TableCell className="font-medium">{confiscation.studentName}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{confiscation.className}</Badge>
                            </TableCell>
                            <TableCell>{confiscation.lockerNumber}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{confiscation.reason}</TableCell>
                            <TableCell>
                              <ConfiscationTimer endDate={confiscation.endDate} />
                            </TableCell>
                            {isAdmin && (
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" variant="outline" className="gap-1">
                                        <RotateCcw className="h-4 w-4" />
                                        Kembalikan
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Kembalikan Laptop?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Apakah laptop {confiscation.studentName} sudah dikembalikan?
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Batal</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleReturn(confiscation.id, confiscation.studentName)}>
                                          Konfirmasi
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" variant="ghost" className="gap-1 text-muted-foreground">
                                        <X className="h-4 w-4" />
                                        Batalkan
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Batalkan Sita?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Apakah Anda yakin ingin membatalkan sita laptop {confiscation.studentName}?
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Tidak</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleCancel(confiscation.id, confiscation.studentName)}>
                                          Ya, Batalkan
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="returned">
            <Card>
              <CardHeader>
                <CardTitle>Laptop Sudah Dikembalikan</CardTitle>
                <CardDescription>
                  Riwayat laptop yang sudah dikembalikan ke siswa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Siswa</TableHead>
                        <TableHead>Kelas</TableHead>
                        <TableHead>Loker</TableHead>
                        <TableHead>Tanggal Sita</TableHead>
                        <TableHead>Tanggal Kembali</TableHead>
                        {isAdmin && <TableHead className="text-right">Aksi</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterConfiscations(returnedConfiscations).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={isAdmin ? 6 : 5} className="h-24 text-center text-muted-foreground">
                            Belum ada laptop yang dikembalikan
                          </TableCell>
                        </TableRow>
                      ) : (
                        filterConfiscations(returnedConfiscations).map((confiscation) => (
                          <TableRow key={confiscation.id}>
                            <TableCell className="font-medium">{confiscation.studentName}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{confiscation.className}</Badge>
                            </TableCell>
                            <TableCell>{confiscation.lockerNumber}</TableCell>
                            <TableCell>{formatDate(confiscation.startDate)}</TableCell>
                            <TableCell>{confiscation.returnedAt ? formatDate(confiscation.returnedAt) : '-'}</TableCell>
                            {isAdmin && (
                              <TableCell className="text-right">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="gap-1"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      Hapus
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Hapus Riwayat Sita</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Apakah Anda yakin ingin menghapus riwayat sita laptop {confiscation.studentName}?
                                        <br />
                                        <strong>Tindakan ini tidak dapat dibatalkan.</strong>
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Batal</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(confiscation.id, confiscation.studentName)}
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
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cancelled">
            <Card>
              <CardHeader>
                <CardTitle>Sita Dibatalkan</CardTitle>
                <CardDescription>
                  Riwayat sita yang dibatalkan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Siswa</TableHead>
                        <TableHead>Kelas</TableHead>
                        <TableHead>Loker</TableHead>
                        <TableHead>Alasan Sita</TableHead>
                        <TableHead>Tanggal Sita</TableHead>
                        {isAdmin && <TableHead className="text-right">Aksi</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterConfiscations(cancelledConfiscations).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={isAdmin ? 6 : 5} className="h-24 text-center text-muted-foreground">
                            Belum ada sita yang dibatalkan
                          </TableCell>
                        </TableRow>
                      ) : (
                        filterConfiscations(cancelledConfiscations).map((confiscation) => (
                          <TableRow key={confiscation.id}>
                            <TableCell className="font-medium">{confiscation.studentName}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{confiscation.className}</Badge>
                            </TableCell>
                            <TableCell>{confiscation.lockerNumber}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{confiscation.reason}</TableCell>
                            <TableCell>{formatDate(confiscation.startDate)}</TableCell>
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
                                      <AlertDialogTitle>Hapus Riwayat Sita</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Apakah Anda yakin ingin menghapus riwayat sita laptop {confiscation.studentName}?
                                        <br />
                                        <strong>Tindakan ini tidak dapat dibatalkan.</strong>
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Batal</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(confiscation.id, confiscation.studentName)}
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
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
