import Dexie from 'dexie';

export const db = new Dexie('EventManagementDB');

db.version(1).stores({
  groups: '++id, name, paid, createdAt',
  attendees: '++id, groupId, name, type, arrived, profession, irishCounty, keralaDistrict, email, whatsapp, mobile'
});

export default db;
