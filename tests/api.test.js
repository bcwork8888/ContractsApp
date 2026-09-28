const request = require('supertest');
const app = require('../server.js');
const db = require('../db.js');

jest.setTimeout(30000);

describe('FieldSync / CCC Contracts API Test Suite', () => {
    let testUsername = 'alice'; // Using existing seed user
    let testPassword = 'password123';
    let testFolderId = null;
    let testToken = null;

    describe('1. System & Health Check Endpoints', () => {
        test('GET /api/health - should return database health status', async () => {
            const res = await request(app).get('/api/health');
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('connected');
            expect(res.body).toHaveProperty('mode');
        });

        test('GET /api/companies - should return list of unique companies', async () => {
            const res = await request(app).get('/api/companies');
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });

    describe('2. User Authentication & Registration', () => {
        test('POST /api/signup - should handle new user registration', async () => {
            const newUsername = `testuser_${Date.now()}`;
            const res = await request(app)
                .post('/api/signup')
                .send({
                    username: newUsername,
                    password: 'password123',
                    fullname: 'Test User',
                    company: 'Demo Company',
                    role: 'admin'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });

        test('POST /api/login - should authenticate existing user', async () => {
            const res = await request(app)
                .post('/api/login')
                .send({
                    username: testUsername,
                    password: testPassword
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.username.toLowerCase()).toBe(testUsername.toLowerCase());
        });

        test('POST /api/login - should reject invalid credentials', async () => {
            const res = await request(app)
                .post('/api/login')
                .send({
                    username: testUsername,
                    password: 'invalid_password_xyz'
                });

            expect(res.statusCode).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });

    describe('3. Project / Folder Management', () => {
        test('POST /api/add-folder - should create a new project folder', async () => {
            const res = await request(app)
                .post('/api/add-folder')
                .send({
                    username: testUsername,
                    projectName: 'Jest Test Project',
                    workingAddress: '123 Main St',
                    customerName: 'John Doe',
                    customerPhone: '555-0199',
                    customerBillingAddress: '123 Main St',
                    customerEmail: 'johndoe@example.com'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('id');
            testFolderId = res.body.id;
        });

        test('GET /api/folders - should return project list for user', async () => {
            const res = await request(app)
                .get(`/api/folders?username=${testUsername}`);

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });

        test('POST /api/edit-folder - should update project information', async () => {
            if (!testFolderId) return;

            const res = await request(app)
                .post('/api/edit-folder')
                .send({
                    folderId: testFolderId,
                    projectName: 'Updated Jest Project',
                    workingAddress: '456 Updated St',
                    customerName: 'John Doe',
                    customerPhone: '555-0199',
                    customerBillingAddress: '456 Updated St'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });

        test('POST /api/project/update-status - should update project status', async () => {
            if (!testFolderId) return;

            const res = await request(app)
                .post('/api/project/update-status')
                .send({
                    folderId: testFolderId,
                    status: 'In-Porgress'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });

        test('POST /api/project/update-payment-status - should update payment status', async () => {
            if (!testFolderId) return;

            const res = await request(app)
                .post('/api/project/update-payment-status')
                .send({
                    folderId: testFolderId,
                    paymentStatus: 'Deposit Paid'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('4. Contract Generation & Digital Signatures', () => {
        test('POST /api/add-contract - should create a contract with Sign Later token', async () => {
            if (!testFolderId) return;

            const res = await request(app)
                .post('/api/add-contract')
                .send({
                    username: testUsername,
                    folderId: testFolderId,
                    contractData: {
                        customer: 'John Doe',
                        seller: testUsername,
                        price: 3500,
                        date: '2026-09-28',
                        template: 'company_default',
                        email: 'johndoe@example.com',
                        signLater: true,
                        items: [{ description: 'Roof Installation', qty: 1, rate: 3500 }]
                    }
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });

        test('GET /api/contract-by-token - should fetch contract details via token', async () => {
            if (!testFolderId) return;

            const data = await db.getData();
            const user = data.users.find(u => u.username.toLowerCase() === testUsername.toLowerCase());
            if (!user || !user.folders) return;

            const folder = user.folders.find(f => f.id == testFolderId);
            if (!folder || !folder.contracts || folder.contracts.length === 0) return;

            const contract = folder.contracts[0];
            testToken = contract.signatureToken;

            if (testToken) {
                const res = await request(app).get(`/api/contract-by-token?token=${testToken}`);
                expect(res.statusCode).toBe(200);
                expect(res.body.success).toBe(true);
            }
        });

        test('GET /api/preview-pdf - should return PDF binary stream', async () => {
            const res = await request(app)
                .get(`/api/preview-pdf?company=Demo&customer=John+Doe&seller=${testUsername}&price=3500&date=2026-09-28&projectName=Test`);

            expect(res.statusCode).toBe(200);
            expect(res.headers['content-type']).toContain('application/pdf');
        });
    });

    describe('5. Notes & Field Documentation', () => {
        test('POST /api/add-note - should add field note to project', async () => {
            if (!testFolderId) return;

            const res = await request(app)
                .post('/api/add-note')
                .send({
                    username: testUsername,
                    folderId: testFolderId,
                    noteContent: 'Completed initial site inspection.',
                    price: 500,
                    photos: []
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
});
