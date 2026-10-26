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
        test('POST /api/signup - should reject admin registration without email', async () => {
            const res = await request(app)
                .post('/api/signup')
                .send({
                    username: `admin_no_email_${Date.now()}`,
                    password: 'password123',
                    fullname: 'Admin No Email',
                    company: 'Demo Company',
                    role: 'admin'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/email is mandatory/i);
        });

        test('POST /api/signup - should reject manager registration without either email or cellphone', async () => {
            const res = await request(app)
                .post('/api/signup')
                .send({
                    username: `manager_no_contact_${Date.now()}`,
                    password: 'password123',
                    fullname: 'Manager No Contact',
                    company: 'Demo Company',
                    role: 'manager'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/either email or cell phone is mandatory/i);
        });

        test('POST /api/signup - should reject crew registration without either email or cellphone', async () => {
            const res = await request(app)
                .post('/api/signup')
                .send({
                    username: `crew_no_contact_${Date.now()}`,
                    password: 'password123',
                    fullname: 'Crew No Contact',
                    company: 'Demo Company',
                    role: 'crew'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/either email or cell phone is mandatory/i);
        });

        test('POST /api/signup - should handle new admin registration with email', async () => {
            const newUsername = `testuser_${Date.now()}`;
            const res = await request(app)
                .post('/api/signup')
                .send({
                    username: newUsername,
                    password: 'password123',
                    fullname: 'Test User',
                    company: `Demo Company ${Date.now()}`,
                    role: 'admin',
                    email: 'admin@example.com',
                    cellphone: '123-456-7890'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });

        test('POST /api/signup - should handle manager registration with email only', async () => {
            const res = await request(app)
                .post('/api/signup')
                .send({
                    username: `mgr_email_${Date.now()}`,
                    password: 'password123',
                    fullname: 'Manager Email Only',
                    company: 'Demo Company',
                    role: 'manager',
                    email: 'manager@example.com'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.pendingApproval).toBe(true);
        });

        test('POST /api/signup - should handle crew registration with cellphone only', async () => {
            const res = await request(app)
                .post('/api/signup')
                .send({
                    username: `crew_phone_${Date.now()}`,
                    password: 'password123',
                    fullname: 'Crew Phone Only',
                    company: 'Demo Company',
                    role: 'crew',
                    cellphone: '987-654-3210'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.pendingApproval).toBe(true);
        });

        test('POST /api/signup - Admin creates a new company and receives a Company ID', async () => {
            const uniqueCompName = `Acme Build ${Date.now()}`;
            const adminUser = `admin_${Date.now()}`;
            const res = await request(app)
                .post('/api/signup')
                .send({
                    username: adminUser,
                    password: 'password123',
                    fullname: 'Acme Admin',
                    company: uniqueCompName,
                    role: 'admin',
                    email: `${adminUser}@example.com`,
                    isNewCompany: true
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.companyId).toBeDefined();
            expect(res.body.companyId).toMatch(/^CID-[A-Z0-9]{6}$/);

            const loginRes = await request(app)
                .post('/api/login')
                .send({ username: adminUser, password: 'password123' });
            expect(loginRes.statusCode).toBe(200);
            expect(loginRes.body.companyId).toBe(res.body.companyId);
        });

        test('POST /api/signup - Second Admin and Crew join using existing Company ID', async () => {
            // First create a new company with an admin
            const companyName = `Delta Corp ${Date.now()}`;
            const admin1 = `delta_admin1_${Date.now()}`;
            const compRes = await request(app)
                .post('/api/signup')
                .send({
                    username: admin1,
                    password: 'password123',
                    fullname: 'Delta Admin 1',
                    company: companyName,
                    role: 'admin',
                    email: `${admin1}@example.com`,
                    isNewCompany: true
                });
            const companyId = compRes.body.companyId;
            expect(companyId).toBeDefined();

            // 1. Second Admin joins with Company ID
            const admin2 = `delta_admin2_${Date.now()}`;
            const admin2Res = await request(app)
                .post('/api/signup')
                .send({
                    username: admin2,
                    password: 'password123',
                    fullname: 'Delta Admin 2',
                    companyId: companyId,
                    role: 'admin',
                    email: `${admin2}@example.com`,
                    isNewCompany: false
                });
            expect(admin2Res.statusCode).toBe(200);
            expect(admin2Res.body.success).toBe(true);
            expect(admin2Res.body.companyId).toBe(companyId);

            // 2. Crew joins with Company ID
            const crew1 = `delta_crew1_${Date.now()}`;
            const crew1Res = await request(app)
                .post('/api/signup')
                .send({
                    username: crew1,
                    password: 'password123',
                    fullname: 'Delta Crew 1',
                    companyId: companyId,
                    role: 'crew',
                    cellphone: '555-123-4567',
                    isNewCompany: false
                });
            expect(crew1Res.statusCode).toBe(200);
            expect(crew1Res.body.success).toBe(true);
            expect(crew1Res.body.companyId).toBe(companyId);
            expect(crew1Res.body.pendingApproval).toBe(true);
        });

        test('POST /api/signup - Reject registration with invalid Company ID', async () => {
            const crewInvalid = `invalid_crew_${Date.now()}`;
            const res = await request(app)
                .post('/api/signup')
                .send({
                    username: crewInvalid,
                    password: 'password123',
                    fullname: 'Invalid Crew',
                    companyId: 'CID-NONEXISTENT999',
                    role: 'crew',
                    cellphone: '555-999-0000',
                    isNewCompany: false
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/invalid company id/i);
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

        test('POST /api/project/update-status - should update status to Terminated with terminationDoc and generate Termination Doc PDF', async () => {
            if (!testFolderId) return;

            const mockSig = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
            const termRes = await request(app)
                .post('/api/project/update-status')
                .send({
                    folderId: testFolderId,
                    status: 'Terminated',
                    terminationDoc: {
                        text: 'Customer requested cancellation due to material supply delays.',
                        reason: 'Customer requested cancellation due to material supply delays.',
                        signature: mockSig,
                        date: '2026-10-24',
                        dateTime: '2026-10-24 17:15',
                        timestamp: Date.now()
                    }
                });

            expect(termRes.statusCode).toBe(200);
            expect(termRes.body.success).toBe(true);

            // Verify folder reflects Terminated status and terminationDoc
            const foldersRes = await request(app).get(`/api/folders?username=${testUsername}`);
            expect(foldersRes.statusCode).toBe(200);
            const foundFolder = foldersRes.body.find(f => String(f.id) === String(testFolderId));
            expect(foundFolder).toBeDefined();
            expect(foundFolder.status).toBe('Terminated');
            expect(foundFolder.terminationDoc).toBeDefined();
            expect(foundFolder.terminationDoc.reason).toBe('Customer requested cancellation due to material supply delays.');

            // Verify Termination Doc PDF endpoint returns valid PDF
            const pdfRes = await request(app).get(`/api/view-pdf?folderId=${testFolderId}&termination=true`);
            expect(pdfRes.statusCode).toBe(200);
            expect(pdfRes.headers['content-type']).toContain('application/pdf');
            expect(pdfRes.headers['content-disposition']).toContain('Termination_Doc');
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

    describe('6. Password Reset Functionality', () => {
        let adminUser = `admin_pwd_${Date.now()}`;
        let crewUser = `crew_pwd_${Date.now()}`;
        let resetToken = '';
        let resetCompany = `Reset Co ${Date.now()}`;

        beforeAll(async () => {
            // Create an admin user with email
            const adminSignupRes = await request(app).post('/api/signup').send({
                username: adminUser,
                password: 'initialPassword1',
                fullname: 'Admin Resetter',
                company: resetCompany,
                role: 'admin',
                email: 'admin.resetter@example.com'
            });

            const companyId = adminSignupRes.body.companyId;

            // Create a crew user in the same company
            await request(app).post('/api/signup').send({
                username: crewUser,
                password: 'crewPassword1',
                fullname: 'Crew Worker',
                companyId: companyId,
                role: 'crew',
                cellphone: '555-1234'
            });
        });

        test('POST /api/request-password-reset - should return 404 for non-existent user', async () => {
            const res = await request(app)
                .post('/api/request-password-reset')
                .send({ username: 'non_existent_user_99999' });

            expect(res.statusCode).toBe(404);
            expect(res.body.success).toBe(false);
        });

        test('POST /api/request-password-reset - for Admin, should send reset link to account email', async () => {
            const res = await request(app)
                .post('/api/request-password-reset')
                .send({ username: adminUser });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.role).toBe('admin');
            expect(res.body.email).toBe('admin.resetter@example.com');
            expect(res.body.resetLink).toBeDefined();

            // Extract token from resetLink
            const url = new URL(res.body.resetLink);
            resetToken = url.searchParams.get('token');
            expect(resetToken).toBeTruthy();
        });

        test('POST /api/reset-password - should reject invalid token', async () => {
            const res = await request(app)
                .post('/api/reset-password')
                .send({
                    username: adminUser,
                    token: 'invalid_token_12345',
                    newPassword: 'brandNewPassword99'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });

        test('POST /api/reset-password - should reset password with valid token and allow login', async () => {
            const res = await request(app)
                .post('/api/reset-password')
                .send({
                    username: adminUser,
                    token: resetToken,
                    newPassword: 'brandNewPassword99'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);

            // Verify login with new password
            const loginRes = await request(app)
                .post('/api/login')
                .send({
                    username: adminUser,
                    password: 'brandNewPassword99'
                });

            expect(loginRes.statusCode).toBe(200);
            expect(loginRes.body.success).toBe(true);
        });

        test('POST /api/request-password-reset - for Crew/Manager, should display admin contact message with email', async () => {
            const res = await request(app)
                .post('/api/request-password-reset')
                .send({ username: crewUser });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.role).toBe('crew');
            expect(res.body.adminEmails).toContain('admin.resetter@example.com');
            expect(res.body.message).toContain('admin.resetter@example.com');
        });
    });

    describe('7. Admin People Management (Active/Deactivate & Admin Password Reset)', () => {
        let adminUser = `admin_people_${Date.now()}`;
        let crewUser = `crew_people_${Date.now()}`;
        let testCompany = `People Co ${Date.now()}`;
        let companyId = null;

        beforeAll(async () => {
            const adminSignupRes = await request(app).post('/api/signup').send({
                username: adminUser,
                password: 'password123',
                fullname: 'Admin People Test',
                company: testCompany,
                role: 'admin',
                email: 'admin.people@example.com'
            });

            companyId = adminSignupRes.body.companyId;

            await request(app).post('/api/signup').send({
                username: crewUser,
                password: 'crewInitialPass1',
                fullname: 'Crew People Test',
                companyId: companyId,
                role: 'crew',
                cellphone: '555-9876'
            });

            // Approve crew user so they are an active company employee
            await request(app).post('/api/admin/approve-user').send({
                username: crewUser
            });
        });

        test('GET /api/admin/company-data - should return employees list with active status and contact info', async () => {
            const res = await request(app).get(`/api/admin/company-data?company=${encodeURIComponent(testCompany)}`);
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body.employees)).toBe(true);

            const foundCrew = res.body.employees.find(e => e.username === crewUser);
            expect(foundCrew).toBeDefined();
            expect(foundCrew.fullname).toBe('Crew People Test');
            expect(foundCrew.role).toBe('crew');
            expect(foundCrew.cellphone).toBe('555-9876');
            expect(foundCrew.active).toBe(true);
        });

        test('POST /api/admin/toggle-user-status - should deactivate user and block login', async () => {
            // Deactivate crew user
            const deactivateRes = await request(app)
                .post('/api/admin/toggle-user-status')
                .send({ username: crewUser, active: false });

            expect(deactivateRes.statusCode).toBe(200);
            expect(deactivateRes.body.success).toBe(true);
            expect(deactivateRes.body.active).toBe(false);

            // Attempt login as deactivated user - should fail with 403
            const loginRes = await request(app)
                .post('/api/login')
                .send({ username: crewUser, password: 'crewInitialPass1' });

            expect(loginRes.statusCode).toBe(403);
            expect(loginRes.body.success).toBe(false);
            expect(loginRes.body.message).toMatch(/deactivated/i);
        });

        test('POST /api/admin/toggle-user-status - should reactivate user and restore login ability', async () => {
            // Reactivate crew user
            const activateRes = await request(app)
                .post('/api/admin/toggle-user-status')
                .send({ username: crewUser, active: true });

            expect(activateRes.statusCode).toBe(200);
            expect(activateRes.body.success).toBe(true);
            expect(activateRes.body.active).toBe(true);

            // Attempt login as activated user - should succeed with 200
            const loginRes = await request(app)
                .post('/api/login')
                .send({ username: crewUser, password: 'crewInitialPass1' });

            expect(loginRes.statusCode).toBe(200);
            expect(loginRes.body.success).toBe(true);
        });

        test('POST /api/admin/reset-user-password - should assign temp password and send to contact', async () => {
            const resetRes = await request(app)
                .post('/api/admin/reset-user-password')
                .send({ username: crewUser });

            expect(resetRes.statusCode).toBe(200);
            expect(resetRes.body.success).toBe(true);
            expect(resetRes.body.tempPassword).toBeDefined();
            expect(resetRes.body.tempPassword).toMatch(/^Temp-[A-Z0-9]{6}$/);
            expect(resetRes.body.channel).toBe('cellphone');
            expect(resetRes.body.destination).toBe('555-9876');

            const tempPass = resetRes.body.tempPassword;

            // Attempt login with temporary password - should succeed
            const loginRes = await request(app)
                .post('/api/login')
                .send({ username: crewUser, password: tempPass });

            expect(loginRes.statusCode).toBe(200);
            expect(loginRes.body.success).toBe(true);
        });

        test('POST /api/admin/deny-user - should remove from pending approvals and place on employee list with inactive status', async () => {
            const deniedCrewUser = `crew_denied_${Date.now()}`;
            
            // 1. Crew registers into company with companyId (starts pending)
            const signupRes = await request(app).post('/api/signup').send({
                username: deniedCrewUser,
                password: 'deniedPass123',
                fullname: 'Denied Crew Candidate',
                companyId: companyId,
                role: 'crew',
                cellphone: '555-4321'
            });
            expect(signupRes.statusCode).toBe(200);
            expect(signupRes.body.pendingApproval).toBe(true);

            // 2. Verify user is in pendingUsers and not on approved employees list
            const beforeDenyRes = await request(app).get(`/api/admin/company-data?company=${encodeURIComponent(testCompany)}`);
            expect(beforeDenyRes.statusCode).toBe(200);
            const pendingCandidate = beforeDenyRes.body.pendingUsers.find(u => u.username === deniedCrewUser);
            expect(pendingCandidate).toBeDefined();

            // 3. Admin denies the user
            const denyRes = await request(app)
                .post('/api/admin/deny-user')
                .send({ username: deniedCrewUser });
            expect(denyRes.statusCode).toBe(200);
            expect(denyRes.body.success).toBe(true);

            // 4. Verify user disappeared from pendingUsers, but is on employees list with active === false
            const afterDenyRes = await request(app).get(`/api/admin/company-data?company=${encodeURIComponent(testCompany)}`);
            expect(afterDenyRes.statusCode).toBe(200);
            
            // Pending list should no longer contain this user
            const pendingAfter = afterDenyRes.body.pendingUsers.find(u => u.username === deniedCrewUser);
            expect(pendingAfter).toBeUndefined();

            // Employee list should contain this user with inactive status
            const employeeAfter = afterDenyRes.body.employees.find(e => e.username === deniedCrewUser);
            expect(employeeAfter).toBeDefined();
            expect(employeeAfter.fullname).toBe('Denied Crew Candidate');
            expect(employeeAfter.active).toBe(false);

            // 5. User should be blocked from logging in
            const loginAttemptRes = await request(app)
                .post('/api/login')
                .send({ username: deniedCrewUser, password: 'deniedPass123' });
            expect(loginAttemptRes.statusCode).toBe(403);
            expect(loginAttemptRes.body.success).toBe(false);

            // 6. Admin can later activate this user from the employee list
            const activateRes = await request(app)
                .post('/api/admin/toggle-user-status')
                .send({ username: deniedCrewUser, active: true });
            expect(activateRes.statusCode).toBe(200);
            expect(activateRes.body.success).toBe(true);
            expect(activateRes.body.active).toBe(true);

            // Now login succeeds
            const finalLoginRes = await request(app)
                .post('/api/login')
                .send({ username: deniedCrewUser, password: 'deniedPass123' });
            expect(finalLoginRes.statusCode).toBe(200);
            expect(finalLoginRes.body.success).toBe(true);
        });
    });
});
