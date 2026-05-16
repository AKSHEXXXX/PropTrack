'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Plus, Trash2, Edit, Search } from 'lucide-react';
import { apiCall, fetcher } from '@/lib/api';
import { Appointment } from '@/lib/types';
import { formatDate, getStatusColor } from '@/lib/format';

export default function AppointmentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    leadId: '',
    propertyId: '',
    agentId: '',
    appointmentDate: '',
    appointmentTime: '',
    status: 'scheduled',
    notes: '',
  });

  const { data: appointments, mutate: mutateAppointments, isLoading, error } = useSWR<Appointment[]>(
    '/api/appointments',
    fetcher
  );
  const { data: leads } = useSWR('/api/leads', fetcher);
  const { data: properties } = useSWR('/api/properties', fetcher);
  const { data: agents } = useSWR('/api/agents', fetcher);

  const filteredAppointments = appointments?.filter(apt =>
    apt.appointment_id.toString().toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        await apiCall(`/api/appointments/${editingId}`, 'PUT', formData);
      } else {
        await apiCall('/api/appointments', 'POST', formData);
      }

      mutateAppointments();
      setOpenDialog(false);
      setEditingId(null);
      setFormData({
        leadId: '',
        propertyId: '',
        agentId: '',
        appointmentDate: '',
        appointmentTime: '',
        status: 'scheduled',
        notes: '',
      });
    } catch (err: any) {
      console.error('Error saving appointment:', err);
    }
  };

  const handleEdit = (apt: Appointment) => {
    setFormData({
      leadId: apt.lead_id.toString(),
      propertyId: apt.property_id.toString(),
      agentId: apt.agent_id.toString(),
      appointmentDate: apt.scheduled_at.split('T')[0],
      appointmentTime: apt.scheduled_at.split('T')[1]?.slice(0, 5) || '',
      status: apt.status,
      notes: apt.notes || '',
    });
    setEditingId(apt.appointment_id.toString());
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this appointment?')) {
      try {
        await apiCall(`/api/appointments/${id}`, 'DELETE');
        mutateAppointments();
      } catch (err: any) {
        console.error('Error deleting appointment:', err);
      }
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingId(null);
    setFormData({
      leadId: '',
      propertyId: '',
      agentId: '',
      appointmentDate: '',
      appointmentTime: '',
      status: 'scheduled',
      notes: '',
    });
  };

  if (error) {
    return (
      <div className="space-y-4">
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-4 pt-6">
            <AlertCircle className="size-5 text-destructive flex-shrink-0" />
            <p className="text-sm">Failed to load appointments. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground mt-1">Schedule and manage property showings</p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger>
            <Button onClick={() => {
              setEditingId(null);
              setFormData({
                leadId: '',
                propertyId: '',
                agentId: '',
                appointmentDate: '',
                appointmentTime: '',
                status: 'scheduled',
                notes: '',
              });
            }}>
              <Plus className="mr-2 size-4" />
              Schedule Appointment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Appointment' : 'Schedule Appointment'}</DialogTitle>
              <DialogDescription>
                {editingId ? 'Update appointment details' : 'Create a new appointment'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="leadId">Lead</Label>
                <Select value={formData.leadId as string} onValueChange={(value) => setFormData({ ...formData, leadId: value })}>
                  <SelectTrigger id="leadId">
                    <SelectValue placeholder="Select a lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {leads?.map((lead: any) => (
                      <SelectItem key={lead.lead_id} value={lead.lead_id.toString()}>
                        {lead.first_name} {lead.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="propertyId">Property</Label>
                <Select value={formData.propertyId as string} onValueChange={(value) => setFormData({ ...formData, propertyId: value })}>
                  <SelectTrigger id="propertyId">
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties?.map((prop: any) => (
                      <SelectItem key={prop.property_id} value={prop.property_id.toString()}>
                        {prop.location || prop.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="agentId">Agent</Label>
                <Select value={formData.agentId as string} onValueChange={(value) => setFormData({ ...formData, agentId: value })}>
                  <SelectTrigger id="agentId">
                    <SelectValue placeholder="Select an agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents?.map((agent: any) => (
                      <SelectItem key={agent.agent_id} value={agent.agent_id.toString()}>
                        {agent.first_name} {agent.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="appointmentDate">Date</Label>
                  <Input
                    id="appointmentDate"
                    type="date"
                    value={formData.appointmentDate}
                    onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appointmentTime">Time</Label>
                  <Input
                    id="appointmentTime"
                    type="time"
                    value={formData.appointmentTime}
                    onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status as string} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="rescheduled">Rescheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1">
                  {editingId ? 'Update' : 'Schedule'} Appointment
                </Button>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Search className="size-4 text-muted-foreground" />
            <Input
              placeholder="Search appointments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Appointments</CardTitle>
          <CardDescription>{filteredAppointments.length} appointment(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredAppointments.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No appointments found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((apt) => (
                    <TableRow key={apt.appointment_id}>
                      <TableCell>{formatDate(apt.scheduled_at)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(apt.status)}>
                          {apt.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(apt)}
                          >
                            <Edit className="size-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(apt.appointment_id.toString())}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
