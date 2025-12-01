import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Sparkles, Flame, Trophy, Target, LogOut, Menu, Award } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const Dashboard = () => {
  const { user, token, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [spells, setSpells] = useState([]);
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [spellsRes, statsRes, leaderboardRes] = await Promise.all([
        axios.get(`${API_URL}/spells`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/user/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/leaderboard?limit=5`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      setSpells(spellsRes.data);
      setStats(statsRes.data);
      setLeaderboard(leaderboardRes.data);
    } catch (error) {
      console.error('Veri yüklenemedi:', error);
      toast.error('Veri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const completeSpell = async (spellId) => {
    try {
      const response = await axios.post(
        `${API_URL}/spells/${spellId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const { xpGained, newLevel, leveledUp, newStreak } = response.data;
      
      if (leveledUp) {
        toast.success(`🎉 Tebrikler! Seviye ${newLevel}'e ulaştınız!`, {
          duration: 5000,
        });
      } else {
        toast.success(`✨ +${xpGained} XP kazandınız!`, {
          description: `Streak: ${newStreak} gün`,
        });
      }
      
      await refreshUser();
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Büyü tamamlanamadı');
    }
  };

  const getTodayActiveSpells = () => {
    const today = new Date().toISOString().split('T')[0];
    return spells.filter(spell => !spell.completedDates.includes(today));
  };

  const xpForCurrentLevel = (user?.level - 1) * 100;
  const xpForNextLevel = user?.level * 100;
  const xpProgress = ((user?.xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-violet-400 text-xl font-cinzel">Yükleniyor...</div>
      </div>
    );
  }

  const activeSpells = getTodayActiveSpells();

  return (
    <div className="min-h-screen mystic-bg">
      {/* Header */}
      <header className="glass-card border-b border-violet-500/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-8 h-8 text-violet-400" />
              <h1 className="text-2xl font-cinzel font-bold tracking-wider uppercase" style={{
                background: 'linear-gradient(to bottom, #fcd34d, #fbbf24, #d97706)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Akademik Büyücü
              </h1>
            </div>
            
            <nav className="hidden md:flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/')} data-testid="nav-dashboard">Dashboard</Button>
              <Button variant="ghost" onClick={() => navigate('/spells')} data-testid="nav-spells">Büyüler</Button>
              <Button variant="ghost" onClick={() => navigate('/talismans')} data-testid="nav-talismans">Tılsımlar</Button>
              <Button variant="ghost" onClick={() => navigate('/leaderboard')} data-testid="nav-leaderboard">Liderlik</Button>
              <Button variant="ghost" onClick={() => navigate('/statistics')} data-testid="nav-statistics">İstatistikler</Button>
              <Button variant="ghost" onClick={logout} data-testid="logout-button"><LogOut className="w-4 h-4" /></Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* User Level & XP */}
        <Card className="glass-card border-violet-500/20 mb-8" data-testid="user-level-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-3xl font-cinzel font-bold text-slate-100">{user?.username}</h2>
                <p className="text-slate-400 font-manrope">Büyücü</p>
              </div>
              <div className="text-center">
                <div className="level-badge text-slate-950 px-6 py-3 rounded-lg text-3xl font-cinzel font-bold">
                  SEVİYE {user?.level}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-manrope">
                <span className="text-slate-400">XP</span>
                <span className="text-violet-400 font-semibold">{user?.xp} / {xpForNextLevel}</span>
              </div>
              <Progress value={xpProgress} className="h-3" data-testid="xp-progress-bar" />
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <Flame className="w-6 h-6 mx-auto mb-1 text-orange-400" />
                <p className="text-2xl font-bold text-slate-100">{user?.currentStreak}</p>
                <p className="text-xs text-slate-400 font-manrope">Günlük Streak</p>
              </div>
              <div className="text-center">
                <Target className="w-6 h-6 mx-auto mb-1 text-cyan-400" />
                <p className="text-2xl font-bold text-slate-100">{user?.totalSpellsCompleted}</p>
                <p className="text-xs text-slate-400 font-manrope">Tamamlanan</p>
              </div>
              <div className="text-center">
                <Award className="w-6 h-6 mx-auto mb-1 text-yellow-400" />
                <p className="text-2xl font-bold text-slate-100">{stats?.unlockedTalismans || 0}</p>
                <p className="text-xs text-slate-400 font-manrope">Tılsımlar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Active Spells */}
          <div className="lg:col-span-2">
            <Card className="glass-card border-violet-500/20" data-testid="active-spells-card">
              <CardHeader>
                <CardTitle className="text-2xl font-cinzel">Bugünün Büyüleri</CardTitle>
              </CardHeader>
              <CardContent>
                {activeSpells.length === 0 ? (
                  <div className="text-center py-12">
                    <Sparkles className="w-16 h-16 mx-auto mb-4 text-violet-400 opacity-50" />
                    <p className="text-slate-400 font-manrope">Bugün için tüm büyüler tamamlandı! 🎉</p>
                    <Button
                      onClick={() => navigate('/spells')}
                      className="mt-4 bg-violet-600 hover:bg-violet-500"
                      data-testid="add-spell-button"
                    >
                      Yeni Büyü Ekle
                    </Button>
                  </div>
                ) : (
                  <AnimatePresence>
                    <div className="space-y-4">
                      {activeSpells.map((spell) => (
                        <motion.div
                          key={spell.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="spell-card glass-card p-4 border border-slate-800 hover:border-violet-500/30"
                          data-testid={`spell-card-${spell.id}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-cinzel font-semibold text-slate-100 mb-1">
                                {spell.title}
                              </h3>
                              <p className="text-sm text-slate-400 mb-2 font-manrope">{spell.description}</p>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs px-2 py-1 bg-violet-500/20 text-violet-300 rounded font-manrope">
                                  {spell.repeatType}
                                </span>
                                <span className="text-xs text-cyan-400 font-manrope">+{spell.xpReward} XP</span>
                              </div>
                            </div>
                            <Button
                              onClick={() => completeSpell(spell.id)}
                              className="bg-violet-600 hover:bg-violet-500 glow-violet"
                              data-testid={`complete-spell-button-${spell.id}`}
                            >
                              Tamamla
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </AnimatePresence>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard */}
          <div>
            <Card className="glass-card border-violet-500/20" data-testid="leaderboard-card">
              <CardHeader>
                <CardTitle className="text-2xl font-cinzel flex items-center">
                  <Trophy className="w-6 h-6 mr-2 text-yellow-400" />
                  Liderler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaderboard.map((entry, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg border border-slate-800"
                      data-testid={`leaderboard-entry-${index}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                          index === 1 ? 'bg-slate-400/20 text-slate-400' :
                          index === 2 ? 'bg-orange-500/20 text-orange-400' :
                          'bg-slate-700/20 text-slate-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-100 font-manrope">{entry.username}</p>
                          <p className="text-xs text-slate-500 font-manrope">Seviye {entry.level}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-violet-400">{entry.xp} XP</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => navigate('/leaderboard')}
                  variant="ghost"
                  className="w-full mt-4 text-violet-400 hover:text-violet-300"
                  data-testid="view-full-leaderboard"
                >
                  Tümünü Gör
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;