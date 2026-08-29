import React, { useState, useEffect } from 'react';
import { Plus, Edit, CheckCircle, XCircle, Phone, X, Save, Trash2, User } from 'lucide-react';
import type { Driver } from '../../types';
import { DriverService } from '../../services/drivers/driverService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const DriversPage: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    return DriverService.subscribe(setDrivers);
  }, []);

  const openAddModal = () => {
    setEditingDriver(null);
    setName('');
    setPhone('');
    setNotes('');
    setConfirmDelete(false);
    setIsModalOpen(true);
  };

  const openEditModal = (driver: Driver) => {
    setEditingDriver(driver);
    setName(driver.name);
    setPhone(driver.phone || '');
    setNotes(driver.notes || '');
    setConfirmDelete(false);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Please enter driver name', 'error');
      return;
    }

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
        showToast(`Driver ${name.trim().toUpperCase()} updated successfully`, 'success');
      } else {
        const newDriver = await DriverService.create({
          name: name.trim().toUpperCase(),
          phone: phone.trim(),
          notes: notes.trim(),
          isActive: true
        });
        setDrivers((prev) => [...prev, newDriver]);
        showToast(`Driver ${name.trim().toUpperCase()} added successfully`, 'success');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showToast('Error saving driver: ' + (err.message || ''), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (driver: Driver, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDrivers((prev) => prev.map((d) => (d.id === driver.id ? { ...d, isActive: !driver.isActive } : d)));
    await DriverService.toggleActive(driver.id, driver.isActive);
    showToast(`Driver ${driver.name} is now ${driver.isActive ? 'Inactive' : 'Active'}`, 'info');
  };

  const handleModalDelete = async () => {
    if (!isAdmin) {
      showToast('Action restricted: Only Administrators can delete drivers.', 'error');
      return;
    }
    if (!editingDriver) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    try {
      setDrivers((prev) => prev.filter((d) => d.id !== editingDriver.id));
      await DriverService.delete(editingDriver.id);
      showToast(`Driver ${editingDriver.name} deleted successfully`, 'info');
      setIsModalOpen(false);
    } catch (err: any) {
      showToast('Error deleting driver: ' + (err.message || ''), 'error');
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
          <span>ADD DRIVER</span>
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
              <tr 
                key={driver.id} 
                style={{ opacity: driver.isActive ? 1 : 0.6, cursor: 'pointer' }}
                onClick={() => openEditModal(driver)}
              >
                <td style={{ fontWeight: 700, fontSize: '13px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <User size={14} color="var(--color-primary)" />
                    {driver.name}
                  </span>
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
                <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn-icon"
                      title="Edit Driver"
                      onClick={() => openEditModal(driver)}
                    >
                      <Edit size={13} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '11px', padding: '3px 8px' }}
                      onClick={(e) => handleToggleActive(driver, e)}
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
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Driver Name *</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    className="form-input"
                    placeholder="e.g. MOHAMMED"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ textTransform: 'uppercase', fontWeight: 700 }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Mobile Phone Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="+973 3900 1122"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Operational Notes / License Info</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Airport permit, languages spoken, etc."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  {isAdmin && editingDriver && (
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
                    <span>{saving ? 'Saving...' : editingDriver ? 'Update Driver' : 'Add Driver'}</span>
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
