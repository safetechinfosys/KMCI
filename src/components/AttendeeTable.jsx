import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, Edit3, Trash2, Download, Upload, Filter } from 'lucide-react';

const AttendeeTable = ({ groups, onEdit, onDelete, onExport, onImport }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [arrivalFilter, setArrivalFilter] = useState('all');
    const [sortField, setSortField] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [expandedId, setExpandedId] = useState(null);

    const handleSort = (field) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const filteredGroups = groups.filter(group => {
        const matchesSearch =
            group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            group.attendees.some(a =>
                a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (a.profession && a.profession.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (a.mobile && a.mobile.includes(searchTerm))
            );

        const matchesPayment = paymentFilter === 'all' ||
            (paymentFilter === 'paid' ? group.paid : !group.paid);

        const matchesArrival = arrivalFilter === 'all' ||
            (arrivalFilter === 'arrived' ? group.attendees.every(a => a.arrived) : !group.attendees.every(a => a.arrived));

        return matchesSearch && matchesPayment && matchesArrival;
    }).sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        // String comparison for name
        if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    return (
        <div className="glass-panel animate-fade" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flex: 1, minWidth: '300px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            className="input"
                            style={{ paddingLeft: '40px' }}
                            placeholder="Search by name, profession, phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <select className="input" style={{ width: 'auto' }} value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
                            <option value="all">Payment (All)</option>
                            <option value="paid">Paid</option>
                            <option value="unpaid">Unpaid</option>
                        </select>
                        <select className="input" style={{ width: 'auto' }} value={arrivalFilter} onChange={(e) => setArrivalFilter(e.target.value)}>
                            <option value="all">Arrival (All)</option>
                            <option value="arrived">Full Arrival</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-outline" onClick={onExport}>
                        <Download size={18} /> Export CSV
                    </button>
                    <button className="btn btn-outline" onClick={onImport}>
                        <Upload size={18} /> Import CSV
                    </button>
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                                Lead Name {sortField === 'name' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                            </th>
                            <th>Group Members</th>
                            <th onClick={() => handleSort('totalFee')} style={{ cursor: 'pointer' }}>
                                Fee {sortField === 'totalFee' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                            </th>
                            <th>Status</th>
                            <th>Arrival</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredGroups.map(group => (
                            <React.Fragment key={group.id}>
                                <tr>
                                    <td data-label="Lead Name" style={{ fontWeight: '600' }}>{group.name}</td>
                                    <td data-label="Members">
                                        <span className="badge" style={{ background: 'var(--surface-light)', color: 'var(--text)' }}>
                                            {group.adultsCount}A / {group.kidsCount}C
                                        </span>
                                    </td>
                                    <td data-label="Fee" style={{ fontWeight: '700', color: 'var(--primary)' }}>€{group.totalFee}</td>
                                    <td data-label="Status">
                                        <span className={`badge ${group.paid ? 'badge-success' : 'badge-error'}`}>
                                            {group.paid ? 'Paid' : 'Unpaid'}
                                        </span>
                                    </td>
                                    <td data-label="Arrival">
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            {group.attendees.map((a, i) => (
                                                <div
                                                    key={i}
                                                    title={a.name}
                                                    style={{
                                                        width: '10px',
                                                        height: '10px',
                                                        borderRadius: '50%',
                                                        background: a.arrived ? 'var(--success)' : 'var(--border)'
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </td>
                                    <td data-label="Actions">
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn btn-outline" style={{ padding: '0.4rem' }} onClick={() => setExpandedId(expandedId === group.id ? null : group.id)}>
                                                <Filter size={16} />
                                            </button>
                                            <button className="btn btn-outline" style={{ padding: '0.4rem' }} onClick={() => onEdit(group)}>
                                                <Edit3 size={16} />
                                            </button>
                                            <button className="btn btn-outline" style={{ padding: '0.4rem', color: 'var(--error)' }} onClick={() => onDelete(group.id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                {expandedId === group.id && (
                                    <tr>
                                        <td colSpan="6" style={{ background: 'rgba(255,255,255,0.01)', padding: '0' }}>
                                            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                                                {group.attendees.map((attendee, idx) => (
                                                    <div key={idx} className="glass-panel" style={{ padding: '1rem', border: '1px solid var(--border)' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                            <span style={{ fontWeight: '700' }}>{attendee.name}</span>
                                                            <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>{attendee.type}</span>
                                                        </div>
                                                        {attendee.type === 'adult' && (
                                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                                {attendee.profession && <div>💼 {attendee.profession}</div>}
                                                                {attendee.irishCounty && <div>🇮🇪 {attendee.irishCounty}</div>}
                                                                {attendee.whatsapp && <div>💬 {attendee.whatsapp}</div>}
                                                                {attendee.email && <div>✉️ {attendee.email}</div>}
                                                                <div>📍 {attendee.arrived ? '✅ Arrived' : '⏳ Not arrived'}</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                        {filteredGroups.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                    No attendees found matching your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AttendeeTable;
