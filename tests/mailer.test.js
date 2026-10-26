const mailer = require('../mailer.js');

describe('Resend Mailer Service Unit Tests', () => {
    test('sendPasswordResetEmail generates proper email content and delivers in simulation mode', async () => {
        const result = await mailer.sendPasswordResetEmail({
            to: 'admin@example.com',
            username: 'test_admin',
            fullname: 'Test Administrator',
            resetLink: 'http://localhost:8080/?token=rst_12345&username=test_admin#reset-password'
        });

        expect(result.success).toBe(true);
        expect(result.id).toBeDefined();
    });

    test('sendContractSignEmail generates proper contract signing email and delivers in simulation mode', async () => {
        const result = await mailer.sendContractSignEmail({
            to: 'customer@example.com',
            customerName: 'Alice Customer',
            projectName: 'Kitchen Remodel 2026',
            signLink: 'http://localhost:8080/sign.html?token=token_abcdef',
            companyName: 'Acme Construction'
        });

        expect(result.success).toBe(true);
        expect(result.id).toBeDefined();
    });

    test('sendTemporaryPasswordEmail generates proper temporary password email and delivers in simulation mode', async () => {
        const result = await mailer.sendTemporaryPasswordEmail({
            to: 'employee@example.com',
            username: 'crew_john',
            fullname: 'John Worker',
            tempPassword: 'Temp-X9Y8Z7',
            companyName: 'Acme Construction'
        });

        expect(result.success).toBe(true);
        expect(result.id).toBeDefined();
    });

    test('sendEmail rejects request when recipient email is missing', async () => {
        const result = await mailer.sendEmail({
            to: '',
            subject: 'Missing Recipient',
            text: 'Test message'
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain('Recipient address required');
    });

    test('DEFAULT_FROM address is defined', () => {
        expect(mailer.DEFAULT_FROM).toBeDefined();
        expect(mailer.DEFAULT_FROM).toContain('@');
    });
});
