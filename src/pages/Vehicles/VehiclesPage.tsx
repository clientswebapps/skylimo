import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Edit, 
  CheckCircle, 
  XCircle, 
  Car, 
  X, 
  Save, 
  Trash2, 
  CalendarDays, 
  KeyRound, 
  Layers 
} from 'lucide-react';
import type { Vehicle, VehiclePurpose } from '../../types';
import { VehicleService } from '../../services/vehicles/vehicleService';
import { DEFAULT_CAR_TYPES } from '../../constants';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

type PurposeFilter = 'all' | 'trips' | 'rentals' | 'both';

export const VehiclesPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeTab, setActiveTab] = useState<PurposeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Form State
  const [carNumber, setCarNumber] = useState('');
  const [carType, setCarType] = useState(DEFAULT_CAR_TYPES[0]);
  const [carModel, setCarModel] = useState('2024');
  const [purpose, setPurpose] = useState<VehiclePurpose>('trips');
  const [dailyRate, setDailyRate] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    return VehicleService.subscribe(setVehicles);
  }, []);

  const openAddModal = () => {
    setEditingVehicle(null);
    setCarNumber('');
    setCarType(DEFAULT_CAR_TYPES[0]);
    setCarModel('2024');
    setPurpose(activeTab === 'rentals' ? 'rentals' : activeTab === 'both' ? 'both' : 'trips');
    setDailyRate(activeTab === 'rentals' ? 15 : '');
    setNotes('');
    setConfirmDelete(false);
    setIsModalOpen(true);
  };

  const openEditModal = (veh: Vehicle) => {
    setEditingVehicle(veh);
    setCarNumber(veh.carNumber);
    setCarType(veh.carType);
    setCarModel(veh.carModel || '2024');
    setPurpose(veh.purpose || 'trips');
    setDailyRate(veh.dailyRate ?? '');
    setNotes(veh.notes || '');
    setConfirmDelete(false);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carNumber.trim()) {
      showToast('Please enter car plate number', 'error');
      return;
    }

    setSaving(true);
    try {
      const parsedDailyRate = dailyRate !== '' ? Number(dailyRate) : undefined;

      if (editingVehicle) {
        const updatedData: Partial<Vehicle> = {
          carNumber: carNumber.trim(),
          carType,
          carModel: carModel.trim() || undefined,
          purpose,
          dailyRate: parsedDailyRate,
          notes: notes.trim()
        };
        setVehicles((prev) => prev.map((v) => (v.id === editingVehicle.id ? { ...v, ...updatedData } : v)));
        await VehicleService.update(editingVehicle.id, updatedData);
        showToast(`Vehicle #${carNumber.trim()} updated successfully`, 'success');
      } else {
        const newVehicle = await VehicleService.create({
          carNumber: carNumber.trim(),
          carType,
          carModel: carModel.trim() || undefined,
          purpose,
          dailyRate: parsedDailyRate,
          notes: notes.trim(),
          isActive: true
        });
        setVehicles((prev) => [...prev, newVehicle]);
        showToast(`Vehicle #${carNumber.trim()} added successfully`, 'success');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showToast('Error saving vehicle: ' + (err.message || ''), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (veh: Vehicle, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setVehicles((prev) => prev.map((v) => (v.id === veh.id ? { ...v, isActive: !veh.isActive } : v)));
    await VehicleService.toggleActive(veh.id, veh.isActive);
    showToast(`Vehicle #${veh.carNumber} is now ${veh.isActive ? 'Inactive' : 'Active'}`, 'info');
  };

  const handleModalDelete = async () => {
    if (!isAdmin) {
      showToast('Action restricted: Only Administrators can delete vehicles.', 'error');
      return;
    }
    if (!editingVehicle) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    try {
      setVehicles((prev) => prev.filter((v) => v.id !== editingVehicle.id));
      await VehicleService.delete(editingVehicle.id);
      showToast(`Vehicle #${editingVehicle.carNumber} deleted successfully`, 'info');
      setIsModalOpen(false);
    } catch (err: any) {
      showToast('Error deleting vehicle: ' + (err.message || ''), 'error');
    }
  };

  // Counts for tabs
  const countAll = vehicles.length;
  const countTrips = vehicles.filter((v) => !v.purpose || v.purpose === 'trips').length;
  const countRentals = vehicles.filter((v) => v.purpose === 'rentals').length;
  const countBoth = vehicles.filter((v) => v.purpose === 'both').length;

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      // 1. Tab purpose filter
      if (activeTab === 'trips' && (v.purpose && v.purpose !== 'trips')) return false;
      if (activeTab === 'rentals' && v.purpose !== 'rentals') return false;
      if (activeTab === 'both' && v.purpose !== 'both') return false;

      // 2. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          v.carNumber.toLowerCase().includes(q) ||
          v.carType.toLowerCase().includes(q) ||
          (v.carModel && v.carModel.toLowerCase().includes(q)) ||
          (v.notes && v.notes.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [vehicles, activeTab, searchQuery]);

  return (
    <div className="page-container" style={{ overflowY: 'auto' }}>
      {/* Page Toolbar */}
      <div className="page-toolbar">
        <div className="page-title-group">
          <h2 className="page-title">Vehicle Fleet Management</h2>
          <span className="page-title-badge">{vehicles.length} TOTAL VEHICLES</span>
        </div>

        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} />
          <span>ADD VEHICLE</span>
        </button>
      </div>

      {/* Fleet Purpose Segmented Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        marginBottom: '14px'
      }}>
        <div style={{
          display: 'flex',
          backgroundColor: '#EAEAEA',
          borderRadius: '6px',
          padding: '3px',
          gap: '3px'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            style={{
              padding: '6px 14px',
              fontSize: '11.5px',
              fontWeight: activeTab === 'all' ? 800 : 600,
              backgroundColor: activeTab === 'all' ? 'var(--color-black)' : 'transparent',
              color: activeTab === 'all' ? '#FFF' : '#444',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <span>All Fleet</span>
            <span style={{ fontSize: '10px', opacity: 0.85, padding: '1px 5px', borderRadius: '8px', background: activeTab === 'all' ? '#333' : '#DDD' }}>
              {countAll}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('trips')}
            style={{
              padding: '6px 14px',
              fontSize: '11.5px',
              fontWeight: activeTab === 'trips' ? 800 : 600,
              backgroundColor: activeTab === 'trips' ? '#1E40AF' : 'transparent',
              color: activeTab === 'trips' ? '#FFF' : '#444',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <CalendarDays size={13} />
            <span>Booking Trips Fleet</span>
            <span style={{ fontSize: '10px', opacity: 0.85, padding: '1px 5px', borderRadius: '8px', background: activeTab === 'trips' ? '#1D4ED8' : '#DDD' }}>
              {countTrips}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rentals')}
            style={{
              padding: '6px 14px',
              fontSize: '11.5px',
              fontWeight: activeTab === 'rentals' ? 800 : 600,
              backgroundColor: activeTab === 'rentals' ? '#047857' : 'transparent',
              color: activeTab === 'rentals' ? '#FFF' : '#444',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <KeyRound size={13} />
            <span>Car Rentals Fleet</span>
            <span style={{ fontSize: '10px', opacity: 0.85, padding: '1px 5px', borderRadius: '8px', background: activeTab === 'rentals' ? '#065F46' : '#DDD' }}>
              {countRentals}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('both')}
            style={{
              padding: '6px 14px',
              fontSize: '11.5px',
              fontWeight: activeTab === 'both' ? 800 : 600,
              backgroundColor: activeTab === 'both' ? '#B45309' : 'transparent',
              color: activeTab === 'both' ? '#FFF' : '#444',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <Layers size={13} />
            <span>Shared / Dual Purpose</span>
            <span style={{ fontSize: '10px', opacity: 0.85, padding: '1px 5px', borderRadius: '8px', background: activeTab === 'both' ? '#92400E' : '#DDD' }}>
              {countBoth}
            </span>
          </button>
        </div>

        {/* Quick Search */}
        <div>
          <input
            type="text"
            className="form-input"
            style={{ fontSize: '12px', padding: '6px 12px', width: '220px' }}
            placeholder="Search plate, type, model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '180px' }}>Plate Number</th>
              <th style={{ width: '160px' }}>Category & Model</th>
              <th style={{ width: '170px' }}>Fleet Allocation</th>
              <th style={{ width: '120px' }}>Daily Rate</th>
              <th style={{ width: '110px' }}>Status</th>
              <th>Vehicle Notes & Maintenance</th>
              <th style={{ width: '130px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVehicles.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--color-text-muted)' }}>
                  <Car size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                  <div style={{ fontWeight: 700, fontSize: '13px' }}>No Vehicles in this Fleet Category</div>
                  <div style={{ fontSize: '11px', marginTop: '4px' }}>Click "Add Vehicle" to register a new car.</div>
                </td>
              </tr>
            ) : (
              filteredVehicles.map((veh) => {
                const isRental = veh.purpose === 'rentals';
                const isBoth = veh.purpose === 'both';
                const isTrip = !veh.purpose || veh.purpose === 'trips';

                return (
                  <tr 
                    key={veh.id} 
                    style={{ opacity: veh.isActive ? 1 : 0.6, cursor: 'pointer' }}
                    onClick={() => openEditModal(veh)}
                  >
                    <td style={{ fontWeight: 700, fontSize: '13px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Car size={15} color="var(--color-primary)" />
                        {veh.carNumber}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700 }}>{veh.carType}</span>
                      {veh.carModel && (
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginLeft: '6px' }}>
                          ({veh.carModel})
                        </span>
                      )}
                    </td>
                    <td>
                      {isTrip && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#EFF6FF',
                          color: '#1E40AF',
                          fontSize: '11px',
                          fontWeight: 700
                        }}>
                          <CalendarDays size={12} />
                          Booking Trips
                        </span>
                      )}
                      {isRental && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#ECFDF5',
                          color: '#065F46',
                          fontSize: '11px',
                          fontWeight: 700
                        }}>
                          <KeyRound size={12} />
                          Car Rentals
                        </span>
                      )}
                      {isBoth && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#FFFBEB',
                          color: '#92400E',
                          fontSize: '11px',
                          fontWeight: 700
                        }}>
                          <Layers size={12} />
                          Shared Fleet
                        </span>
                      )}
                    </td>
                    <td style={{ fontWeight: 600, color: veh.dailyRate ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                      {veh.dailyRate ? `BHD ${Number(veh.dailyRate).toFixed(3)}/day` : '—'}
                    </td>
                    <td>
                      <span className={`status-badge ${veh.isActive ? 'status-completed' : 'status-cancelled'}`}>
                        {veh.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{veh.notes || '—'}</td>
                    <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn-icon"
                          title="Edit Vehicle"
                          onClick={() => openEditModal(veh)}
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '11px', padding: '3px 8px' }}
                          onClick={(e) => handleToggleActive(veh, e)}
                          title={veh.isActive ? 'Deactivate Vehicle' : 'Activate Vehicle'}
                        >
                          {veh.isActive ? (
                            <span style={{ color: 'var(--color-danger)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <XCircle size={12} /> Deactivate
                            </span>
                          ) : (
                            <span style={{ color: 'var(--color-success)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle size={12} /> Activate
                            </span>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingVehicle ? `Edit Vehicle: #${editingVehicle.carNumber}` : 'Add New Vehicle to Fleet'}
              </h2>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Car Plate Number *</label>
                    <input
                      type="text"
                      required
                      autoFocus
                      className="form-input"
                      placeholder="e.g. 640315"
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

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Vehicle Category *</label>
                  <select
                    className="form-select"
                    value={carType}
                    onChange={(e) => setCarType(e.target.value)}
                  >
                    {DEFAULT_CAR_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Fleet Operational Purpose *</label>
                  <select
                    className="form-select"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value as VehiclePurpose)}
                    style={{ fontWeight: 700 }}
                  >
                    <option value="trips">Booking Trips Only (VIP & Chauffeur Fleet)</option>
                    <option value="rentals">Car Rentals Only (Customer Self-Drive)</option>
                    <option value="both">Both / Shared Fleet (Available for All Operations)</option>
                  </select>
                </div>

                {(purpose === 'rentals' || purpose === 'both') && (
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>
                      Standard Daily Rental Rate (BHD)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      className="form-input"
                      placeholder="e.g. 15.000"
                      value={dailyRate}
                      onChange={(e) => setDailyRate(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Vehicle Notes & Maintenance</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Insurance info, trim details, amenities..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  {isAdmin && editingVehicle && (
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
                      onClick={handleModalDelete}
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
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-sm"
                    disabled={saving}
                  >
                    <Save size={14} />
                    <span>{saving ? 'Saving...' : editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
