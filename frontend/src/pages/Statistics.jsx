import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Target, Flame, Award, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const Statistics = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [spells, setSpells] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [statsRes, spellsRes] = await Promise.all([
        axios.get(`${API_URL}/user/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/spells`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      setStats(statsRes.data);
      setSpells(spellsRes.data);
    } catch (error) {
      console.error('İstatistikler yüklenemedi:', error);
      toast.error('İstatistikler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getSpellTypeData = () => {
    const daily = spells.filter(s => s.repeatType === 'DAILY').length;
    const weekly = spells.filter(s => s.repeatType === 'WEEKLY').length;
    
    return [
      { name: 'Günlük', value: daily },
      { name: 'Haftalık', value: weekly }
    ];
  };

  const getXPData = () => {
    // Simulated XP progression data
    const levels = [];
    for (let i = 1; i <= user?.level; i++) {
      levels.push({
        level: `Lv ${i}`,
        xp: i * 100
      });
    }
    return levels;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-violet-400 text-xl font-cinzel">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mystic-bg">
      <header className="glass-card border-b border-violet-500/20 mb-8">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/')} data-testid="back-button">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri
            </Button>
            <h1 className="text-3xl font-cinzel font-bold tracking-wider" style={{
              background: 'linear-gradient(to bottom, #fcd34d, #fbbf24, #d97706)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              İstatistikler
            </h1>
            <div className="w-24" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pb-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card border-violet-500/20" data-testid="stat-xp">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 font-manrope">Toplam XP</p>
                  <p className="text-3xl font-bold text-violet-400 font-cinzel">{stats?.xp || 0}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-violet-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-violet-500/20" data-testid="stat-completed">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 font-manrope">Tamamlanan</p>
                  <p className="text-3xl font-bold text-cyan-400 font-cinzel">{stats?.totalSpellsCompleted || 0}</p>
                </div>
                <Target className="w-10 h-10 text-cyan-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-violet-500/20" data-testid="stat-streak">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 font-manrope">En Yüksek Streak</p>
                  <p className="text-3xl font-bold text-orange-400 font-cinzel">{stats?.maxStreak || 0}</p>
                </div>
                <Flame className="w-10 h-10 text-orange-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-violet-500/20" data-testid="stat-talismans">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 font-manrope">Tılsımlar</p>
                  <p className="text-3xl font-bold text-yellow-400 font-cinzel">{stats?.unlockedTalismans || 0}</p>
                </div>
                <Award className="w-10 h-10 text-yellow-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="glass-card border-violet-500/20" data-testid="xp-progression-chart">
            <CardHeader>
              <CardTitle className="font-cinzel">XP Gelişimi</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getXPData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="level" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #475569',
                      borderRadius: '8px'
                    }}
                  />
                  <Line type="monotone" dataKey="xp" stroke="#7c3aed" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass-card border-violet-500/20" data-testid="spell-types-chart">
            <CardHeader>
              <CardTitle className="font-cinzel">Büyü Tipleri</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getSpellTypeData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #475569',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" fill="#7c3aed" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Spell List */}
        <Card className="glass-card border-violet-500/20 mt-8" data-testid="spell-completion-list">
          <CardHeader>
            <CardTitle className="font-cinzel">Büyü Tamamlanma Geçmişi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {spells.map((spell) => (
                <div
                  key={spell.id}
                  className="flex items-center justify-between p-4 bg-slate-900/30 rounded-lg border border-slate-800"
                  data-testid={`spell-history-${spell.id}`}
                >
                  <div>
                    <p className="font-semibold text-slate-100 font-cinzel">{spell.title}</p>
                    <p className="text-sm text-slate-400 font-manrope">{spell.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-violet-400">{spell.completedDates.length}</p>
                    <p className="text-xs text-slate-500 font-manrope">Tamamlama</p>
                  </div>
                </div>
              ))}
            </div>

            {spells.length === 0 && (
              <div className="text-center py-8">
                <Target className="w-16 h-16 mx-auto mb-4 text-violet-400 opacity-50" />
                <p className="text-slate-400 font-manrope">Henüz büyü eklenmemiş</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Statistics;