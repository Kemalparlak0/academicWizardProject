import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        toast.success('Hoş geldiniz!');
      } else {
        await register(username, email, password);
        toast.success('Hesabınız oluşturuldu!');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 mystic-bg">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <Sparkles className="w-10 h-10 text-violet-400" />
            <h1 className="text-5xl font-cinzel font-bold tracking-wider uppercase" style={{
              background: 'linear-gradient(to bottom, #fcd34d, #fbbf24, #d97706)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Akademik Büyücü
            </h1>
          </div>
          <p className="text-slate-400 text-lg font-manrope">
            Alışkanlıklarını büyüye dönüştür
          </p>
        </div>

        <Card className="glass-card border-violet-500/20" data-testid="auth-card">
          <CardHeader>
            <CardTitle className="text-2xl font-cinzel text-center">
              {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
            </CardTitle>
            <CardDescription className="text-center text-slate-400">
              {isLogin ? 'Büyücü hesabınıza giriş yapın' : 'Yeni bir büyücü hesabı oluşturun'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-slate-300 font-manrope">
                    Kullanıcı Adı
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required={!isLogin}
                    className="bg-slate-900/50 border-slate-800 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 text-slate-100"
                    data-testid="username-input"
                    placeholder="Büyücü adınızı girin"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300 font-manrope">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-slate-900/50 border-slate-800 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 text-slate-100"
                  data-testid="email-input"
                  placeholder="email@example.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300 font-manrope">
                  Şifre
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-900/50 border-slate-800 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 text-slate-100"
                  data-testid="password-input"
                  placeholder="••••••••"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white font-cinzel tracking-wider glow-violet border border-violet-400/20"
                data-testid="auth-submit-button"
              >
                {loading ? 'Yükleniyor...' : (isLogin ? 'Giriş Yap' : 'Kayıt Ol')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-violet-400 hover:text-violet-300 font-manrope text-sm transition-colors"
                data-testid="toggle-auth-mode"
              >
                {isLogin ? 'Hesabınız yok mu? Kayıt olun' : 'Zaten hesabınız var mı? Giriş yapın'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;