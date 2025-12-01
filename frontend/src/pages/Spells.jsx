import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Sparkles, Plus, Trash2, Edit, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const Spells = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [spells, setSpells] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    repeatType: 'DAILY',
    xpReward: 10
  });

  useEffect(() => {
    loadSpells();
  }, []);

  const loadSpells = async () => {
    try {
      const response = await axios.get(`${API_URL}/spells`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSpells(response.data);
    } catch (error) {
      console.error('Büyüler yüklenemedi:', error);
      toast.error('Büyüler yüklenirken bir hata oluştu');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/spells`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Büyü oluşturuldu!');
      setIsDialogOpen(false);
      setFormData({ title: '', description: '', repeatType: 'DAILY', xpReward: 10 });
      loadSpells();
    } catch (error) {
      toast.error('Büyü oluşturulamadı');
    }
  };

  const handleDelete = async (spellId) => {
    if (!window.confirm('Bu büyüyü silmek istediğinizden emin misiniz?')) return;
    
    try {
      await axios.delete(`${API_URL}/spells/${spellId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Büyü silindi');
      loadSpells();
    } catch (error) {
      toast.error('Büyü silinemedi');
    }
  };

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
              Büyüler
            </h1>
            <div className="w-24" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pb-8">
        <div className="flex justify-between items-center mb-6">
          <p className="text-slate-400 font-manrope">Tüm büyülerinizi buradan yönetin</p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-violet-600 hover:bg-violet-500 glow-violet" data-testid="create-spell-button">
                <Plus className="w-4 h-4 mr-2" />
                Yeni Büyü
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-950 border-violet-500/20" data-testid="create-spell-dialog">
              <DialogHeader>
                <DialogTitle className="font-cinzel text-2xl">Yeni Büyü Oluştur</DialogTitle>
                <DialogDescription className="text-slate-400">Yeni bir alışkanlık büyüsü ekleyin</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Başlık</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="bg-slate-900/50 border-slate-800"
                    data-testid="spell-title-input"
                    placeholder="Örn: Sabah Meditasyonu"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Açıklama</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    className="bg-slate-900/50 border-slate-800"
                    data-testid="spell-description-input"
                    placeholder="Büyü hakkında detaylar"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="repeatType">Tekrar Tipi</Label>
                    <Select
                      value={formData.repeatType}
                      onValueChange={(value) => setFormData({ ...formData, repeatType: value })}
                    >
                      <SelectTrigger className="bg-slate-900/50 border-slate-800" data-testid="repeat-type-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DAILY">Günlük</SelectItem>
                        <SelectItem value="WEEKLY">Haftalık</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="xpReward">XP Ödülü</Label>
                    <Input
                      id="xpReward"
                      type="number"
                      value={formData.xpReward}
                      onChange={(e) => setFormData({ ...formData, xpReward: parseInt(e.target.value) })}
                      required
                      min="1"
                      className="bg-slate-900/50 border-slate-800"
                      data-testid="xp-reward-input"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-500" data-testid="submit-spell-button">
                  Oluştur
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {spells.map((spell) => (
            <Card key={spell.id} className="glass-card border-violet-500/20" data-testid={`spell-item-${spell.id}`}>
              <CardHeader>
                <CardTitle className="font-cinzel flex items-center justify-between">
                  <span>{spell.title}</span>
                  <Sparkles className="w-5 h-5 text-violet-400" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-400 mb-4 font-manrope">{spell.description}</p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs px-2 py-1 bg-violet-500/20 text-violet-300 rounded font-manrope">
                    {spell.repeatType}
                  </span>
                  <span className="text-sm text-cyan-400 font-bold">+{spell.xpReward} XP</span>
                </div>
                <div className="text-xs text-slate-500 font-manrope mb-4">
                  Tamamlanma: {spell.completedDates.length} kez
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(spell.id)}
                  className="w-full"
                  data-testid={`delete-spell-button-${spell.id}`}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Sil
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {spells.length === 0 && (
          <div className="text-center py-16">
            <Sparkles className="w-20 h-20 mx-auto mb-4 text-violet-400 opacity-50" />
            <p className="text-slate-400 text-lg font-manrope mb-4">Henüz büyünüz yok</p>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-violet-600 hover:bg-violet-500 glow-violet"
              data-testid="empty-state-create-button"
            >
              İlk Büyünüzü Oluşturun
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Spells;