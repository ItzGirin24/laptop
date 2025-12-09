import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, UserPlus, ArrowLeft } from 'lucide-react';
import { CLASS_LIST, ClassName } from '@/types';
import { toast } from 'sonner';

export default function StudentRegistrationPage() {
  const { addStudent } = useData();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    studentNumber: '',
    className: '' as ClassName | '',
    lockerNumber: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.className) {
      toast.error('Pilih kelas terlebih dahulu');
      return;
    }

    setIsLoading(true);

    try {
      await addStudent({
        name: formData.name,
        studentNumber: parseInt(formData.studentNumber),
        className: formData.className as ClassName,
        lockerNumber: formData.lockerNumber,
        collectionStatus: 'not_collected',
      });

      toast.success('Pendaftaran berhasil! Data Anda telah disimpan.');
      setFormData({ name: '', studentNumber: '', className: '', lockerNumber: '' });
    } catch (error) {
      toast.error('Terjadi kesalahan saat mendaftar. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Button>

        {/* Registration Card */}
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <UserPlus className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Pendaftaran Siswa
            </CardTitle>
            <CardDescription className="text-base">
              Daftarkan diri Anda untuk sistem pendataan laptop
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Nama Lengkap
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Masukkan nama lengkap Anda"
                  required
                  className="h-12"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="studentNumber" className="text-sm font-medium">
                    Nomor Urut
                  </Label>
                  <Input
                    id="studentNumber"
                    type="number"
                    value={formData.studentNumber}
                    onChange={(e) => setFormData({ ...formData, studentNumber: e.target.value })}
                    placeholder="1"
                    required
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="className" className="text-sm font-medium">
                    Kelas
                  </Label>
                  <Select
                    value={formData.className}
                    onValueChange={(value) => setFormData({ ...formData, className: value as ClassName })}
                  >
                    <SelectTrigger className="h-12">
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
                <Label htmlFor="lockerNumber" className="text-sm font-medium">
                  Nomor Loker Laptop
                </Label>
                <Input
                  id="lockerNumber"
                  value={formData.lockerNumber}
                  onChange={(e) => setFormData({ ...formData, lockerNumber: e.target.value })}
                  placeholder="Contoh: L1-01"
                  required
                  className="h-12"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Mendaftarkan...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5" />
                    Daftar Sekarang
                  </>
                )}
              </Button>
            </form>

            {/* Info Section */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <GraduationCap className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Informasi Penting:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Pastikan nomor urut dan nomor loker benar</li>
                    <li>• Data akan diverifikasi oleh admin</li>
                    <li>• Status pengumpulan awal: Belum dikumpulkan</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
