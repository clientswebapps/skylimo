import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, KeyRound, User, Car, Calendar, DollarSign, FileText } from 'lucide-react';
import type { CarRental, RentalPaymentStatus, Vehicle } from '../../types';
import { RentalService } from '../../services/rentals/rentalService';
import { VehicleService } from '../../services/vehicles/vehicleService';
import { DEFAULT_CAR_TYPES } from '../../constants';

interface RentalModalFormProps {
  isOpen: boolean;
  rental: CarRental | null;
  defaultDate?: string;
  onClose: () => void;
  onSave: (savedRental: CarRental) => void;
  onDelete?: (id: string) => void;
}

export const RentalModalForm: React.FC<RentalModalFormProps> = ({
  isOpen,
  rental,
  defaultDate,
  onClose,
  onSave,
  onDelete
}) => {
  const isEditing = !!rental;

  const [rentalVehicles, setRentalVehicles] = useState<Vehicle[]>([]);

  const [agreementNumber, setAgreementNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [nationality, setNationality] = useState('');

  const [carType, setCarType] = useState('Toyota Yaris');
  const [carNumber, setCarNumber] = useState('');
  const [carModel, setCarModel] = useState('2024');

  const [rentalDays, setRentalDays] = useState(1);
  const [rentDate, setRentDate] = useState('');
  const [rentTime, setRentTime] = useState('12:00');
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('12:00');

  const [rentPrice, setRentPrice] = useState<number | ''>(15);
  const [advancePayment, setAdvancePayment] = useState<number | ''>(15);
  const [depositAmount, setDepositAmount] = useState<number | ''>(50);
  const [paymentStatus, setPaymentStatus] = useState<RentalPaymentStatus>('PAID');
  const [note, setNote] = useState('');

  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const unsub = VehicleService.subscribe((list) => {
      const available = list.filter((v) => v.isActive && (v.purpose === 'rentals' || v.purpose === 'both'));
      setRentalVehicles(available);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (rental) {
      setAgreementNumber(rental.agreementNumber || '');
      setCustomerName(rental.customerName || '');
      setContactNumber(rental.contactNumber || '');
      setIdNumber(rental.idNumber || '');
      setNationality(rental.nationality || '');
      setCarType(rental.carType || 'Toyota Yaris');
      setCarNumber(rental.carNumber || '');
      setCarModel(rental.carModel || '2024');
      setRentalDays(rental.rentalDays || 1);
      setRentDate(rental.rentDate || '');
      setRentTime(rental.rentTime || '12:00');
      setReturnDate(rental.returnDate || '');
      setReturnTime(rental.returnTime || '12:00');
      setRentPrice(rental.rentPrice ?? 0);
      setAdvancePayment(rental.advancePayment ?? 0);
      setDepositAmount(rental.depositAmount ?? 0);
      setPaymentStatus(rental.paymentStatus || 'PAID');
      setNote(rental.note || '');
      setConfirmDelete(false);
    } else {
      const todayStr = defaultDate || new Date().toISOString().split('T')[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      setAgreementNumber(RentalService.getNextAgreementNumber());
      setCustomerName('');
      setContactNumber('');
      setIdNumber('');
      setNationality('');
      setCarType('Toyota Yaris');
      setCarNumber('');
      setCarModel('2024');
      setRentalDays(1);
      setRentDate(todayStr);
      setRentTime('12:00');
      setReturnDate(tomorrowStr);
      setReturnTime('12:00');
      setRentPrice(15);
      setAdvancePayment(15);
      setDepositAmount(50);
      setPaymentStatus('PAID');
      setNote('');
      setConfirmDelete(false);
    }
  }, [rental, defaultDate, isOpen]);

  // Auto-calculate rental days when rentDate and returnDate change
  const handleDateChange = (start: string, end: string) => {
    setRentDate(start);
    setReturnDate(end);
    if (start && end) {
      const d1 = new Date(start);
      const d2 = new Date(end);
      const diffTime = d2.getTime() - d1.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        setRentalDays(diffDays);
      }
    }
  };

  const calculatedRemaining = Math.max(0, (Number(rentPrice) || 0) - (Number(advancePayment) || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('Please enter customer name');
      return;
    }
    if (!carNumber.trim()) {
      alert('Please enter car plate number');
      return;
    }
    if (!rentDate || !returnDate) {
      alert('Please select rent and return dates');
      return;
    }

    setSaving(true);
    try {
      const priceNum = Number(rentPrice) || 0;
      const advanceNum = Number(advancePayment) || 0;
      const depositNum = Number(depositAmount) || 0;

      const payload: Omit<CarRental, 'id'> = {
        agreementNumber: agreementNumber.trim() || RentalService.getNextAgreementNumber(),
        customerName: customerName.trim(),
        contactNumber: contactNumber.trim(),
        idNumber: idNumber.trim(),
        nationality: nationality.trim().toUpperCase(),
        carType: carType.trim(),
        carNumber: carNumber.trim(),
        carModel: carModel.trim(),
        rentalDays: Number(rentalDays) || 1,
        rentDate,
        rentTime,
        returnDate,
        returnTime,
        rentPrice: priceNum,
        advancePayment: advanceNum,
        remainingAmount: calculatedRemaining,
        depositAmount: depositNum,
        paymentStatus,
        note: note.trim()
      };

      if (isEditing && rental) {
        await RentalService.update(rental.id, payload);
        onSave({ ...payload, id: rental.id, rowNumber: rental.rowNumber });
      } else {
        const created = await RentalService.create(payload);
        onSave(created);
      }
      onClose();
    } catch (err: any) {
      alert('Error saving rental: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!isEditing || !rental || !onDelete) return;

    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    try {
      await RentalService.delete(rental.id);
      onDelete(rental.id);
      onClose();
    } catch (err: any) {
      alert('Error deleting rental: ' + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '680px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound size={18} color="var(--color-primary)" />
            <h2 className="modal-title">
              {isEditing ? `Edit Agreement #${agreementNumber}` : 'New Car Rental Agreement'}
            </h2>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body" style={{ overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Agreement & Customer Section */}
            <div style={{ background: '#F9FAFB', padding: '12px', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--color-black)', marginBottom: '10px' }}>
                <User size={14} color="var(--color-primary)" />
                <span>Customer & Agreement Details</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Agreement / Invoice #</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={agreementNumber}
                    onChange={(e) => setAgreementNumber(e.target.value)}
                    style={{ fontWeight: 700, color: 'var(--color-success)', background: '#F0FDF4' }}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    className="form-input"
                    placeholder="e.g. SWABIR TWALIB AHMED"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Contact Number *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. +973 3375 4094"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>ID / Passport Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 971047359"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Nationality</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. KENYA, SAUDI, BAHRAIN"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Car Details Section */}
            <div style={{ background: '#F9FAFB', padding: '12px', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--color-black)' }}>
                  <Car size={14} color="var(--color-primary)" />
                  <span>Car Details & Vehicle Allocation</span>
                </div>

                {rentalVehicles.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Quick Select Fleet:</span>
                    <select
                      className="form-select"
                      style={{ fontSize: '11px', padding: '3px 8px', height: 'auto', fontWeight: 700, color: 'var(--color-primary)' }}
                      value={carNumber}
                      onChange={(e) => {
                        const selected = rentalVehicles.find((v) => v.carNumber === e.target.value);
                        if (selected) {
                          setCarNumber(selected.carNumber);
                          setCarType(selected.carType);
                          if (selected.carModel) setCarModel(selected.carModel);
                          if (selected.dailyRate && (!rentPrice || rentPrice === 15)) {
                            setRentPrice(selected.dailyRate);
                            setAdvancePayment(selected.dailyRate * rentalDays);
                          }
                        }
                      }}
                    >
                      <option value="">-- Choose from Rental Fleet --</option>
                      {rentalVehicles.map((v) => (
                        <option key={v.id} value={v.carNumber}>
                          #{v.carNumber} — {v.carType} {v.carModel ? `(${v.carModel})` : ''} {v.dailyRate ? `[BHD ${Number(v.dailyRate).toFixed(3)}/day]` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Car Make / Type *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Toyota Yaris, Nissan Sunny"
                    value={carType}
                    onChange={(e) => setCarType(e.target.value)}
                    list="car-types-list"
                  />
                  <datalist id="car-types-list">
                    <option value="Toyota Yaris" />
                    <option value="Nissan Sunny" />
                    <option value="Toyota Camry" />
                    <option value="Nissan Patrol" />
                    <option value="Hyundai Accent" />
                    <option value="Kia Pegas" />
                    {DEFAULT_CAR_TYPES.map((t) => <option key={t} value={t} />)}
                  </datalist>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Car Plate Number *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. 624409"
                    value={carNumber}
                    onChange={(e) => setCarNumber(e.target.value)}
                    style={{ fontWeight: 700 }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Model / Year</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 2024"
                    value={carModel}
                    onChange={(e) => setCarModel(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Rental Schedule Section */}
            <div style={{ background: '#F9FAFB', padding: '12px', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--color-black)', marginBottom: '10px' }}>
                <Calendar size={14} color="var(--color-primary)" />
                <span>Rental Schedule & Period</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Rent Date *</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={rentDate}
                    onChange={(e) => handleDateChange(e.target.value, returnDate)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Rent Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={rentTime}
                    onChange={(e) => setRentTime(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Return Date *</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={returnDate}
                    onChange={(e) => handleDateChange(rentDate, e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Return Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={returnTime}
                    onChange={(e) => setReturnTime(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Rental Days</label>
                  <input
                    type="number"
                    min={1}
                    className="form-input"
                    value={rentalDays}
                    onChange={(e) => setRentalDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    style={{ fontWeight: 700 }}
                  />
                </div>
              </div>
            </div>

            {/* Payment & Deposit Section */}
            <div style={{ background: '#F9FAFB', padding: '12px', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--color-black)', marginBottom: '10px' }}>
                <DollarSign size={14} color="var(--color-primary)" />
                <span>Payment & Deposit Breakdown (BHD)</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(115px, 1fr))', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Rent Price (BHD) *</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    required
                    className="form-input"
                    value={rentPrice}
                    onChange={(e) => setRentPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    style={{ fontWeight: 700 }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Advance (BHD)</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    className="form-input"
                    value={advancePayment}
                    onChange={(e) => setAdvancePayment(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Remaining (BHD)</label>
                  <input
                    type="number"
                    disabled
                    className="form-input"
                    value={calculatedRemaining.toFixed(3)}
                    style={{ background: '#E5E7EB', fontWeight: 700 }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Deposit (BHD)</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    className="form-input"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    style={{ fontWeight: 700, color: 'var(--color-primary)' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Payment Status</label>
                  <select
                    className="form-select"
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as RentalPaymentStatus)}
                    style={{ fontWeight: 700 }}
                  >
                    <option value="PAID">PAID</option>
                    <option value="PARTIAL">PARTIAL</option>
                    <option value="UNPAID">UNPAID</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Note Section */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FileText size={13} />
                <span>Notes & Remarks</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 50BD DEPOSIT RETURN TO CUSTOMER, NO DEPOSIT, SPECIAL TERMS"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#F9FAFB', borderTop: '1px solid #E5E7EB' }}>
            <div>
              {isEditing && onDelete && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{
                    backgroundColor: confirmDelete ? 'var(--color-danger)' : undefined,
                    color: confirmDelete ? '#FFF' : 'var(--color-danger)',
                    borderColor: confirmDelete ? 'var(--color-danger)' : 'var(--color-border)',
                    fontSize: '11px',
                    padding: '6px 12px'
                  }}
                  onClick={handleDeleteClick}
                >
                  <Trash2 size={13} />
                  <span>{confirmDelete ? 'Confirm Delete?' : 'Delete'}</span>
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm" 
                onClick={onClose}
                style={{ fontSize: '11px', padding: '6px 14px' }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary btn-sm" 
                disabled={saving}
                style={{ fontSize: '11px', padding: '6px 16px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <Save size={14} />
                <span>{saving ? 'Saving...' : (isEditing ? 'Update Agreement' : 'Save Agreement')}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
