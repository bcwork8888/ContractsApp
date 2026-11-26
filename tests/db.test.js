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

    test('formatUserFullname & parseUserFullname - should serialize and deserialize resetPasswordToken & resetPasswordExpires', () => {
        const token = 'rst_1795665348184_test';
        const expires = Date.now() + 3600000;
        const serialized = db.formatUserFullname('Alice Admin', 'alice@example.com', '555-1234', token, expires);
        expect(serialized).toContain('Alice Admin');
        expect(serialized).toContain('email=alice%40example.com');
        expect(serialized).toContain('phone=555-1234');
        expect(serialized).toContain(`resetToken=${token}`);
        expect(serialized).toContain(`resetExpires=${expires}`);

        const parsed = db.parseUserFullname(serialized);
        expect(parsed.fullname).toBe('Alice Admin');
        expect(parsed.email).toBe('alice@example.com');
        expect(parsed.cellphone).toBe('555-1234');
        expect(parsed.resetPasswordToken).toBe(token);
        expect(parsed.resetPasswordExpires).toBe(expires);

        // Cleared reset token
        const clearedSerialized = db.formatUserFullname('Alice Admin', 'alice@example.com', '555-1234', null, null);
        expect(clearedSerialized).not.toContain('resetToken');
        expect(clearedSerialized).not.toContain('resetExpires');
        const clearedParsed = db.parseUserFullname(clearedSerialized);
        expect(clearedParsed.resetPasswordToken).toBeNull();
        expect(clearedParsed.resetPasswordExpires).toBeNull();
    });
});
