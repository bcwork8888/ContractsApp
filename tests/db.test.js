const db = require('../db.js');

describe('Data Layer Unit Tests (db.js)', () => {
    test('readLocalData - should return valid data structure', () => {
        const localData = db.readLocalData();
        expect(localData).toHaveProperty('users');
        expect(Array.isArray(localData.users)).toBe(true);
    });

    test('getData - should retrieve users and companies structure', async () => {
        const data = await db.getData();
        expect(data).toHaveProperty('users');
        expect(data).toHaveProperty('companies');
        expect(Array.isArray(data.users)).toBe(true);
    });

    test('testConnection - should return connection diagnostic result', async () => {
        const status = await db.testConnection();
        expect(status).toHaveProperty('connected');
        expect(status).toHaveProperty('mode');
        expect(typeof status.connected).toBe('boolean');
    });
});
