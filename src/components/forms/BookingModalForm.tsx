import React, { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import type { Booking, BookingStatus, Driver, Vehicle } from '../../types';
import { DEFAULT_CAR_TYPES, STATUS_OPTIONS } from '../../constants';
import { getTodayYMD } from '../../utils/dateUtils';

interface BookingModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bookingData: Omit<Booking, 'id'>) => Promise<void>;
  onDelete?: (id: string) => Promise<void> | void;
  initialData?: Booking | null;
  drivers: Driver[];
  vehicles: Vehicle[];
  defaultDate?: string;
}

export const BookingModalForm: React.FC<BookingModalFormProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  drivers,
  vehicles,
  defaultDate
}) => {
  const [formData, setFormData] = useState<Omit<Booking, 'id'>>({
    invoice: '',
    date: defaultDate || getTodayYMD(),
    customer: '',
    mobilePhone: '',
    time: '12:00',
    from: '',
    to: '',
    flight: '',
    carTimeOut: '',
    carTimeIn: '',
    carType: 'SUV',
    carNumber: '',
    cash: 0,
    card: 0,
    bankTransfer: 0,
    credit: 0,
    commission: 0,
    driver: '',
    status: 'Confirmed',
    note: ''
  });

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [error, setError] = useState('');

  const handleConfirmDelete = async () => {
    if (!initialData || !onDelete) return;
    setDeleting(true);
    setError('');
    try {
      await onDelete(initialData.id);
      setDeleting(false);
      setIsConfirmingDelete(false);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete booking.');
      setDeleting(false);
      setIsConfirmingDelete(false);
    }
  };

  useEffect(() => {
    setIsConfirmingDelete(false);
    setDeleting(false);
    setSaving(false);
    setError('');
    if (initialData) {
      setFormData({
        invoice: initialData.invoice || '',
        date: initialData.date || defaultDate || getTodayYMD(),
        customer: initialData.customer || '',
        mobilePhone: initialData.mobilePhone || '',
        time: initialData.time || '12:00',
        from: initialData.from || '',
        to: initialData.to || '',
        flight: initialData.flight || '',
        carTimeOut: initialData.carTimeOut || '',
        carTimeIn: initialData.carTimeIn || '',
        carType: initialData.carType || 'SUV',
        carNumber: initialData.carNumber || '',
        cash: initialData.cash || 0,
        card: initialData.card || 0,
        bankTransfer: initialData.bankTransfer || 0,
        credit: initialData.credit || 0,
        commission: initialData.commission || 0,
        driver: initialData.driver || '',
        status: initialData.status || 'Confirmed',
        note: initialData.note || ''
      });
    } else {
      const autoInv = String(Math.floor(100000 + Math.random() * 900000));
      const firstActiveDriver = drivers.find((d) => d.isActive)?.name || '';
      const firstActiveVehicle = vehicles.find((v) => v.isActive);

      setFormData({
        invoice: autoInv,
        date: defaultDate || getTodayYMD(),
        customer: '',
        mobilePhone: '',
        time: '09:00',
        from: 'Bahrain Airport',
        to: '',
        flight: '',
        carTimeOut: '',
        carTimeIn: '',
        carType: firstActiveVehicle?.carType || 'SUV',
        carNumber: firstActiveVehicle?.carNumber || '',
        cash: 0,
        card: 0,
        bankTransfer: 0,
        credit: 0,
        commission: 0,
        driver: firstActiveDriver,
        status: 'Confirmed',
        note: ''
      });
    }
    setError('');
  }, [initialData, isOpen, defaultDate, drivers, vehicles]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer.trim()) {
      setError('Please enter the customer name.');
      return;
    }
    if (!formData.date) {
      setError('Please select a valid date.');
      return;
    }
    if (!formData.time) {
      setError('Please specify the pickup time.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Unable to save booking. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCarNumberChange = (carNum: string) => {
    const selectedVeh = vehicles.find((v) => v.carNumber === carNum);
    setFormData((prev) => ({
      ...prev,
      carNumber: carNum,
      carType: selectedVeh ? selectedVeh.carType : prev.carType
    }));
  };

  const activeDrivers = drivers.filter((d) => d.isActive || d.name === formData.driver);
  const activeVehicles = vehicles.filter((v) => v.isActive || v.carNumber === formData.carNumber);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {initialData ? 'Edit Booking Trip' : 'Add New Booking Trip'}
          </h2>
          <button 
            type="button" 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body">
            {error && (
              <div style={{ padding: '8px 12px', background: 'var(--color-danger-bg)', color: 'var(--color-danger)', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                {error}
              </div>
            )}

            <div className="form-grid">
              <div className="form-section-title">1. Customer Details</div>
              
              <div className="form-group">
                <label className="form-label">Customer Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Osman / Mr. Smith"
                  value={formData.customer}
                  onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mobile Phone</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. +973 3881 2940"
                  value={formData.mobilePhone}
                  onChange={(e) => setFormData({ ...formData, mobilePhone: e.target.value })}
                />
              </div>

              <div className="form-section-title">2. Trip & Schedule</div>

              <div className="form-group">
                <label className="form-label">Invoice / Ref #</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 640315"
                  value={formData.invoice}
                  onChange={(e) => setFormData({ ...formData, invoice: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Trip Date *</label>
                <input
                  type="date"
                  required
                  className="form-input"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Pickup Time *</label>
                <input
                  type="time"
                  required
                  className="form-input"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Flight Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. GF 215 / RJ 672"
                  value={formData.flight || ''}
                  onChange={(e) => setFormData({ ...formData, flight: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">From (Pickup Location)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Bahrain International Airport"
                  value={formData.from}
                  onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">To (Destination)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Four Seasons Hotel Bahrain Bay"
                  value={formData.to}
                  onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                />
              </div>

              <div className="form-section-title">3. Vehicle & Driver Assignment</div>

              <div className="form-group">
                <label className="form-label">Assigned Driver</label>
                <select
                  className="form-select"
                  value={formData.driver}
                  onChange={(e) => setFormData({ ...formData, driver: e.target.value })}
                >
                  <option value="">-- Select Driver --</option>
                  {activeDrivers.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name} {d.phone ? `(${d.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Car Number</label>
                <select
                  className="form-select"
                  value={formData.carNumber}
                  onChange={(e) => handleCarNumberChange(e.target.value)}
                >
                  <option value="">-- Select Vehicle --</option>
                  {activeVehicles.map((v) => (
                    <option key={v.id} value={v.carNumber}>
                      {v.carNumber} — ({v.carType})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Car Type</label>
                <select
                  className="form-select"
                  value={formData.carType}
                  onChange={(e) => setFormData({ ...formData, carType: e.target.value })}
                >
                  {DEFAULT_CAR_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label className="form-label">Car Time Out</label>
                  <input
                    type="time"
                    className="form-input"
                    value={formData.carTimeOut || ''}
                    onChange={(e) => setFormData({ ...formData, carTimeOut: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Car Time In</label>
                  <input
                    type="time"
                    className="form-input"
                    value={formData.carTimeIn || ''}
                    onChange={(e) => setFormData({ ...formData, carTimeIn: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-section-title">4. Payment Information (BHD)</div>

              <div className="form-group">
                <label className="form-label">Cash</label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  className="form-input"
                  placeholder="0.000"
                  value={formData.cash || ''}
                  onChange={(e) => setFormData({ ...formData, cash: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Card</label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  className="form-input"
                  placeholder="0.000"
                  value={formData.card || ''}
                  onChange={(e) => setFormData({ ...formData, card: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bank Transfer</label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  className="form-input"
                  placeholder="0.000"
                  value={formData.bankTransfer || ''}
                  onChange={(e) => setFormData({ ...formData, bankTransfer: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Credit</label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  className="form-input"
                  placeholder="0.000"
                  value={formData.credit || ''}
                  onChange={(e) => setFormData({ ...formData, credit: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Commission</label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  className="form-input"
                  placeholder="0.000"
                  value={formData.commission || ''}
                  onChange={(e) => setFormData({ ...formData, commission: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as BookingStatus })}
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Notes & Special Instructions</label>
                <textarea
                  className="form-textarea"
                  placeholder="e.g. VIP guest, child seat requested, flight delayed, etc."
                  value={formData.note || ''}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
            <div>
              {initialData && onDelete && !isConfirmingDelete && (
                <button 
                  type="button" 
                  className="btn btn-danger btn-sm" 
                  onClick={() => setIsConfirmingDelete(true)}
                  disabled={saving || deleting}
                  title="Delete this booking trip"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '6px 10px' }}
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>
              )}

              {initialData && onDelete && isConfirmingDelete && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#FEF2F2', padding: '3px 8px', borderRadius: '4px', border: '1px solid #FCA5A5' }}>
                  <span style={{ fontSize: '10px', color: '#991B1B', fontWeight: 700 }}>
                    Delete?
                  </span>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    disabled={deleting}
                    onClick={handleConfirmDelete}
                    style={{ fontSize: '10px', padding: '2px 6px' }}
                  >
                    {deleting ? '...' : 'Yes'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={deleting}
                    onClick={() => setIsConfirmingDelete(false)}
                    style={{ fontSize: '10px', padding: '2px 6px' }}
                  >
                    No
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm" 
                onClick={onClose} 
                disabled={saving || deleting}
                style={{ fontSize: '11px', padding: '6px 12px' }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary btn-sm" 
                disabled={saving || deleting}
                style={{ fontSize: '11px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <Save size={14} />
                <span>{saving ? 'Saving...' : initialData ? 'Update' : 'Save'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
