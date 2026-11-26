const request = require('supertest');
const app = require('../server.js');
const db = require('../db.js');

jest.setTimeout(30000);

describe('Admin User Denial & Deactivation Lifecycle Tests', () => {
    const testCompany = 'Status Test Corp ' + Date.now();
    let companyId = '';
    const adminUser = 'admin_status_' + Date.now();
    const targetUser = 'crew_status_' + Date.now();
    const testPassword = 'Password123!';

    beforeAll(async () => {
        // Register an Admin who creates the company
        const signupAdminRes = await request(app).post('/api/signup').send({
            username: adminUser,
            password: testPassword,
            fullname: 'Admin Status Tester',
            company: testCompany,
            role: 'admin',
            email: 'admin_status@example.com',
            cellphone: '555-0100',
            isNewCompany: true
        });
        expect(signupAdminRes.statusCode).toBe(200);
        expect(signupAdminRes.body.success).toBe(true);
        companyId = signupAdminRes.body.companyId;
        expect(companyId).toBeTruthy();

        // Register a Crew user who joins this company via companyId
        const signupCrewRes = await request(app).post('/api/signup').send({
            username: targetUser,
            password: testPassword,
            fullname: 'Target Crew Worker',
            companyId: companyId,
            role: 'crew',
            email: 'target_crew@example.com',
            cellphone: '555-0200',
            isNewCompany: false
        });
        expect(signupCrewRes.statusCode).toBe(200);
        expect(signupCrewRes.body.success).toBe(true);
    });

    test('1. Newly signed-up user is in pendingUsers, not yet denied or active', async () => {
        const res = await request(app).get(`/api/admin/company-data?company=${encodeURIComponent(testCompany)}`);
        expect(res.statusCode).toBe(200);

        const pending = res.body.pendingUsers.find(u => u.username.toLowerCase() === targetUser.toLowerCase());
        expect(pending).toBeDefined();

        // Login attempt while pending should be rejected with 403
        const loginRes = await request(app).post('/api/login').send({
            username: targetUser,
            password: testPassword
        });
        expect(loginRes.statusCode).toBe(403);
        expect(loginRes.body.message).toMatch(/pending approval/i);
    });

    test('2. Admin denies user via POST /api/admin/deny-user', async () => {
        const denyRes = await request(app).post('/api/admin/deny-user').send({
            username: targetUser
        });
        expect(denyRes.statusCode).toBe(200);
        expect(denyRes.body.success).toBe(true);
        expect(denyRes.body.active).toBe(false);

        // Fetch company-data: user MUST NOT be in pendingUsers
        const dataRes = await request(app).get(`/api/admin/company-data?company=${encodeURIComponent(testCompany)}`);
        expect(dataRes.statusCode).toBe(200);

        const pending = dataRes.body.pendingUsers.find(u => u.username.toLowerCase() === targetUser.toLowerCase());
        expect(pending).toBeUndefined();

        // User MUST be in employees table with active: false, denied: true, deactivated: true
        const emp = dataRes.body.employees.find(u => u.username.toLowerCase() === targetUser.toLowerCase());
        expect(emp).toBeDefined();
        expect(emp.active).toBe(false);
        expect(emp.denied).toBe(true);
        expect(emp.deactivated).toBe(true);
        expect(emp.approved).toBe(false);

        // Denied user MUST NOT be able to log in
        const loginRes = await request(app).post('/api/login').send({
            username: targetUser,
            password: testPassword
        });
        expect(loginRes.statusCode).toBe(403);
        expect(loginRes.body.message).toMatch(/denied/i);
    });

    test('3. Admin activates previously denied user via POST /api/admin/toggle-user-status', async () => {
        const activateRes = await request(app).post('/api/admin/toggle-user-status').send({
            username: targetUser,
            active: true
        });
        expect(activateRes.statusCode).toBe(200);
        expect(activateRes.body.success).toBe(true);
        expect(activateRes.body.active).toBe(true);

        // Verify status in company-data
        const dataRes = await request(app).get(`/api/admin/company-data?company=${encodeURIComponent(testCompany)}`);
        expect(dataRes.statusCode).toBe(200);

        const emp = dataRes.body.employees.find(u => u.username.toLowerCase() === targetUser.toLowerCase());
        expect(emp).toBeDefined();
        expect(emp.active).toBe(true);
        expect(emp.denied).toBe(false);
        expect(emp.deactivated).toBe(false);
        expect(emp.approved).toBe(true);

        // User CAN now log in
        const loginRes = await request(app).post('/api/login').send({
            username: targetUser,
            password: testPassword
        });
        expect(loginRes.statusCode).toBe(200);
        expect(loginRes.body.success).toBe(true);
        expect(loginRes.body.username).toBe(targetUser);
    });

    test('4. Admin deactivates active user via POST /api/admin/toggle-user-status', async () => {
        const deactRes = await request(app).post('/api/admin/toggle-user-status').send({
            username: targetUser,
            active: false
        });
        expect(deactRes.statusCode).toBe(200);
        expect(deactRes.body.success).toBe(true);
        expect(deactRes.body.active).toBe(false);

        // Verify status in company-data
        const dataRes = await request(app).get(`/api/admin/company-data?company=${encodeURIComponent(testCompany)}`);
        expect(dataRes.statusCode).toBe(200);

        const emp = dataRes.body.employees.find(u => u.username.toLowerCase() === targetUser.toLowerCase());
        expect(emp).toBeDefined();
        expect(emp.active).toBe(false);
        expect(emp.deactivated).toBe(true);

        // Deactivated user MUST NOT be able to log in
        const loginRes = await request(app).post('/api/login').send({
            username: targetUser,
            password: testPassword
        });
        expect(loginRes.statusCode).toBe(403);
        expect(loginRes.body.message).toMatch(/deactivated/i);
    });
});
