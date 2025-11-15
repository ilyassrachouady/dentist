import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Patient } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Search, Phone, Mail, Calendar, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';

export default function PatientsPage() {
  const { dentist } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPatients();
  }, [dentist]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = patients.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.phone.includes(searchQuery) ||
          p.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  }, [searchQuery, patients]);

  const loadPatients = async () => {
    if (!dentist) return;
    try {
      const data = await api.getPatients(dentist.id);
      setPatients(data);
      setFilteredPatients(data);
    } catch (error) {
      toast.error('Erreur lors du chargement des patients');
    } finally {
      setIsLoading(false);
    }
  };

  const getNextAppointment = (patient: Patient) => {
    const upcoming = patient.appointments
      .filter(apt => new Date(apt.date) >= new Date() && apt.status !== 'cancelled')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return upcoming[0];
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-600 mt-1">
            Gérez vos patients et leurs dossiers
          </p>
        </div>
      </div>

      <Card className="shadow-sm border-0">
        <CardHeader>
          <CardTitle>Liste des patients</CardTitle>
          <CardDescription>
            Recherchez et gérez vos patients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom, téléphone ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Chargement...</div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? 'Aucun patient trouvé' : 'Aucun patient enregistré'}
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Prochain RDV</TableHead>
                    <TableHead>Total RDV</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient) => {
                    const nextApt = getNextAppointment(patient);
                    return (
                      <TableRow key={patient.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage />
                              <AvatarFallback>
                                {patient.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-gray-900">{patient.name}</div>
                              {patient.dateOfBirth && (
                                <div className="text-sm text-gray-500">
                                  {format(patient.dateOfBirth, 'dd/MM/yyyy', { locale: fr })}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <span>{patient.phone}</span>
                            </div>
                            {patient.email && (
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Mail className="h-3 w-3" />
                                <span>{patient.email}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {patient.tags?.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs rounded-full">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {nextApt ? (
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span>
                                {format(new Date(nextApt.date), 'dd/MM/yyyy', { locale: fr })} à {nextApt.time}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Aucun</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{patient.appointments.length}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/dashboard/patients/${patient.id}`)}
                            className="rounded-xl"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Voir
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

