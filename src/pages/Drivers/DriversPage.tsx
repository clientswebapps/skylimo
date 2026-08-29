import React, { useState, useEffect } from 'react';
import { Plus, Edit, CheckCircle, XCircle, Phone, X, Save, Trash2 } from 'lucide-react';
import type { Driver } from '../../types';
import { DriverService } from '../../services/drivers/driverService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const DriversPage: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    return DriverService.subscribe(setDrivers);
  }, []);

  const openAddModal = () => {
    setEditingDriver(null);
    setName('');
    setPhone('');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (driver: Driver) => {
    setEditingDriver(driver);
    setName(driver.name);
    setPhone(driver.phone || '');
    setNotes(driver.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      if (editingDriver) {
        const updatedData = {
          name: name.trim().toUpperCase(),
          phone: phone.trim(),
          notes: notes.trim()
        };
        setDrivers((prev) => prev.map((d) => (d.id === editingDriver.id ? { ...d, ...updatedData } : d)));
        await DriverService.update(editingDriver.id, updatedData);
        showToast(`Driver ${name} updated successfully`, 'success');
      } else {
        const newDriver = await DriverService.create({
          name: name.trim().toUpperCase(),
          phone: phone.trim(),
          notes: notes.trim(),
          isActive: true
        });
        setDrivers((prev) => [...prev, newDriver]);
        showToast(`Driver ${name} added successfully`, 'success');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showToast('Error saving driver', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (driver: Driver) => {
    setDrivers((prev) => prev.map((d) => (d.id === driver.id ? { ...d, isActive: !driver.isActive } : d)));
    await DriverService.toggleActive(driver.id, driver.isActive);
    showToast(`Driver ${driver.name} is now ${driver.isActive ? 'Inactive' : 'Active'}`, 'info');
  };

  const handleDeleteDriver = async (driver: Driver) => {
    if (window.confirm(`Are you sure you want to permanently delete driver "${driver.name}"?`)) {
      setDrivers((prev) => prev.filter((d) => d.id !== driver.id));
      await DriverService.delete(driver.id);
      showToast(`Driver ${driver.name} deleted`, 'info');
    }
  };

  return (
    <div className="page-container">
      <div className="page-toolbar">
        <div className="page-title-group">
          <h2 className="page-title">Driver Fleet Management</h2>
          <span className="page-title-badge">{drivers.length} DRIVERS</span>
        </div>

        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} />
          ADD DRIVER
        </button>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '220px' }}>Driver Name</th>
              <th style={{ width: '200px' }}>Mobile Phone</th>
              <th style={{ width: '130px' }}>Status</th>
              <th>Operational Notes</th>
              <th style={{ width: '140px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((driver) => (
              <tr key={driver.id} style={{ opacity: driver.isActive ? 1 : 0.6 }}>
                <td style={{ fontWeight: 700, fontSize: '13px' }}>
                  {driver.name}
                </td>
                <td>
                  {driver.phone ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={13} color="var(--color-primary)" />
                      {driver.phone}
                    </span>
                  ) : '—'}
                </td>
                <td>
                  <span className={`status-badge ${driver.isActive ? 'status-completed' : 'status-cancelled'}`}>
                    {driver.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{driver.notes || '—'}</td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <button
                      className="btn-icon"
                      title="Edit Driver"
                      onClick={() => openEditModal(driver)}
                    >
                      <Edit size={13} />
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '11px', padding: '3px 8px' }}
                      onClick={() => handleToggleActive(driver)}
                      title={driver.isActive ? 'Deactivate Driver' : 'Activate Driver'}
                    >
                      {driver.isActive ? (
                        <span style={{ color: 'var(--color-danger)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <XCircle size={12} /> Deactivate
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-success)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={12} /> Activate
                        </span>
                      )}
                    </button>
                    {isAdmin && (
                      <button
                        className="btn-icon"
                        title="Delete Driver"
                        style={{ color: 'var(--color-danger)' }}
                        onClick={() => handleDeleteDriver(driver)}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingDriver ? `Edit Driver: ${editingDriver.name}` : 'Add New Driver'}
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
                  <label className="form-label">Driver Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. MOHAMMED"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mobile Phone Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="+973 3900 1122"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Operational Notes / License info</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Airport permit, languages spoken, etc."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={saving}
                >
                  <Save size={15} />
                  {saving ? 'Saving...' : editingDriver ? 'Update Driver' : 'Add Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
