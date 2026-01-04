import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Stats from './components/Stats';
import AttendeeTable from './components/AttendeeTable';
import AttendeeForm from './components/AttendeeForm';
import { LayoutDashboard, PlusCircle, LogOut } from 'lucide-react';
import { API_URL } from './constants';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [groups, setGroups] = useState([]);
  const [attendees, setAttendees] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);

  useEffect(() => {
    const session = localStorage.getItem('eventSession');
    if (session) setIsLoggedIn(true);

    loadData();
    // Real-time update: Poll API every 5 seconds
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch(`${API_URL}?action=get_all`);
      const data = await response.json();

      if (data.groups && data.attendees) {
        const groupsWithAttendees = data.groups.map(group => ({
          ...group,
          id: parseInt(group.id),
          totalFee: parseFloat(group.total_fee),
          paid: Boolean(parseInt(group.paid)),
          paymentMethod: group.payment_method,
          adultsCount: parseInt(group.adults_count),
          kidsCount: parseInt(group.kids_count),
          attendees: data.attendees
            .filter(a => parseInt(a.group_id) === parseInt(group.id))
            .map(a => ({
              ...a,
              id: parseInt(a.id),
              groupId: parseInt(a.group_id),
              arrived: Boolean(parseInt(a.arrived)),
              irishCounty: a.irish_county,
              keralaDistrict: a.kerala_district,
              addressKerala: a.address_kerala
            }))
        }));
        setGroups(groupsWithAttendees);
        setAttendees(data.attendees.map(a => ({ ...a, arrived: Boolean(parseInt(a.arrived)) })));
      }
    } catch (err) {
      console.error("Failed to load data from MySQL:", err);
    }
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    localStorage.setItem('eventSession', 'active');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('eventSession');
  };

  const handleSaveGroup = async (formData) => {
    try {
      const response = await fetch(`${API_URL}?action=save_group`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result = await response.json();
      if (result.success) {
        setIsFormOpen(false);
        setEditingGroup(null);
        loadData();
      } else {
        alert("Error saving: " + result.error);
      }
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  const handleDeleteGroup = async (id) => {
    if (!confirm('Are you sure you want to delete this group?')) return;
    try {
      await fetch(`${API_URL}&action=delete&id=${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Group Name', 'Group Fee', 'Paid Status', 'Member Name', 'Type', 'Arrived',
      'Profession', 'Irish County', 'Kerala District', 'Eircode', 'WhatsApp', 'Mobile', 'Email'
    ].join(',');

    const rows = groups.flatMap(group =>
      group.attendees.map(a => [
        `"${group.name}"`,
        group.totalFee,
        group.paid ? 'Paid' : 'Unpaid',
        `"${a.name}"`,
        a.type,
        a.arrived ? 'Yes' : 'No',
        `"${a.profession || ''}"`,
        `"${a.irishCounty || ''}"`,
        `"${a.keralaDistrict || ''}"`,
        `"${a.eircode || ''}"`,
        `"${a.whatsapp || ''}"`,
        `"${a.mobile || ''}"`,
        `"${a.email || ''}"`
      ].join(','))
    );

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `event_attendees_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n');

        // Skip empty lines
        const dataLines = lines.filter(line => line.trim().length > 0);

        for (let i = 0; i < dataLines.length; i++) {
          const line = dataLines[i];
          // Try to parse both CSV and standard "Name: X Adults" format
          let name = '', adults = 1, kids = 0, isPaid = false;

          if (line.includes(':') || line.includes('Adult')) {
            // Format: "Janeesh : 2 Adults" or "Shoukkathali: 2 Adults and 2 Kids ✅🅿️"
            const parts = line.split(':');
            name = parts[0].replace(/^\d+\.\s*/, '').trim(); // Remove "1. " numbering

            const details = parts[1] || '';
            const adultMatch = details.match(/(\d+)\s*Adult/i);
            const kidMatch = details.match(/(\d+)\s*Kid/i);

            adults = adultMatch ? parseInt(adultMatch[1]) : 1;
            kids = kidMatch ? parseInt(kidMatch[1]) : 0;
            isPaid = details.includes('✅🅿️') || details.toLowerCase().includes('paid');
          } else {
            // Simple CSV format: Name, Adults, Kids, Paid
            const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim());
            if (cols.length < 2) continue;
            name = cols[0];
            adults = parseInt(cols[1]) || 1;
            kids = parseInt(cols[2]) || 0;
            isPaid = cols[3]?.toLowerCase() === 'paid' || cols[3]?.includes('✅🅿️');
          }

          if (!name) continue;

          // Create attendee list based on counts
          const attendeeList = [];
          for (let a = 0; a < adults; a++) {
            attendeeList.push({ name: a === 0 ? name : `${name} (Adult ${a + 1})`, type: 'adult', arrived: false });
          }
          for (let k = 0; k < kids; k++) {
            attendeeList.push({ name: `${name} (Kid ${k + 1})`, type: 'child', arrived: false });
          }

          // Save to MySQL
          await handleSaveGroup({
            name,
            paid: isPaid,
            totalFee: (adults * 8) + (kids * 5), // Default calculation
            paymentMethod: 'Cash',
            attendees: attendeeList
          });
        }

        alert('Import successful!');
        loadData();
      } catch (err) {
        console.error(err);
        alert('Error importing data. Please check the format.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="container">
      <input
        type="file"
        id="csvImport"
        accept=".csv"
        style={{ display: 'none' }}
        onChange={handleImportCSV}
      />

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'var(--primary)', padding: '0.75rem', borderRadius: '12px' }}>
            <LayoutDashboard size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem' }}>Event Dashboard</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Overview & management</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-primary" onClick={() => { setEditingGroup(null); setIsFormOpen(true); }}>
            <PlusCircle size={18} /> Add New Group
          </button>
          <button className="btn btn-outline" onClick={handleLogout}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>

      <Stats groups={groups} attendees={attendees} />

      <AttendeeTable
        groups={groups}
        onEdit={(g) => { setEditingGroup(g); setIsFormOpen(true); }}
        onDelete={handleDeleteGroup}
        onExport={handleExportCSV}
        onImport={() => document.getElementById('csvImport').click()}
      />

      {isFormOpen && (
        <AttendeeForm
          group={editingGroup}
          onClose={() => setIsFormOpen(false)}
          onSave={handleSaveGroup}
        />
      )}

      <footer style={{ marginTop: '4rem', padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', borderTop: '1px solid var(--border)' }}>
        <p>&copy; 2024 SafeTech Event Management System.</p>
        <p style={{ marginTop: '0.5rem', opacity: 0.8 }}>
          Built with <strong>React</strong> & <strong>DexieDB</strong> (Standalone Browser Database).
          <br /> All data is stored locally in your browser for privacy and speed.
        </p>
      </footer>
    </div>
  );
}

export default App;
