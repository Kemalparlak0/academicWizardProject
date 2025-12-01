import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Trophy, Medal, ArrowLeft, Crown } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const Leaderboard = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const response = await axios.get(`${API_URL}/leaderboard?limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Liderlik tablosu yüklenemedi:', error);
      toast.error('Liderlik tablosu yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index) => {
    if (index === 0) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (index === 1) return <Medal className="w-6 h-6 text-slate-400" />;
    if (index === 2) return <Medal className="w-6 h-6 text-orange-400" />;
    return null;
  };

  const getRankBgColor = (index) => {
    if (index === 0) return 'bg-yellow-500/10 border-yellow-500/30';
    if (index === 1) return 'bg-slate-500/10 border-slate-500/30';
    if (index === 2) return 'bg-orange-500/10 border-orange-500/30';
    return 'bg-slate-900/30 border-slate-800';
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
            <h1 className="text-3xl font-cinzel font-bold tracking-wider flex items-center" style={{
              background: 'linear-gradient(to bottom, #fcd34d, #fbbf24, #d97706)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              <Trophy className="w-8 h-8 mr-3 text-yellow-400" />
              Liderlik Tablosu
            </h1>
            <div className="w-24" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pb-8 max-w-3xl">
        <Card className="glass-card border-violet-500/20">
          <CardHeader>
            <CardTitle className="font-cinzel text-2xl">En İyi Büyücüler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                    getRankBgColor(index)
                  } ${
                    entry.username === user?.username ? 'ring-2 ring-violet-500' : ''
                  }`}
                  data-testid={`leaderboard-entry-${index}`}
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 text-center">
                      {index < 3 ? (
                        getRankIcon(index)
                      ) : (
                        <div className="text-2xl font-bold text-slate-500 font-cinzel">
                          {index + 1}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold text-lg text-slate-100 font-cinzel">
                          {entry.username}
                        </p>
                        {entry.username === user?.username && (
                          <span className="text-xs px-2 py-1 bg-violet-500/20 text-violet-300 rounded font-manrope">
                            Siz
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 font-manrope">Seviye {entry.level}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-2xl font-bold text-violet-400 font-cinzel">{entry.xp}</p>
                    <p className="text-xs text-slate-500 font-manrope">XP</p>
                  </div>
                </div>
              ))}
            </div>

            {leaderboard.length === 0 && (
              <div className="text-center py-12">
                <Trophy className="w-20 h-20 mx-auto mb-4 text-violet-400 opacity-50" />
                <p className="text-slate-400 text-lg font-manrope">Henüz liderlik tablosu yok</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Leaderboard;