import React, { useState, useEffect } from 'react';
import { Plus, Edit, CheckCircle, XCircle, Car, X, Save, Trash2 } from 'lucide-react';
import type { Vehicle } from '../../types';
import { VehicleService } from '../../services/vehicles/vehicleService';
import { DEFAULT_CAR_TYPES } from '../../constants';
import { useToast } from '../../context/ToastContext';

export const VehiclesPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const [carNumber, setCarNumber] = useState('');
  const [carType, setCarType] = useState(DEFAULT_CAR_TYPES[0]);
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
    setNotes('');
    setConfirmDelete(false);
    setIsModalOpen(true);
  };

  const openEditModal = (veh: Vehicle) => {
    setEditingVehicle(veh);
    setCarNumber(veh.carNumber);
    setCarType(veh.carType);
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
      if (editingVehicle) {
        const updatedData = {
          carNumber: carNumber.trim(),
          carType,
          notes: notes.trim()
        };
        setVehicles((prev) => prev.map((v) => (v.id === editingVehicle.id ? { ...v, ...updatedData } : v)));
        await VehicleService.update(editingVehicle.id, updatedData);
        showToast(`Vehicle ${carNumber.trim()} updated successfully`, 'success');
      } else {
        const newVehicle = await VehicleService.create({
          carNumber: carNumber.trim(),
          carType,
          notes: notes.trim(),
          isActive: true
        });
        setVehicles((prev) => [...prev, newVehicle]);
        showToast(`Vehicle ${carNumber.trim()} added successfully`, 'success');
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
    showToast(`Vehicle ${veh.carNumber} is now ${veh.isActive ? 'Inactive' : 'Active'}`, 'info');
  };

  const handleModalDelete = async () => {
    if (!editingVehicle) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    try {
      setVehicles((prev) => prev.filter((v) => v.id !== editingVehicle.id));
      await VehicleService.delete(editingVehicle.id);
      showToast(`Vehicle ${editingVehicle.carNumber} deleted successfully`, 'info');
      setIsModalOpen(false);
    } catch (err: any) {
      showToast('Error deleting vehicle: ' + (err.message || ''), 'error');
    }
  };

  return (
    <div className="page-container">
      <div className="page-toolbar">
        <div className="page-title-group">
          <h2 className="page-title">Vehicle Fleet Management</h2>
          <span className="page-title-badge">{vehicles.length} VEHICLES</span>
        </div>

        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} />
          <span>ADD VEHICLE</span>
        </button>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '220px' }}>Car / Plate Number</th>
              <th style={{ width: '200px' }}>Car Type</th>
              <th style={{ width: '130px' }}>Status</th>
              <th>Vehicle Notes & Maintenance</th>
              <th style={{ width: '140px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((veh) => (
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
                <td style={{ fontWeight: 600 }}>{veh.carType}</td>
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
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingVehicle ? `Edit Vehicle: ${editingVehicle.carNumber}` : 'Add New Vehicle'}
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
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Car Plate Number / Code *</label>
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
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Vehicle Notes & Service Info</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Year, model, insurance expiry, VIP amenities..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  {editingVehicle && (
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
