import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dentist } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Building2,
  Clock,
  Bell,
  Link as LinkIcon,
  Save,
  Copy,
} from 'lucide-react';

const days = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' },
];

export default function SettingsPage() {
  const { dentist } = useAuth();
  const [formData, setFormData] = useState<Partial<Dentist>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [bookingUrl, setBookingUrl] = useState('');

  useEffect(() => {
    if (dentist) {
      setFormData(dentist);
      setBookingUrl(`${window.location.origin}/dentist/${dentist.bookingPageId}`);
    }
  }, [dentist]);

  const handleSave = async () => {
    setIsSaving(true);
    // In real app, save to API
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Paramètres sauvegardés');
    }, 500);
  };

  const handleWorkingHoursChange = (day: string, field: 'start' | 'end' | 'enabled', value: any) => {
    if (!formData.workingHours) return;
    setFormData({
      ...formData,
      workingHours: {
        ...formData.workingHours,
        [day]: {
          ...formData.workingHours[day as keyof typeof formData.workingHours],
          [field]: value,
        },
      },
    });
  };

  const copyBookingLink = () => {
    navigator.clipboard.writeText(bookingUrl);
    toast.success('Lien copié dans le presse-papiers');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-600 mt-1">
          Gérez les paramètres de votre cabinet
        </p>
      </div>

      <Tabs defaultValue="clinic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 rounded-xl">
          <TabsTrigger value="clinic" className="rounded-xl">Cabinet</TabsTrigger>
          <TabsTrigger value="hours" className="rounded-xl">Horaires</TabsTrigger>
          <TabsTrigger value="booking" className="rounded-xl">Réservation</TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-xl">Notifications</TabsTrigger>
        </TabsList>

        {/* Clinic Info */}
        <TabsContent value="clinic" className="space-y-6">
          <Card className="shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informations du cabinet
              </CardTitle>
              <CardDescription>
                Informations publiques affichées sur votre page de réservation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom complet</Label>
                  <Input
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Spécialité</Label>
                  <Input
                    value={formData.specialty || ''}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Adresse</Label>
                <Input
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ville</Label>
                  <Input
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.bio || ''}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="rounded-xl"
                  rows={4}
                />
              </div>

              <Button onClick={handleSave} className="rounded-xl bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Sauvegarde...' : 'Enregistrer'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Working Hours */}
        <TabsContent value="hours" className="space-y-6">
          <Card className="shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Horaires de travail
              </CardTitle>
              <CardDescription>
                Définissez vos horaires d'ouverture pour chaque jour de la semaine
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {days.map((day) => {
                const hours = formData.workingHours?.[day.key as keyof typeof formData.workingHours];
                return (
                  <div key={day.key} className="flex items-center gap-4 p-4 border rounded-xl">
                    <div className="w-24">
                      <Label className="font-medium">{day.label}</Label>
                    </div>
                    <Switch
                      checked={hours?.enabled || false}
                      onCheckedChange={(checked) =>
                        handleWorkingHoursChange(day.key, 'enabled', checked)
                      }
                    />
                    {hours?.enabled && (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="time"
                          value={hours.start || ''}
                          onChange={(e) =>
                            handleWorkingHoursChange(day.key, 'start', e.target.value)
                          }
                          className="w-32 rounded-xl"
                        />
                        <span className="text-gray-500">-</span>
                        <Input
                          type="time"
                          value={hours.end || ''}
                          onChange={(e) =>
                            handleWorkingHoursChange(day.key, 'end', e.target.value)
                          }
                          className="w-32 rounded-xl"
                        />
                      </div>
                    )}
                    {!hours?.enabled && (
                      <span className="text-sm text-gray-400">Fermé</span>
                    )}
                  </div>
                );
              })}

              <Button onClick={handleSave} className="rounded-xl bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Sauvegarde...' : 'Enregistrer'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Booking Page */}
        <TabsContent value="booking" className="space-y-6">
          <Card className="shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Page de réservation
              </CardTitle>
              <CardDescription>
                Partagez ce lien avec vos patients pour qu'ils puissent réserver en ligne
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Lien de réservation</Label>
                <div className="flex gap-2">
                  <Input
                    value={bookingUrl}
                    readOnly
                    className="rounded-xl"
                  />
                  <Button
                    variant="outline"
                    onClick={copyBookingLink}
                    className="rounded-xl"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Les patients peuvent utiliser ce lien pour réserver un rendez-vous
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Configurez vos préférences de notification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-xl">
                <div>
                  <Label className="font-medium">Nouveaux rendez-vous</Label>
                  <p className="text-sm text-gray-500">
                    Recevoir une notification pour chaque nouvelle réservation
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-xl">
                <div>
                  <Label className="font-medium">Rappels de rendez-vous</Label>
                  <p className="text-sm text-gray-500">
                    Recevoir des rappels la veille des rendez-vous
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-xl">
                <div>
                  <Label className="font-medium">Annulations</Label>
                  <p className="text-sm text-gray-500">
                    Être notifié lorsqu'un patient annule
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Button onClick={handleSave} className="rounded-xl bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Sauvegarde...' : 'Enregistrer'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

