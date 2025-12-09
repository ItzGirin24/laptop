import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, Laptop, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        toast.success('Login berhasil!');
        navigate('/dashboard');
      } else {
        toast.error(result.error || 'Email atau password salah');
      }
    } catch {
      toast.error('Terjadi kesalahan saat login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 sidebar-gradient items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="mb-8 flex justify-center">
            <div className="h-24 w-24 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <GraduationCap className="h-14 w-14 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Sistem Pendataan Laptop
          </h1>
          <p className="text-lg text-white/80 mb-8">
            ABBSKP - Aplikasi Manajemen Pengumpulan Laptop Siswa
          </p>
          <div className="flex items-center justify-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <Laptop className="h-8 w-8 text-white" />
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold text-white">8</p>
              <p className="text-sm text-white/70">Kelas Aktif</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="h-16 w-16 rounded-xl bg-primary flex items-center justify-center mb-4">
              <GraduationCap className="h-9 w-9 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">ABBSKP</h1>
            <p className="text-sm text-muted-foreground">Sistem Pendataan Laptop</p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-8 shadow-lg">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground">Masuk</h2>
              <p className="text-muted-foreground mt-1">
                Masukkan kredensial untuk mengakses sistem
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@abbskp.sch.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Masuk'
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
