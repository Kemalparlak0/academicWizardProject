import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Award, Lock, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const Talismans = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [allTalismans, setAllTalismans] = useState([]);
  const [userTalismans, setUserTalismans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTalismans();
  }, []);

  const loadTalismans = async () => {
    try {
      const [allRes, userRes] = await Promise.all([
        axios.get(`${API_URL}/talismans`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/user/talismans`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      setAllTalismans(allRes.data);
      setUserTalismans(userRes.data);
    } catch (error) {
      console.error('Tılsımlar yüklenemedi:', error);
      toast.error('Tılsımlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const isUnlocked = (talismanId) => {
    return userTalismans.some(ut => ut.id === talismanId);
  };

  const getConditionText = (condition) => {
    const conditions = {
      'FIRST_SPELL': 'İlk büyünü tamamla',
      'LEVEL_5': 'Seviye 5\'e ulaş',
      'LEVEL_10': 'Seviye 10\'a ulaş',
      'STREAK_7': '7 gün üst üste büyü tamamla',
      'STREAK_30': '30 gün üst üste büyü tamamla',
      'SPELLS_10': '10 büyü tamamla',
      'SPELLS_50': '50 büyü tamamla',
      'SPELLS_100': '100 büyü tamamla'
    };
    return conditions[condition] || condition;
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
              Tılsımlar
            </h1>
            <div className="w-24" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pb-8">
        <Tabs defaultValue="unlocked" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8 bg-slate-900/50" data-testid="talismans-tabs">
            <TabsTrigger value="unlocked" data-testid="unlocked-tab">Kazandıklarım ({userTalismans.length})</TabsTrigger>
            <TabsTrigger value="all" data-testid="all-tab">Tümü ({allTalismans.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="unlocked">
            {userTalismans.length === 0 ? (
              <div className="text-center py-16">
                <Award className="w-20 h-20 mx-auto mb-4 text-violet-400 opacity-50" />
                <p className="text-slate-400 text-lg font-manrope">Henüz tılsım kazanmadınız</p>
                <p className="text-slate-500 text-sm font-manrope mt-2">Büyüleri tamamlayarak tılsım kazanabilirsiniz</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {userTalismans.map((talisman) => (
                  <Card key={talisman.id} className="glass-card border-violet-500/30 glow-gold" data-testid={`unlocked-talisman-${talisman.id}`}>
                    <CardHeader>
                      <div className="flex items-center justify-center mb-4">
                        <img
                          src={talisman.iconUrl}
                          alt={talisman.name}
                          className="w-24 h-24 rounded-full object-cover border-4 border-yellow-500/50 glow-gold"
                        />
                      </div>
                      <CardTitle className="font-cinzel text-center text-yellow-400">{talisman.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-300 text-center mb-2 font-manrope">{talisman.description}</p>
                      <p className="text-xs text-center text-slate-500 font-manrope">
                        {new Date(talisman.unlockedAt).toLocaleDateString('tr-TR')}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {allTalismans.map((talisman) => {
                const unlocked = isUnlocked(talisman.id);
                return (
                  <Card
                    key={talisman.id}
                    className={`glass-card ${unlocked ? 'border-violet-500/30 glow-gold' : 'border-slate-800 opacity-60'}`}
                    data-testid={`talisman-${talisman.id}`}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-center mb-4 relative">
                        <img
                          src={talisman.iconUrl}
                          alt={talisman.name}
                          className={`w-24 h-24 rounded-full object-cover ${
                            unlocked ? 'border-4 border-yellow-500/50' : 'border-4 border-slate-700 grayscale'
                          }`}
                        />
                        {!unlocked && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Lock className="w-12 h-12 text-slate-600" />
                          </div>
                        )}
                      </div>
                      <CardTitle className={`font-cinzel text-center ${
                        unlocked ? 'text-yellow-400' : 'text-slate-500'
                      }`}>
                        {talisman.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className={`text-sm text-center mb-2 font-manrope ${
                        unlocked ? 'text-slate-300' : 'text-slate-500'
                      }`}>
                        {talisman.description}
                      </p>
                      <p className="text-xs text-center text-slate-500 font-manrope">
                        {getConditionText(talisman.condition)}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Talismans;