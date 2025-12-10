import { useState, useRef } from 'react';
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, Database, HardDrive } from 'lucide-react';
import { CLASS_LIST, ClassName, Student } from '@/types';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export default function ImportExportPage() {
  const { students, permissions, importStudents } = useData();
  const [importClass, setImportClass] = useState<string>('');
  const [importData, setImportData] = useState<any[]>([]);
  const [importError, setImportError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError('');
    setImportData([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          setImportError('File Excel kosong');
          return;
        }

        // Validate columns
        const firstRow = jsonData[0] as any;
        const requiredColumns = ['nama', 'no_urut', 'loker'];
        const missingColumns = requiredColumns.filter(
          (col) => !Object.keys(firstRow).some(
            (key) => key.toLowerCase().includes(col)
          )
        );

        if (missingColumns.length > 0) {
          setImportError(`Kolom tidak ditemukan: ${missingColumns.join(', ')}`);
          return;
        }

        setImportData(jsonData);
        toast.success(`${jsonData.length} data berhasil dibaca`);
      } catch (error) {
        setImportError('Gagal membaca file Excel');
        console.error(error);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = () => {
    if (!importClass) {
      toast.error('Pilih kelas terlebih dahulu');
      return;
    }

    if (importData.length === 0) {
      toast.error('Tidak ada data untuk diimport');
      return;
    }

    const studentsToImport = importData.map((row) => {
      // Try to find column names flexibly
      const findColumn = (keywords: string[]) => {
        const key = Object.keys(row).find((k) =>
          keywords.some((kw) => k.toLowerCase().includes(kw))
        );
        return key ? row[key] : '';
      };

      return {
        name: String(findColumn(['nama', 'name', 'siswa'])),
        studentNumber: parseInt(findColumn(['no_urut', 'no', 'urut', 'number', 'absen'])) || 0,
        className: importClass as ClassName,
        lockerNumber: String(findColumn(['loker', 'locker', 'tempat'])),
        collectionStatus: 'not_collected' as const,
      };
    });

    importStudents(studentsToImport);
    toast.success(`${studentsToImport.length} siswa berhasil diimport`);
    setImportData([]);
    setImportClass('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExportStudents = () => {
    const exportData = students.map((s, index) => ({
      No: index + 1,
      Nama: s.name,
      'No Urut': s.studentNumber,
      Kelas: s.className,
      Loker: s.lockerNumber,
      Status: s.collectionStatus === 'collected' ? 'Sudah Mengumpul' : 'Belum Mengumpul',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Siswa');

    // Auto-fit columns
    const colWidths = [
      { wch: 5 },
      { wch: 30 },
      { wch: 10 },
      { wch: 10 },
      { wch: 15 },
      { wch: 20 },
    ];
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, `Data_Siswa_ABBSKP_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Data siswa berhasil diexport');
  };

  const handleExportPermissions = () => {
    const exportData = permissions.map((p, index) => ({
      No: index + 1,
      Nama: p.studentName,
      Kelas: p.className,
      Tanggal: new Date(p.date).toLocaleDateString('id-ID'),
      'Waktu Mulai': p.startTime,
      'Waktu Selesai': p.endTime,
      Keterangan: p.reason,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Izin');

    const colWidths = [
      { wch: 5 },
      { wch: 30 },
      { wch: 10 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 40 },
    ];
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, `Data_Izin_ABBSKP_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Data izin berhasil diexport');
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      { nama: 'Contoh Nama Siswa', no_urut: 1, loker: 'L1-01' },
      { nama: 'Nama Siswa Lain', no_urut: 2, loker: 'L1-02' },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

    const colWidths = [{ wch: 30 }, { wch: 10 }, { wch: 15 }];
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, 'Template_Import_Siswa.xlsx');
    toast.success('Template berhasil diunduh');
  };

  const handleBackupData = () => {
    const backupData = {
      students: students.map(s => ({
        id: s.id,
        name: s.name,
        studentNumber: s.studentNumber,
        className: s.className,
        lockerNumber: s.lockerNumber,
        collectionStatus: s.collectionStatus,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      })),
      permissions: permissions.map(p => ({
        id: p.id,
        studentId: p.studentId,
        studentName: p.studentName,
        className: p.className,
        date: p.date.toISOString(),
        startTime: p.startTime,
        endTime: p.endTime,
        reason: p.reason,
        createdAt: p.createdAt.toISOString(),
      })),
      backupDate: new Date().toISOString(),
      version: '1.0',
    };

    const worksheet = XLSX.utils.json_to_sheet([backupData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Backup');

    XLSX.writeFile(workbook, `Backup_ABBSKP_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Backup data berhasil dibuat');
  };

  const handleExportAllStudents = () => {
    const exportData = students.map((s, index) => ({
      No: index + 1,
      Nama: s.name,
      'No Urut': s.studentNumber,
      Kelas: s.className,
      Loker: s.lockerNumber,
      Status: s.collectionStatus === 'collected' ? 'Sudah Mengumpul' : 'Belum Mengumpul',
      'Tanggal Dibuat': s.createdAt.toLocaleDateString('id-ID'),
      'Terakhir Update': s.updatedAt.toLocaleDateString('id-ID'),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Semua Siswa');

    // Auto-fit columns
    const colWidths = [
      { wch: 5 },
      { wch: 30 },
      { wch: 10 },
      { wch: 10 },
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
    ];
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, `Export_Semua_Siswa_ABBSKP_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Export semua siswa berhasil');
  };

  const handleImportAllStudents = () => {
    if (importData.length === 0) {
      toast.error('Tidak ada data untuk diimport');
      return;
    }

    // Validate and deduplicate data
    const processedData: Student[] = [];
    const seen = new Set<string>();

    for (const row of importData) {
      const findColumn = (keywords: string[]) => {
        const key = Object.keys(row).find((k) =>
          keywords.some((kw) => k.toLowerCase().includes(kw))
        );
        return key ? row[key] : '';
      };

      const name = String(findColumn(['nama', 'name', 'siswa'])).trim();
      const className = String(findColumn(['kelas', 'class'])).trim().toUpperCase();
      const studentNumber = parseInt(findColumn(['no_urut', 'no', 'urut', 'number', 'absen'])) || 0;

      // Skip invalid data
      if (!name || !className || studentNumber <= 0) continue;

      // Create unique key for deduplication
      const uniqueKey = `${name.toLowerCase()}_${className}_${studentNumber}`;

      if (!seen.has(uniqueKey)) {
        seen.add(uniqueKey);
        processedData.push({
          id: '', // Will be generated by Firestore
          name,
          studentNumber,
          className: className as ClassName,
          lockerNumber: String(findColumn(['loker', 'locker', 'tempat'])),
          collectionStatus: 'not_collected',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    if (processedData.length === 0) {
      toast.error('Tidak ada data valid untuk diimport');
      return;
    }

    importStudents(processedData);
    toast.success(`${processedData.length} siswa berhasil diimport (duplikat dihapus otomatis)`);
    setImportData([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Import, Export & Backup</h1>
          <p className="text-muted-foreground mt-1">Kelola data siswa, backup lengkap, dan transfer massal antar kelas</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Import Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Import Data Siswa
              </CardTitle>
              <CardDescription>
                Upload file Excel untuk menambahkan data siswa secara massal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Kelas Tujuan</Label>
                <Select value={importClass} onValueChange={setImportClass}>
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
                <Label>File Excel</Label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">
                  Format: nama, no_urut, loker
                </p>
              </div>

              {importError && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {importError}
                </div>
              )}

              {importData.length > 0 && (
                <div className="flex items-center gap-2 p-3 bg-success/10 text-success rounded-lg text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  {importData.length} data siap diimport
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleDownloadTemplate}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Download Template
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={handleImport}
                  disabled={importData.length === 0 || !importClass}
                >
                  <Upload className="h-4 w-4" />
                  Import per Kelas
                </Button>
              </div>

              {/* Import All Students Section */}
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3">Import Semua Siswa (XA - XIIC)</h4>
                <div className="space-y-2 mb-3">
                  <Label>File Excel Semua Siswa</Label>
                  <Input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: nama, kelas, no_urut, loker (duplikat otomatis dihapus)
                  </p>
                </div>

                {importData.length > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-success/10 text-success rounded-lg text-sm mb-3">
                    <CheckCircle2 className="h-4 w-4" />
                    {importData.length} data siap diimport (duplikat akan dihapus otomatis)
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleImportAllStudents}
                  disabled={importData.length === 0}
                >
                  <Database className="h-4 w-4" />
                  Import Semua Siswa
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Export Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                Export Data
              </CardTitle>
              <CardDescription>
                Download data siswa dan izin dalam format Excel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Data Siswa</p>
                    <p className="text-sm text-muted-foreground">{students.length} siswa</p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2" onClick={handleExportStudents}>
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Data Izin</p>
                    <p className="text-sm text-muted-foreground">{permissions.length} izin</p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2" onClick={handleExportPermissions}>
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>

              <div className="p-4 border border-border rounded-lg">
                <h4 className="font-medium mb-2">Informasi Export</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• File akan diunduh dalam format .xlsx</li>
                  <li>• Data termasuk semua kelas dan status</li>
                  <li>• Nama file berisi tanggal export</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
