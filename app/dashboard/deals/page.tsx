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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Plus, Trash2, Edit, Search } from 'lucide-react';
import { apiCall, fetcher } from '@/lib/api';
import { Deal } from '@/lib/types';
import { formatCurrency, getStatusColor } from '@/lib/format';

export default function DealsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    leadId: '',
    propertyId: '',
    salePrice: '',
    dealStatus: 'negotiation',
    closingDate: '',
    notes: '',
  });

  const { data: deals, mutate: mutateDeals, isLoading, error } = useSWR<Deal[]>(
    '/api/deals',
    fetcher
  );
  const { data: leads } = useSWR('/api/leads', fetcher);
  const { data: properties } = useSWR('/api/properties', fetcher);

  const filteredDeals = deals?.filter(deal =>
    deal.deal_id.toString().toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        await apiCall(`/api/deals/${editingId}`, 'PUT', formData);
      } else {
        await apiCall('/api/deals', 'POST', formData);
      }

      mutateDeals();
      setOpenDialog(false);
      setEditingId(null);
      setFormData({
        leadId: '',
        propertyId: '',
        salePrice: '',
        dealStatus: 'negotiation',
        closingDate: '',
        notes: '',
      });
    } catch (err: any) {
      console.error('Error saving deal:', err);
    }
  };

  const handleEdit = (deal: Deal) => {
    setFormData({
      leadId: deal.lead_id.toString(),
      propertyId: deal.property_id.toString(),
      salePrice: deal.final_price.toString(),
      dealStatus: deal.status,
      closingDate: deal.closing_date?.split('T')[0] || '',
      notes: '',
    });
    setEditingId(deal.deal_id.toString());
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this deal?')) {
      try {
        await apiCall(`/api/deals/${id}`, 'DELETE');
        mutateDeals();
      } catch (err: any) {
        console.error('Error deleting deal:', err);
      }
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingId(null);
    setFormData({
      leadId: '',
      propertyId: '',
      salePrice: '',
      dealStatus: 'negotiation',
      closingDate: '',
      notes: '',
    });
  };

  if (error) {
    return (
      <div className="space-y-4">
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-4 pt-6">
            <AlertCircle className="size-5 text-destructive flex-shrink-0" />
            <p className="text-sm">Failed to load deals. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalDealValue = deals?.reduce((sum, deal) => sum + deal.final_price, 0) || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deals</h1>
          <p className="text-muted-foreground mt-1">Manage your real estate transactions</p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger>
            <Button onClick={() => {
              setEditingId(null);
              setFormData({
                leadId: '',
                propertyId: '',
                salePrice: '',
                dealStatus: 'negotiation',
                closingDate: '',
                notes: '',
              });
            }}>
              <Plus className="mr-2 size-4" />
              New Deal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Deal' : 'Create New Deal'}</DialogTitle>
              <DialogDescription>
                {editingId ? 'Update deal information' : 'Record a new real estate transaction'}
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
                <Label htmlFor="salePrice">Sale Price</Label>
                <Input
                  id="salePrice"
                  type="number"
                  value={formData.salePrice}
                  onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                  placeholder="Enter sale price"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dealStatus">Deal Status</Label>
                <Select value={formData.dealStatus} onValueChange={(value) => setFormData({ ...formData, dealStatus: value })}>
                  <SelectTrigger id="dealStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="negotiation">Negotiation</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="pending_closing">Pending Closing</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="closingDate">Expected Closing Date</Label>
                <Input
                  id="closingDate"
                  type="date"
                  value={formData.closingDate}
                  onChange={(e) => setFormData({ ...formData, closingDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add any deal notes or conditions"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1">
                  {editingId ? 'Update' : 'Create'} Deal
                </Button>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Deal Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalDealValue)}</p>
            <p className="text-xs text-muted-foreground mt-1">{deals?.length || 0} deals</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Closed Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{deals?.filter(d => d.status === 'closed').length || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Deals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Search className="size-4 text-muted-foreground" />
            <Input
              placeholder="Search deals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Deals</CardTitle>
          <CardDescription>{filteredDeals.length} deal(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredDeals.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No deals found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sale Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Closing Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeals.map((deal) => (
                    <TableRow key={deal.deal_id}>
                      <TableCell className="font-medium">{formatCurrency(deal.final_price)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(deal.status)}>
                          {deal.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{deal.closing_date ? new Date(deal.closing_date).toLocaleDateString() : '—'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(deal)}
                          >
                            <Edit className="size-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(deal.deal_id.toString())}
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
