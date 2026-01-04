import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, User, UserPlus, Save, Check } from 'lucide-react';
import { IRISH_COUNTIES, KERALA_DISTRICTS, PROFESSIONS, FEES, PAYMENT_METHODS } from '../constants';

const AttendeeForm = ({ group, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        paid: false,
        totalFee: 0,
        paymentMethod: 'Cash',
        attendees: [
            {
                id: Date.now(),
                name: '',
                type: 'adult',
                arrived: false,
                profession: '',
                irishCounty: '',
                keralaDistrict: '',
                eircode: '',
                addressKerala: '',
                whatsapp: '',
                mobile: '',
                email: ''
            }
        ]
    });

    useEffect(() => {
        if (group) {
            setFormData(group);
        } else {
            // Auto-calculate initial fee for new groups
            setFormData(prev => ({ ...prev, totalFee: calculateTotalFor(prev.attendees) }));
        }
    }, [group]);

    const calculateTotalFor = (attendeeList) => {
        const adults = attendeeList.filter(a => a.type === 'adult').length;
        const kids = attendeeList.filter(a => a.type === 'child').length;
        return (adults * FEES.ADULT) + (kids * FEES.CHILD);
    };

    const addMember = (type) => {
        const newMember = {
            id: Date.now(),
            name: '',
            type,
            arrived: false,
            profession: '',
            irishCounty: '',
            keralaDistrict: '',
            eircode: '',
            addressKerala: '',
            whatsapp: '',
            mobile: '',
            email: ''
        };

        setFormData(prev => {
            const newList = [...prev.attendees, newMember];
            return {
                ...prev,
                attendees: newList,
                // Only auto-update fee if user hasn't started manually editing? 
                // Let's just auto-update it here to keep it simple, they can still change it.
                totalFee: calculateTotalFor(newList)
            };
        });
    };

    const removeMember = (id) => {
        setFormData(prev => {
            const newList = prev.attendees.filter(a => a.id !== id);
            return {
                ...prev,
                attendees: newList,
                totalFee: calculateTotalFor(newList)
            };
        });
    };

    const updateMember = (id, field, value) => {
        setFormData(prev => ({
            ...prev,
            attendees: prev.attendees.map(a => a.id === id ? { ...a, [field]: value } : a)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const leadName = formData.attendees[0]?.name || 'Unknown';
        onSave({
            ...formData,
            name: leadName,
            adultsCount: formData.attendees.filter(a => a.type === 'adult').length,
            kidsCount: formData.attendees.filter(a => a.type === 'child').length
        });
    };

    return (
        <div className="modal-overlay">
            <div className="glass-panel modal-content animate-fade">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2>{group ? 'Edit Attendee Group' : 'Add New Attendee Group'}</h2>
                    <button className="btn btn-outline" onClick={onClose} style={{ padding: '0.5rem' }}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <button type="button" className="btn btn-outline" onClick={() => addMember('adult')}>
                                <UserPlus size={18} /> Add Adult
                            </button>
                            <button type="button" className="btn btn-outline" onClick={() => addMember('child')}>
                                <Plus size={18} /> Add Child
                            </button>
                        </div>

                        {formData.attendees.map((member, index) => (
                            <div key={member.id} className="form-section">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {member.type === 'adult' ? <User size={18} /> : <Plus size={18} />}
                                        {member.type.charAt(0).toUpperCase() + member.type.slice(1)} {
                                            formData.attendees
                                                .filter((a, i) => a.type === member.type && i <= index)
                                                .length
                                        }
                                    </h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={member.arrived}
                                                onChange={(e) => updateMember(member.id, 'arrived', e.target.checked)}
                                            />
                                            Arrived
                                        </label>
                                        {formData.attendees.length > 1 && (
                                            <button type="button" className="btn btn-outline" onClick={() => removeMember(member.id)} style={{ color: 'var(--error)', borderColor: 'var(--error)', padding: '0.25rem' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="form-grid">
                                    <div className="field-group">
                                        <label>Full Name</label>
                                        <input
                                            className="input"
                                            value={member.name}
                                            onChange={(e) => updateMember(member.id, 'name', e.target.value)}
                                            placeholder="Enter name"
                                            required
                                        />
                                    </div>

                                    {member.type === 'adult' && (
                                        <>
                                            <div className="field-group">
                                                <label>Profession</label>
                                                <select
                                                    className="input"
                                                    value={member.profession}
                                                    onChange={(e) => updateMember(member.id, 'profession', e.target.value)}
                                                >
                                                    <option value="">Select Profession</option>
                                                    {PROFESSIONS.map(p => <option key={p} value={p}>{p}</option>)}
                                                </select>
                                            </div>
                                            <div className="field-group">
                                                <label>Irish County</label>
                                                <select
                                                    className="input"
                                                    value={member.irishCounty || ''}
                                                    onChange={(e) => updateMember(member.id, 'irishCounty', e.target.value)}
                                                >
                                                    <option value="">Select County</option>
                                                    {IRISH_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                            <div className="field-group">
                                                <label>Kerala District</label>
                                                <select
                                                    className="input"
                                                    value={member.keralaDistrict || ''}
                                                    onChange={(e) => updateMember(member.id, 'keralaDistrict', e.target.value)}
                                                >
                                                    <option value="">Select District</option>
                                                    {KERALA_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                                                </select>
                                            </div>
                                            <div className="field-group">
                                                <label>Eircode</label>
                                                <input
                                                    className="input"
                                                    value={member.eircode}
                                                    onChange={(e) => updateMember(member.id, 'eircode', e.target.value)}
                                                    placeholder="e.g. D01 X123"
                                                />
                                            </div>
                                            <div className="field-group">
                                                <label>WhatsApp</label>
                                                <input
                                                    className="input"
                                                    value={member.whatsapp}
                                                    onChange={(e) => updateMember(member.id, 'whatsapp', e.target.value)}
                                                    placeholder="WhatsApp number"
                                                />
                                            </div>
                                            <div className="field-group">
                                                <label>Mobile</label>
                                                <input
                                                    className="input"
                                                    value={member.mobile}
                                                    onChange={(e) => updateMember(member.id, 'mobile', e.target.value)}
                                                    placeholder="Mobile number"
                                                />
                                            </div>
                                            <div className="field-group" style={{ gridColumn: '1 / -1' }}>
                                                <label>Email Address</label>
                                                <input
                                                    className="input"
                                                    type="email"
                                                    value={member.email}
                                                    onChange={(e) => updateMember(member.id, 'email', e.target.value)}
                                                    placeholder="email@example.com"
                                                />
                                            </div>
                                            <div className="field-group" style={{ gridColumn: '1 / -1' }}>
                                                <label>Address in Kerala</label>
                                                <textarea
                                                    className="input"
                                                    rows="2"
                                                    value={member.addressKerala || ''}
                                                    onChange={(e) => updateMember(member.id, 'addressKerala', e.target.value)}
                                                    placeholder="House name, City, etc."
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <div className="form-grid" style={{ marginBottom: '1.5rem' }}>
                            <div className="field-group">
                                <label>Payment Amount (€)</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={formData.totalFee}
                                    onChange={(e) => setFormData(prev => ({ ...prev, totalFee: parseFloat(e.target.value) || 0 }))}
                                />
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                    Standard calculation: €{calculateTotalFor(formData.attendees)}
                                </p>
                            </div>
                            <div className="field-group">
                                <label>Payment Method</label>
                                <select
                                    className="input"
                                    value={formData.paymentMethod}
                                    onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                                >
                                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div className="field-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '1.5rem' }}>
                                <input
                                    type="checkbox"
                                    id="paid"
                                    style={{ width: '22px', height: '22px' }}
                                    checked={formData.paid}
                                    onChange={(e) => setFormData(prev => ({ ...prev, paid: e.target.checked }))}
                                />
                                <label htmlFor="paid" style={{ color: 'var(--text)', fontSize: '1rem', cursor: 'pointer' }}>Mark as Paid</label>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn btn-primary">
                                <Save size={18} /> {group ? 'Update Registration' : 'Complete Registration'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AttendeeForm;
