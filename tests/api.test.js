const request = require('supertest');
const app = require('../server.js');
const db = require('../db.js');

jest.setTimeout(30000);

describe('FieldSync / CCC Contracts API Test Suite', () => {
    let testUsername = 'alice'; // Using existing seed user
    let testPassword = 'password123';
    let testFolderId = null;
    let testToken = null;

    beforeAll(async () => {
        const data = await db.getData();
        if (!data.companies) data.companies = {};
        if (!data.companies['demo company']) {
            data.companies['demo company'] = {
                companyId: 'CID-DEMO01',
                officialName: 'Demo Company',
                logo: './logo.JPG',
                nameCard: '',
                tier: 'standard'
            };
        }
        if (!data.users) data.users = [];
        let aliceUser = data.users.find(u => u.username.toLowerCase() === 'alice');
        if (!aliceUser) {
            aliceUser = {
                username: 'alice',
                password: 'password123',
                fullname: 'Alice Seed',
                company: 'Demo Company',
                companyId: 'CID-DEMO01',
                role: 'manager',
                approved: true,
                email: 'alice@example.com',
                cellphone: '123-456-7890',
                folders: []
            };
            data.users.push(aliceUser);
        } else {
            aliceUser.password = 'password123';
            aliceUser.approved = true;
            aliceUser.company = 'Demo Company';
            aliceUser.companyId = 'CID-DEMO01';
            aliceUser.active = true;
            aliceUser.deactivated = false;
        }
        await db.saveData(data);
    });

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

        test('POST /api/signup - saves email and phone number and renders on admin People grid as pending', async () => {
            const pendingEmpUser = `pending_emp_${Date.now()}`;
            const testEmail = `emp_${Date.now()}@testbuild.com`;
            const testPhone = '555-223-9988';

            const signupRes = await request(app).post('/api/signup').send({
                username: pendingEmpUser,
                password: 'password123',
                fullname: 'Pending Employee Person',
                companyId: companyId,
                role: 'crew',
                email: testEmail,
                cellphone: testPhone
            });
            expect(signupRes.statusCode).toBe(200);
            expect(signupRes.body.success).toBe(true);
            expect(signupRes.body.pendingApproval).toBe(true);

            // Fetch admin company-data and verify employee grid contains user with contact details
            const compRes = await request(app).get(`/api/admin/company-data?company=${encodeURIComponent(testCompany)}`);
            expect(compRes.statusCode).toBe(200);

            // 1. Employee list on People grid
            const foundInEmployees = compRes.body.employees.find(e => e.username === pendingEmpUser);
            expect(foundInEmployees).toBeDefined();
            expect(foundInEmployees.fullname).toBe('Pending Employee Person');
            expect(foundInEmployees.email).toBe(testEmail);
            expect(foundInEmployees.cellphone).toBe(testPhone);
            expect(foundInEmployees.approved).toBe(false);

            // 2. Pending list
            const foundInPending = compRes.body.pendingUsers.find(u => u.username === pendingEmpUser);
            expect(foundInPending).toBeDefined();
            expect(foundInPending.email).toBe(testEmail);
            expect(foundInPending.cellphone).toBe(testPhone);
        });
    });

    describe('Payment Processing & Remaining Balance Calculation', () => {
        let paymentTestFolderId;
        const paymentUsername = 'alice';

        beforeAll(async () => {
            // Create a dedicated folder for payment testing
            const folderRes = await request(app)
                .post('/api/add-folder')
                .send({
                    username: paymentUsername,
                    projectName: 'Payment Math Verification Project',
                    workingAddress: '789 Balance Way',
                    customerName: 'Payment Customer',
                    customerPhone: '555-8888',
                    customerBillingAddress: '789 Balance Way',
                    customerEmail: 'payment.cust@example.com'
                });
            expect(folderRes.statusCode).toBe(200);
            paymentTestFolderId = folderRes.body.id;

            // Add an active contract with price 5000
            await request(app)
                .post('/api/add-contract')
                .send({
                    username: paymentUsername,
                    folderId: paymentTestFolderId,
                    contractData: {
                        customer: 'Payment Customer',
                        seller: paymentUsername,
                        price: 5000,
                        date: '2026-11-25',
                        template: 'company_default',
                        email: 'payment.cust@example.com',
                        items: [{ description: 'Main Project Scope', qty: 1, rate: 5000 }]
                    }
                });
        });

        test('POST /api/add-payment - validation checks for required fields and invalid folder', async () => {
            // Missing required fields
            const missingRes = await request(app)
                .post('/api/add-payment')
                .send({
                    username: paymentUsername,
                    folderId: paymentTestFolderId,
                    amount: 500
                    // missing date, method
                });
            expect(missingRes.statusCode).toBe(400);
            expect(missingRes.body.success).toBe(false);

            // Invalid folderId
            const notFoundRes = await request(app)
                .post('/api/add-payment')
                .send({
                    username: paymentUsername,
                    folderId: 999999999999,
                    amount: 500,
                    date: '2026-11-25',
                    method: 'Check'
                });
            expect(notFoundRes.statusCode).toBe(404);
            expect(notFoundRes.body.success).toBe(false);
        });

        test('POST /api/add-payment - records payment and correctly subtracts from Remaining Balance', async () => {
            // 1. Add first payment of $1,500
            const payRes1 = await request(app)
                .post('/api/add-payment')
                .send({
                    username: paymentUsername,
                    folderId: paymentTestFolderId,
                    amount: 1500,
                    date: '2026-11-25',
                    method: 'Check',
                    notes: 'Initial deposit check #101'
                });
            expect(payRes1.statusCode).toBe(200);
            expect(payRes1.body.success).toBe(true);
            expect(payRes1.body.payment.amount).toBe(1500);

            // Fetch folder and verify payments array
            const folderRes1 = await request(app).get(`/api/folder?id=${paymentTestFolderId}`);
            expect(folderRes1.statusCode).toBe(200);
            const folder1 = folderRes1.body.folder;
            expect(folder1.payments).toHaveLength(1);
            expect(folder1.payments[0].amount).toBe(1500);

            // Verify Remaining Balance math: Contract Price (5000) - Payments (1500) = 3500
            const activeContractsTotal = (folder1.contracts || [])
                .filter(c => !c.void)
                .reduce((sum, c) => sum + parseFloat(c.price || 0), 0);
            const totalPayments = (folder1.payments || []).reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
            const remainingBalance = Math.max(0, activeContractsTotal - totalPayments);
            expect(activeContractsTotal).toBe(5000);
            expect(totalPayments).toBe(1500);
            expect(remainingBalance).toBe(3500);

            // 2. Add second payment of $3,500 with depositPaidFull = true
            const payRes2 = await request(app)
                .post('/api/add-payment')
                .send({
                    username: paymentUsername,
                    folderId: paymentTestFolderId,
                    amount: 3500,
                    date: '2026-11-26',
                    method: 'Credit Card',
                    depositPaidFull: true,
                    notes: 'Final balance paid in full'
                });
            expect(payRes2.statusCode).toBe(200);
            expect(payRes2.body.success).toBe(true);

            // Fetch updated folder
            const folderRes2 = await request(app).get(`/api/folder?id=${paymentTestFolderId}`);
            expect(folderRes2.statusCode).toBe(200);
            const folder2 = folderRes2.body.folder;
            expect(folder2.payments).toHaveLength(2);
            expect(folder2.paymentStatus).toBe('Paid in Full');

            const totalPaymentsFinal = (folder2.payments || []).reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
            const finalRemainingBalance = Math.max(0, activeContractsTotal - totalPaymentsFinal);
            expect(totalPaymentsFinal).toBe(5000);
            expect(finalRemainingBalance).toBe(0);
        });
    });

    describe('Note Replies for Crew and Managers', () => {
        const timestamp = Date.now();
        const mgrUser = `notemgr_${timestamp}`;
        const crewUser = `notecrew_${timestamp}`;
        const companyName = `NoteCo_${timestamp}`;
        let companyId;
        let folderId;
        let noteId;

        test('Setup: Create Admin, Company, Manager, and Crew User', async () => {
            const adminUser = `noteadmin_${timestamp}`;
            const adminRes = await request(app).post('/api/signup').send({
                username: adminUser,
                password: 'password123',
                fullname: 'Note Admin',
                company: companyName,
                role: 'admin',
                email: `admin_${timestamp}@example.com`
            });
            expect(adminRes.statusCode).toBe(200);
            companyId = adminRes.body.companyId;
            expect(companyId).toBeDefined();

            // Register manager
            const mgrRes = await request(app).post('/api/signup').send({
                username: mgrUser,
                password: 'password123',
                fullname: 'Note Manager',
                companyId: companyId,
                role: 'manager',
                email: `mgr_${timestamp}@example.com`
            });
            expect(mgrRes.statusCode).toBe(200);

            // Register crew
            const crewRes = await request(app).post('/api/signup').send({
                username: crewUser,
                password: 'password123',
                fullname: 'Note Crew Worker',
                companyId: companyId,
                role: 'crew',
                cellphone: '555-9090'
            });
            expect(crewRes.statusCode).toBe(200);

            // Admin approves both
            await request(app).post('/api/admin/approve-user').send({ username: mgrUser });
            await request(app).post('/api/admin/approve-user').send({ username: crewUser });
        });

        test('Manager creates a project assigned to crew and adds a note', async () => {
            // Manager creates folder
            const folderRes = await request(app).post('/api/add-folder').send({
                username: mgrUser,
                projectName: 'Crew Note Project',
                workingAddress: '100 Main St',
                customerName: 'Jane Customer',
                customerPhone: '555-1111',
                customerBillingAddress: '100 Main St',
                customerEmail: 'jane@example.com'
            });
            expect(folderRes.statusCode).toBe(200);
            expect(folderRes.body.id).toBeDefined();
            folderId = folderRes.body.id;

            // Assign crew to folder
            const assignRes = await request(app).post('/api/manager/reassign-project-crews').send({
                username: mgrUser,
                folderId: folderId,
                crews: [crewUser]
            });
            expect(assignRes.statusCode).toBe(200);

            // Add note as manager
            const noteRes = await request(app).post('/api/add-note').send({
                username: mgrUser,
                folderId: folderId,
                noteContent: 'Initial site preparation required.',
                price: '150.00'
            });
            expect(noteRes.statusCode).toBe(200);

            // Verify folder notes contains the note
            const checkRes = await request(app).get(`/api/folder?id=${folderId}`);
            expect(checkRes.statusCode).toBe(200);
            expect(checkRes.body.folder.notes).toHaveLength(1);
            noteId = checkRes.body.folder.notes[0].id;
            expect(checkRes.body.folder.notes[0].content).toBe('Initial site preparation required.');
            expect(checkRes.body.folder.notes[0].replies || []).toEqual([]);
        });

        test('Crew user fetches folder and sees the note', async () => {
            // Crew fetches their assigned folders
            const crewFoldersRes = await request(app).get(`/api/folders?username=${crewUser}`);
            expect(crewFoldersRes.statusCode).toBe(200);
            const assignedFolder = crewFoldersRes.body.find(f => String(f.id) === String(folderId));
            expect(assignedFolder).toBeDefined();
            expect(assignedFolder.notes).toHaveLength(1);
            expect(assignedFolder.notes[0].id).toBe(noteId);

            // Crew fetches direct folder by ID
            const directRes = await request(app).get(`/api/folder?id=${folderId}`);
            expect(directRes.statusCode).toBe(200);
            expect(directRes.body.folder.notes).toHaveLength(1);
        });

        test('POST /api/add-reply - crew user can reply to the note', async () => {
            const replyRes = await request(app).post('/api/add-reply').send({
                username: crewUser,
                folderId: folderId,
                noteId: noteId,
                replyContent: 'Materials have been ordered and will arrive Monday.'
            });

            expect(replyRes.statusCode).toBe(200);
            expect(replyRes.body.success).toBe(true);
            expect(replyRes.body.reply).toBeDefined();
            expect(replyRes.body.reply.username).toBe(crewUser);
            expect(replyRes.body.reply.fullname).toBe('Note Crew Worker');
            expect(replyRes.body.reply.role).toBe('crew');
            expect(replyRes.body.reply.content).toBe('Materials have been ordered and will arrive Monday.');
            expect(replyRes.body.replies).toHaveLength(1);
        });

        test('Manager replies to the note and crew can see all replies', async () => {
            // Manager adds a follow-up reply
            const mgrReplyRes = await request(app).post('/api/add-reply').send({
                username: mgrUser,
                folderId: folderId,
                noteId: noteId,
                replyContent: 'Great, thanks for the update. Ensure permits are on site.'
            });
            expect(mgrReplyRes.statusCode).toBe(200);
            expect(mgrReplyRes.body.success).toBe(true);
            expect(mgrReplyRes.body.replies).toHaveLength(2);

            // Crew user queries via /api/folder?id=...
            const crewViewFolder = await request(app).get(`/api/folder?id=${folderId}`);
            expect(crewViewFolder.statusCode).toBe(200);
            const notes = crewViewFolder.body.folder.notes;
            expect(notes).toHaveLength(1);
            const replies = notes[0].replies;
            expect(replies).toHaveLength(2);

            // Check reply 1 (crew)
            expect(replies[0].username).toBe(crewUser);
            expect(replies[0].role).toBe('crew');
            expect(replies[0].content).toBe('Materials have been ordered and will arrive Monday.');

            // Check reply 2 (manager)
            expect(replies[1].username).toBe(mgrUser);
            expect(replies[1].role).toBe('manager');
            expect(replies[1].content).toBe('Great, thanks for the update. Ensure permits are on site.');

            // Crew user also sees all replies via /api/folders?username=...
            const crewFoldersRes = await request(app).get(`/api/folders?username=${crewUser}`);
            expect(crewFoldersRes.statusCode).toBe(200);
            const crewFolder = crewFoldersRes.body.find(f => String(f.id) === String(folderId));
            expect(crewFolder.notes[0].replies).toHaveLength(2);
        });

        test('POST /api/add-reply - validation checks', async () => {
            // Missing parameters
            const badRes1 = await request(app).post('/api/add-reply').send({
                username: crewUser,
                noteId: noteId
            });
            expect(badRes1.statusCode).toBe(400);

            // Nonexistent note
            const badRes2 = await request(app).post('/api/add-reply').send({
                username: crewUser,
                noteId: 'nonexistent_999999',
                replyContent: 'Hello'
            });
            expect(badRes2.statusCode).toBe(404);
        });
    });
});
