import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sponsorshipsService } from '../../api/sponsorshipsService';
import { paymentMethodsService } from '../../api/paymentMethodsService';
import { SponsorItem, PaymentMethodItem, PaginationMeta } from '../../types';
import { useToast } from '../../hooks/useToast';
import { usePermission } from '../../hooks/usePermission';
import { Permissions } from '../../constants/permissions';
import Card from '../../components/ui/Card';
import Table, { Column } from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import StatusBadge from '../../components/common/StatusBadge';
import CurrencyDisplay from '../../components/common/CurrencyDisplay';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PermissionGuard from '../../components/common/PermissionGuard';
import { formatDate } from '../../utils/formatters';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { Plus, Eye, Edit2, Trash2, Users, RefreshCw } from 'lucide-react';

interface EventSponsorsPageProps {
  eventId?: string;
}

export const EventSponsorsPage: React.FC<EventSponsorsPageProps> = ({ eventId: propEventId }) => {
  const { id: routeEventId } = useParams<{ id: string }>();
  const eventId = propEventId || routeEventId;
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = usePermission();

  const [sponsors, setSponsors] = useState<SponsorItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [sponsorModalOpen, setSponsorModalOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<SponsorItem | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [sponsorshipAmount, setSponsorshipAmount] = useState('');
  const [sponsorshipType, setSponsorshipType] = useState('Gold Sponsor');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [sponsorshipDate, setSponsorshipDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<SponsorItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    paymentMethodsService.getAll().then((res) => {
      if (res.success && res.data) setPaymentMethods(res.data);
    });
  }, []);

  const fetchSponsors = async () => {
    if (!eventId) return;
    try {
      setIsLoading(true);
      const res = await sponsorshipsService.listByEvent(eventId, {
        page: meta.page,
        limit: meta.limit,
      });

      if (res.success && res.data) {
        setSponsors(res.data);
        if (res.meta) setMeta(res.meta);
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to fetch event sponsors'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSponsors();
  }, [eventId, meta.page, meta.limit]);

  const handleOpenCreateModal = () => {
    setEditingSponsor(null);
    setCompanyName('');
    setContactPerson('');
    setContactNumber('');
    setEmail('');
    setSponsorshipAmount('');
    setSponsorshipType('Gold Sponsor');
    setPaymentMethodId(paymentMethods[0]?.id || '');
    setSponsorshipDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setSponsorModalOpen(true);
  };

  const handleOpenEditModal = (sponsor: SponsorItem) => {
    setEditingSponsor(sponsor);
    setCompanyName(sponsor.company_name);
    setContactPerson(sponsor.contact_person || '');
    setContactNumber(sponsor.contact_number || '');
    setEmail(sponsor.email || '');
    setSponsorshipAmount(String(sponsor.sponsorship_amount));
    setSponsorshipType(sponsor.sponsorship_type || '');
    setPaymentMethodId(sponsor.payment_method_id || '');
    setSponsorshipDate(sponsor.sponsorship_date ? sponsor.sponsorship_date.split('T')[0] : '');
    setNotes(sponsor.notes || '');
    setSponsorModalOpen(true);
  };

  const handleSaveSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !sponsorshipAmount || !eventId) {
      toast.warning('Please enter company name and amount');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        company_name: companyName,
        contact_person: contactPerson || null,
        contact_number: contactNumber || null,
        email: email || null,
        sponsorship_amount: Number(sponsorshipAmount),
        sponsorship_type: sponsorshipType || null,
        payment_method_id: paymentMethodId || null,
        sponsorship_date: sponsorshipDate || null,
        notes: notes || null,
      };

      let res;
      if (editingSponsor) {
        res = await sponsorshipsService.update(editingSponsor.id, payload);
      } else {
        res = await sponsorshipsService.createForEvent(eventId, payload);
      }

      if (res.success) {
        toast.success(editingSponsor ? 'Sponsor updated successfully.' : 'Sponsor registered successfully.');
        setSponsorModalOpen(false);
        fetchSponsors();
      } else {
        toast.error(res.message || 'Failed to save sponsor');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to save sponsor details'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSponsor = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const res = await sponsorshipsService.delete(deleteTarget.id);
      if (res.success) {
        toast.success('Sponsor deleted successfully.');
        setDeleteTarget(null);
        fetchSponsors();
      } else {
        toast.error(res.message || 'Failed to delete sponsor');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to delete sponsor'));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<SponsorItem>[] = [
    {
      key: 'company_name',
      header: 'Company / Sponsor',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block">{row.company_name}</span>
          <span className="text-xs text-indigo-600 font-medium">{row.sponsorship_type || 'General Sponsor'}</span>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact Person',
      render: (row) => (
        <div className="text-xs">
          <span className="text-slate-800 font-medium block">{row.contact_person || '—'}</span>
          <span className="text-slate-400">{row.contact_number || row.email || ''}</span>
        </div>
      ),
    },
    {
      key: 'sponsorship_amount',
      header: 'Committed Amount',
      align: 'right',
      render: (row) => <CurrencyDisplay amount={row.sponsorship_amount} className="font-bold text-slate-900" />,
    },
    {
      key: 'payment_status',
      header: 'Payment Status',
      align: 'center',
      render: (row) => <StatusBadge status={row.payment_status} size="sm" />,
    },
    {
      key: 'sponsorship_date',
      header: 'Date',
      render: (row) => <span className="text-xs text-slate-500">{formatDate(row.sponsorship_date)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => navigate(`/sponsors/${row.id}`)}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Sponsor Details & Payments"
          >
            <Eye className="w-4 h-4" />
          </button>
          <PermissionGuard permission={Permissions.SPONSORSHIP_UPDATE}>
            <button
              type="button"
              onClick={() => handleOpenEditModal(row)}
              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit Sponsor"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </PermissionGuard>
          <PermissionGuard permission={Permissions.SPONSORSHIP_DELETE}>
            <button
              type="button"
              onClick={() => setDeleteTarget(row)}
              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Sponsor"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </PermissionGuard>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card
        title="Event Sponsors"
        subtitle="Corporate sponsors and individual patron contributions."
        headerAction={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSponsors}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
            <PermissionGuard permission={Permissions.SPONSORSHIP_CREATE}>
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenCreateModal}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Sponsor
              </Button>
            </PermissionGuard>
          </div>
        }
      >
        <Table
          columns={columns}
          data={sponsors}
          isLoading={isLoading}
          emptyText="No sponsors registered for this event yet."
          onRowClick={(row) => navigate(`/sponsors/${row.id}`)}
        />

        <Pagination
          meta={meta}
          onPageChange={(page) => setMeta((prev) => ({ ...prev, page }))}
          onLimitChange={(limit) => setMeta((prev) => ({ ...prev, limit, page: 1 }))}
        />
      </Card>

      {/* Create / Edit Sponsor Modal */}
      <Modal
        isOpen={sponsorModalOpen}
        onClose={() => setSponsorModalOpen(false)}
        title={editingSponsor ? 'Edit Sponsor Details' : 'Register New Sponsor'}
        description="Provide sponsor company details and committed sponsorship funding."
        size="lg"
      >
        <form onSubmit={handleSaveSponsor} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Company / Sponsor Name"
              placeholder="e.g. Apex Real Estate, HDFC Bank"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              requiredIndicator
            />
            <Input
              label="Sponsorship Tier / Type"
              placeholder="e.g. Title Sponsor, Gold, Silver, Food Sponsor"
              value={sponsorshipType}
              onChange={(e) => setSponsorshipType(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Contact Person"
              placeholder="e.g. Anand Mehta"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
            />
            <Input
              label="Phone Number"
              placeholder="+91 9876543210"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="sponsor@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Committed Amount (₹)"
              type="number"
              placeholder="e.g. 50000"
              value={sponsorshipAmount}
              onChange={(e) => setSponsorshipAmount(e.target.value)}
              requiredIndicator
            />

            <Select
              label="Intended Payment Method"
              value={paymentMethodId}
              onChange={(e) => setPaymentMethodId(e.target.value)}
            >
              {paymentMethods.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.code})
                </option>
              ))}
            </Select>

            <Input
              label="Commitment Date"
              type="date"
              value={sponsorshipDate}
              onChange={(e) => setSponsorshipDate(e.target.value)}
            />
          </div>

          <Textarea
            label="Notes / Deliverables (Optional)"
            placeholder="e.g. Banner placement at main entrance, stall in festival area..."
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSponsorModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSaving}>
              {editingSponsor ? 'Save Changes' : 'Register Sponsor'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteSponsor}
        title="Delete Sponsor"
        message={
          <span>
            Are you sure you want to delete <strong>{deleteTarget?.company_name}</strong>? All recorded payment history for this sponsor will also be removed.
          </span>
        }
        confirmLabel="Delete Sponsor"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default EventSponsorsPage;
