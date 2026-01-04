import React, { useState, useEffect } from 'react';
import { db } from './db';
import Login from './components/Login';
import Stats from './components/Stats';
import AttendeeTable from './components/AttendeeTable';
import AttendeeForm from './components/AttendeeForm';
import { LayoutDashboard, PlusCircle, LogOut } from 'lucide-react';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [groups, setGroups] = useState([]);
  const [attendees, setAttendees] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);

  useEffect(() => {
    // Check local storage for session
    const session = localStorage.getItem('eventSession');
    if (session) setIsLoggedIn(true);

    loadData();
  }, []);

  const loadData = async () => {
    const allGroups = await db.groups.toArray();
    const allAttendees = await db.attendees.toArray();

    // Attach attendees to groups for easier rendering
    const groupsWithAttendees = allGroups.map(group => ({
      ...group,
      attendees: allAttendees.filter(a => a.groupId === group.id)
    }));

    setGroups(groupsWithAttendees);
    setAttendees(allAttendees);
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
    const { attendees: memberList, ...groupData } = formData;

    let groupId;
    if (groupData.id) {
      // Update existing
      await db.groups.update(groupData.id, {
        name: groupData.name,
        adultsCount: groupData.adultsCount,
        kidsCount: groupData.kidsCount,
        totalFee: groupData.totalFee,
        paid: groupData.paid
      });
      groupId = groupData.id;
      // Simple strategy: delete existing attendees for this group and re-add
      await db.attendees.where('groupId').equals(groupId).delete();
    } else {
      // Create new
      groupId = await db.groups.add({
        ...groupData,
        createdAt: new Date()
      });
    }

    // Add attendees
    const attendeesToSave = memberList.map(a => {
      const { id, ...rest } = a; // Strip temporary client side IDs
      return { ...rest, groupId };
    });

    await db.attendees.bulkAdd(attendeesToSave);

    setIsFormOpen(false);
    setEditingGroup(null);
    loadData();
  };

  const handleDeleteGroup = async (id) => {
    if (confirm('Are you sure you want to delete this group?')) {
      await db.groups.delete(id);
      await db.attendees.where('groupId').equals(id).delete();
      loadData();
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
        const headers = lines[0].split(',');

        // Group by group name to rebuild groups
        const groupsToCreate = {};

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;

          // Simple CSV parser (doesn't handle commas in quotes perfectly, but sufficient for this schema)
          const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, ''));

          const [groupName, fee, paidStatus, memberName, type, arrived, profession, irishCounty, keralaDistrict, eircode, whatsapp, mobile, email] = cols;

          if (!groupsToCreate[groupName]) {
            groupsToCreate[groupName] = {
              name: groupName,
              totalFee: parseFloat(fee) || 0,
              paid: paidStatus === 'Paid',
              createdAt: new Date(),
              attendees: []
            };
          }

          groupsToCreate[groupName].attendees.push({
            name: memberName,
            type: type || 'adult',
            arrived: arrived === 'Yes',
            profession,
            irishCounty,
            keralaDistrict,
            eircode,
            whatsapp,
            mobile,
            email
          });
        }

        // Save to DB
        for (const gName in groupsToCreate) {
          const g = groupsToCreate[gName];
          const groupId = await db.groups.add({
            name: g.name,
            totalFee: g.totalFee,
            paid: g.paid,
            createdAt: g.createdAt,
            adultsCount: g.attendees.filter(a => a.type === 'adult').length,
            kidsCount: g.attendees.filter(a => a.type === 'child').length
          });

          const attendeesToSave = g.attendees.map(a => ({ ...a, groupId }));
          await db.attendees.bulkAdd(attendeesToSave);
        }

        alert('Import successful!');
        loadData();
      } catch (err) {
        console.error(err);
        alert('Error importing CSV. Please check the file format.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
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
