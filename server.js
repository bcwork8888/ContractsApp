const express = require('express');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// Prevent caching during development
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

app.use(express.static('public')); // Serves your HTML/JS

// Logout route redirecting back to home/login
app.get('/logout', (req, res) => {
    res.redirect('/');
});

// API: Health / Database Connection Check
app.get('/api/health', async (req, res) => {
    const status = await db.testConnection();
    res.json(status);
});

const db = require('./db.js');

// Helper to read JSON / Database
const getData = async () => await db.getData();
// Helper to write JSON / Database
const saveData = async (data) => await db.saveData(data);

const STATUS_ORDER = {
    'draft': 0,
    'in-porgress': 1,
    'sent to client': 2,
    'signed': 3,
    'signed_unpaid': 4,
    'terminated': 5,
    'remaining balance': 6,
    'done': 7
};

function sortFolders(folders) {
    return folders.sort((a, b) => {
        const statusA = (a.status || 'Draft').toLowerCase();
        const statusB = (b.status || 'Draft').toLowerCase();
        const orderA = STATUS_ORDER[statusA] !== undefined ? STATUS_ORDER[statusA] : 99;
        const orderB = STATUS_ORDER[statusB] !== undefined ? STATUS_ORDER[statusB] : 99;
        return orderA - orderB;
    });
}

function generateCompanyId(existingCompanies) {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let id = '';
    const existingList = Object.values(existingCompanies || {});
    do {
        id = 'CID-';
        for (let i = 0; i < 6; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    } while (existingList.some(c => c && c.companyId === id));
    return id;
}

function ensureCompanyIds(data) {
    if (!data.companies) data.companies = {};
    let modified = false;
    for (const [key, comp] of Object.entries(data.companies)) {
        if (!comp.companyId) {
            comp.companyId = generateCompanyId(data.companies);
            modified = true;
        }
    }
    if (data.users && Array.isArray(data.users)) {
        for (const user of data.users) {
            if (user.company && !user.companyId) {
                const compKey = user.company.trim().toLowerCase();
                if (data.companies[compKey] && data.companies[compKey].companyId) {
                    user.companyId = data.companies[compKey].companyId;
                    modified = true;
                }
            }
        }
    }
    return modified;
}

// API: Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const data = await getData();
    ensureCompanyIds(data);
    const user = data.users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    
    if (user) {
        if (user.active === false || user.deactivated === true || user.denied === true) {
            return res.status(403).json({ success: false, message: "Your account has been deactivated (inactive). Please contact your company administrator." });
        }
        if (user.approved === false) {
            return res.status(403).json({ success: false, message: "Your account is pending approval by your company administrator." });
        }

        // Find company info
        const companies = data.companies || {};
        const companyKey = user.company ? user.company.toLowerCase() : '';
        const compInfo = companies[companyKey] || {
            officialName: "FieldSync Draft",
            logo: "./logo.JPG",
            nameCard: ""
        };

        res.json({
            success: true,
            username: user.username,
            fullname: user.fullname || user.username,
            company: user.company || '',
            companyId: user.companyId || compInfo.companyId || '',
            role: user.role || 'user',
            folders: user.folders,
            companyOfficialName: compInfo.officialName,
            companyLogo: compInfo.logo,
            companyNameCard: compInfo.nameCard || "",
            companyTier: compInfo.tier || 'standard'
        });
    } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
    }
});

// API: Add Folder
app.post('/api/add-folder', async (req, res) => {
    const { 
        username, 
        projectName, 
        workingAddress, 
        customerName, 
        customerPhone, 
        customerBillingAddress, 
        customerEmail,
        crewsViewContractPayment
    } = req.body;

    if (!username || !projectName || !workingAddress || !customerName || !customerPhone || !customerBillingAddress) {
        return res.status(400).json({ success: false, message: "Missing mandatory fields" });
    }

    const data = await getData();
    const user = data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    const rawFolderName = `${projectName} - ${workingAddress}`;
    const folderName = rawFolderName.replace(/[^a-zA-Z0-9\s_\-]/g, '_');

    const newFolder = { 
        id: Date.now(), 
        name: folderName, 
        projectName,
        workingAddress,
        customerName,
        customerPhone,
        customerBillingAddress,
        customerEmail: customerEmail || "",
        contracts: [], 
        notes: [], 
        status: 'Draft',
        paymentStatus: 'N/A',
        crewsViewContractPayment: !!crewsViewContractPayment
    };

    if (!user.folders) user.folders = [];
    user.folders.push(newFolder);
    await saveData(data);
    res.json(newFolder);
});

// API: Edit Folder
app.post('/api/edit-folder', async (req, res) => {
    const { 
        folderId, 
        projectName, 
        workingAddress, 
        customerName, 
        customerPhone, 
        customerBillingAddress, 
        customerEmail,
        crewsViewContractPayment
    } = req.body;

    if (!folderId || !projectName || !workingAddress || !customerName || !customerPhone || !customerBillingAddress) {
        return res.status(400).json({ success: false, message: "Missing mandatory fields" });
    }

    const data = await getData();
    let folder = null;

    data.users.forEach(u => {
        if (u.folders) {
            const found = u.folders.find(f => f.id == folderId);
            if (found) folder = found;
        }
    });

    if (!folder) {
        return res.status(404).json({ success: false, message: "Project not found" });
    }

    const rawFolderName = `${projectName} - ${workingAddress}`;
    folder.name = rawFolderName.replace(/[^a-zA-Z0-9\s_\-]/g, '_');
    folder.projectName = projectName;
    folder.workingAddress = workingAddress;
    folder.customerName = customerName;
    folder.customerPhone = customerPhone;
    folder.customerBillingAddress = customerBillingAddress;
    folder.customerEmail = customerEmail || "";
    folder.crewsViewContractPayment = !!crewsViewContractPayment;

    await saveData(data);
    res.json({ success: true, folderName: folder.name });
});

// API: Sign Up
app.post('/api/signup', async (req, res) => {
    const { username, password, fullname, company, companyId, isNewCompany, role, email, cellphone } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Username and password are required" });
    }

    const trimmedEmail = (email || '').trim();
    const trimmedCellphone = (cellphone || '').trim();

    if (role === 'admin') {
        if (!trimmedEmail) {
            return res.status(400).json({ success: false, message: "Email is mandatory for Admin role" });
        }
    } else if (role === 'manager' || role === 'crew') {
        if (!trimmedEmail && !trimmedCellphone) {
            return res.status(400).json({ success: false, message: "Either email or cell phone is mandatory for Manager and Crew roles" });
        }
    }

    const data = await getData();

    // Check if user already exists
    const existingUser = data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (existingUser) {
        return res.status(400).json({ success: false, message: "User already exists" });
    }

    ensureCompanyIds(data);

    let assignedCompany = '';
    let assignedCompanyId = '';
    let isPending = false;

    // Determine if creating a new company or joining an existing one
    const isCreatingCompany = Boolean(isNewCompany || (role === 'admin' && company && !companyId));

    if (isCreatingCompany) {
        const trimmedCompany = (company || '').trim();
        if (!trimmedCompany) {
            return res.status(400).json({ success: false, message: "Company name is required" });
        }

        const compKey = trimmedCompany.toLowerCase();
        if (data.companies[compKey]) {
            return res.status(400).json({
                success: false,
                message: "A company with this name already exists. If joining this company, please enter its Company ID."
            });
        }

        const newCompanyId = generateCompanyId(data.companies);
        data.companies[compKey] = {
            companyId: newCompanyId,
            officialName: trimmedCompany,
            logo: "./logo.JPG",
            nameCard: "",
            tier: "standard"
        };

        assignedCompany = trimmedCompany;
        assignedCompanyId = newCompanyId;
        isPending = false;
    } else {
        // Manager, Crew, or Second Admin joining existing company via companyId (or fallback name for tests)
        const inputIdOrName = (companyId || company || '').trim();
        if (!inputIdOrName) {
            return res.status(400).json({
                success: false,
                message: "Company ID is required. Please ask your company administrator for the Company ID."
            });
        }

        let foundComp = null;
        const upperSearch = inputIdOrName.toUpperCase();
        const lowerSearch = inputIdOrName.toLowerCase();

        // 1. Search by Company ID
        for (const comp of Object.values(data.companies || {})) {
            if (comp.companyId && comp.companyId.toUpperCase() === upperSearch) {
                foundComp = comp;
                break;
            }
        }

        // 2. Fallback search by company key or official name
        if (!foundComp) {
            for (const [key, comp] of Object.entries(data.companies || {})) {
                if (key.toLowerCase() === lowerSearch || (comp.officialName && comp.officialName.toLowerCase() === lowerSearch)) {
                    foundComp = comp;
                    break;
                }
            }
        }

        if (!foundComp) {
            return res.status(400).json({
                success: false,
                message: "Invalid Company ID. Please ask your company administrator for the correct Company ID."
            });
        }

        assignedCompany = foundComp.officialName;
        assignedCompanyId = foundComp.companyId;
        isPending = (role === 'manager' || role === 'crew');
    }

    // Create new user object
    const newUser = {
        username,
        password,
        fullname,
        company: assignedCompany,
        companyId: assignedCompanyId,
        role,
        email: trimmedEmail,
        cellphone: trimmedCellphone,
        folders: [],
        approved: !isPending
    };

    data.users.push(newUser);
    await saveData(data);
    res.json({
        success: true,
        companyId: assignedCompanyId,
        companyName: assignedCompany,
        pendingApproval: isPending
    });
});

// API: Request Password Reset
app.post('/api/request-password-reset', async (req, res) => {
    const { username } = req.body;
    if (!username) {
        return res.status(400).json({ success: false, message: "Username is required" });
    }

    const data = await getData();
    const user = data.users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role === 'admin' || user.role === 'super admin') {
        const adminEmail = (user.email || '').trim();
        if (!adminEmail) {
            return res.status(400).json({
                success: false,
                message: "No email address is associated with this Admin account. Please contact system support."
            });
        }

        const token = 'rst_' + Date.now() + '_' + Math.random().toString(36).substring(2, 12);
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + (60 * 60 * 1000); // 1 hour
        await saveData(data);

        const host = req.get('host');
        const protocol = req.protocol;
        const resetLink = `${protocol}://${host}/?token=${token}&username=${encodeURIComponent(user.username)}#reset-password`;

        console.log(`
======================================================================
[MOCK EMAIL SENT - PASSWORD RESET]
To: ${adminEmail}
Subject: FieldSync Password Reset Link
Body: Hello ${user.fullname || user.username},

You requested a password reset for your FieldSync Admin account.
Please click the link below to set a new password:
${resetLink}

This link will expire in 1 hour.
======================================================================
`);

        return res.json({
            success: true,
            role: user.role,
            email: adminEmail,
            resetLink,
            message: `Password reset link sent to ${adminEmail}`
        });
    } else {
        // Crew or Manager
        const companyKey = (user.company || '').trim().toLowerCase();
        const companyAdmins = data.users.filter(u =>
            (u.company || '').trim().toLowerCase() === companyKey &&
            (u.role === 'admin' || u.role === 'super admin')
        );

        const adminDetails = companyAdmins.map(a => ({
            username: a.username,
            fullname: a.fullname || a.username,
            email: (a.email || '').trim()
        }));

        const adminEmails = adminDetails.map(a => a.email).filter(Boolean);

        let message = "Please contact your company administrator to reset your password.";
        if (adminEmails.length > 0) {
            message = `Please contact your company administrator (${adminEmails.join(', ')}) to reset your password.`;
        }

        return res.json({
            success: true,
            role: user.role,
            company: user.company,
            adminDetails,
            adminEmails,
            message
        });
    }
});

// API: Reset Password with Token
app.post('/api/reset-password', async (req, res) => {
    const { username, token, newPassword } = req.body;
    if (!username || !token || !newPassword) {
        return res.status(400).json({ success: false, message: "Username, token, and new password are required" });
    }

    const data = await getData();
    const user = data.users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.resetPasswordToken || user.resetPasswordToken !== token) {
        return res.status(400).json({ success: false, message: "Invalid or expired password reset token" });
    }

    if (user.resetPasswordExpires && Date.now() > user.resetPasswordExpires) {
        return res.status(400).json({ success: false, message: "Password reset token has expired. Please request a new one." });
    }

    user.password = newPassword;
    delete user.resetPasswordToken;
    delete user.resetPasswordExpires;

    await saveData(data);

    res.json({ success: true, message: "Password updated successfully" });
});

// Universal Helper to find a folder across all users
function findFolderById(data, folderId) {
    if (!data || !data.users) return null;
    for (const u of data.users) {
        if (u.folders && Array.isArray(u.folders)) {
            const found = u.folders.find(f => String(f.id) === String(folderId));
            if (found) return { folder: found, owner: u };
        }
    }
    return null;
}

// API: Get single folder by ID
app.get('/api/folder', async (req, res) => {
    const folderId = req.query.id || req.query.folderId;
    if (!folderId) return res.status(400).json({ success: false, message: "Folder ID required" });
    const data = await getData();
    const result = findFolderById(data, folderId);
    if (!result) return res.status(404).json({ success: false, message: "Folder not found" });
    res.json({ success: true, folder: result.folder, owner: result.owner.username });
});

// API: Get user folders with proper role/company scoping
app.get('/api/folders', async (req, res) => {
    const { username } = req.query;
    if (!username) return res.status(400).json({ success: false, message: "Username required" });
    const data = await getData();
    const user = data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role === 'super admin') {
        const allFolders = [];
        data.users.forEach(u => {
            if (u.folders) {
                u.folders.forEach(f => {
                    if (!allFolders.some(existing => String(existing.id) === String(f.id))) {
                        allFolders.push(f);
                    }
                });
            }
        });
        return res.json(sortFolders(allFolders));
    }

    if (user.role === 'admin') {
        const companyFolders = [];
        const companyUsers = data.users.filter(u => u.company && u.company.toLowerCase() === (user.company || '').toLowerCase());
        companyUsers.forEach(u => {
            if (u.folders) {
                u.folders.forEach(f => {
                    if (!companyFolders.some(existing => String(existing.id) === String(f.id))) {
                        companyFolders.push(f);
                    }
                });
            }
        });
        return res.json(sortFolders(companyFolders));
    }

    if (user.role === 'crew') {
        const assignedFolders = [];
        data.users.forEach(u => {
            if (u.folders) {
                u.folders.forEach(f => {
                    const isAssigned = (f.crew && f.crew.toLowerCase() === username.toLowerCase()) || 
                                       (f.crews && f.crews.some(c => c.toLowerCase() === username.toLowerCase()));
                    if (isAssigned && !assignedFolders.some(existing => String(existing.id) === String(f.id))) {
                        assignedFolders.push(f);
                    }
                });
            }
        });
        return res.json(sortFolders(assignedFolders));
    }

    // Default: manager's own folders
    return res.json(sortFolders(user.folders || []));
});

app.post('/api/add-note', async (req, res) => {
    const { username, folderId, noteContent, price, photos, uncontract } = req.body;
    const data = await getData();
    
    const folderResult = findFolderById(data, folderId);
    const folder = folderResult ? folderResult.folder : null;

    if (!folder) {
        return res.status(404).json({ success: false, message: "Folder not found" });
    }

    // Enforce attachment upload validations
    if (photos && Array.isArray(photos)) {
        if (photos.length > 2) {
            return res.status(400).json({ success: false, message: "Maximum of 2 attachments allowed per note." });
        }

        const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB
        const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
        for (const file of photos) {
            const isVideo = file.startsWith('data:video/');
            const base64Str = file.split(',')[1] || '';
            const sizeInBytes = base64Str.length * 0.75;
            
            if (isVideo) {
                if (sizeInBytes > MAX_VIDEO_SIZE) {
                    return res.status(400).json({ success: false, message: "Each video must be smaller than 100MB." });
                }
            } else {
                if (sizeInBytes > MAX_PHOTO_SIZE) {
                    return res.status(400).json({ success: false, message: "Each photo must be smaller than 5MB." });
                }
            }
        }

        let existingPhotosCount = 0;
        if (folder.notes) {
            folder.notes.forEach(n => {
                if (n.photos) existingPhotosCount += n.photos.length;
            });
        }
        if (existingPhotosCount + photos.length > 20) {
            return res.status(400).json({ success: false, message: `Adding these files would exceed the project maximum of 20 attachments (currently has ${existingPhotosCount}).` });
        }
    }

    if (!folder.notes) folder.notes = []; // Ensure array exists
    folder.notes.push({
        id: Date.now(),
        content: noteContent,
        price: price || null,
        uncontract: !!uncontract,
        date: new Date().toLocaleString(),
        photos: photos || []
    });
    await saveData(data);
    res.json({ success: true });
});

// API: Update multiple notes in a project folder
app.post('/api/project/update-notes', async (req, res) => {
    const { folderId, notes } = req.body;
    if (!folderId || !notes || !Array.isArray(notes)) {
        return res.status(400).json({ success: false, message: "Missing required parameters" });
    }

    const data = await getData();
    const folderResult = findFolderById(data, folderId);
    const folder = folderResult ? folderResult.folder : null;

    if (!folder) {
        return res.status(404).json({ success: false, message: "Project not found" });
    }

    if (folder.notes) {
        notes.forEach(updatedNote => {
            const note = folder.notes.find(n => n.id == updatedNote.id);
            if (note) {
                note.content = updatedNote.content;
                note.price = updatedNote.price || null;
                note.modifiedAt = Date.now();
            }
        });
    }

    await saveData(data);
    res.json({ success: true });
});

app.post('/api/add-contract', async (req, res) => {
    const { username, folderId, contractData } = req.body;
    const data = await getData();

    const folderResult = findFolderById(data, folderId);
    const folder = folderResult ? folderResult.folder : null;

    if (folder) {
        if (!folder.contracts) folder.contracts = [];

        if (contractData.voidExisting) {
            folder.contracts.forEach(c => {
                c.void = true;
            });
        }

        const newContract = {
            id: Date.now(),
            customer: contractData.customer,
            seller: contractData.seller,
            price: contractData.price,
            date: contractData.date,
            template: contractData.template,
            phone: contractData.phone || '',
            email: contractData.email || '',
            isChangeOrder: !!contractData.isChangeOrder,
            expirationDate: contractData.expirationDate || '',
            items: contractData.items || []
        };

        if (contractData.signLater) {
            if (!contractData.email) {
                return res.status(400).json({ success: false, message: "Email is required for Sign Later option" });
            }
            const token = 'token_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
            newContract.signatureToken = token;
            newContract.token = token;
            newContract.signature = ''; // empty signature for now
            newContract.signed = false;

            // Update project folder status
            folder.status = "Sent to Client";

            // Log mock email sent
            console.log(`
======================================================================
[MOCK EMAIL SENT]
To: ${contractData.email}
Subject: Sign your contract for project: ${folder.name}
Body: Please sign your contract by clicking this link:
http://localhost:8888/sign.html?token=${token}
======================================================================
`);
        } else {
            newContract.signature = contractData.signature || '';
            newContract.signed = true;
            folder.status = "Signed";
        }

        folder.contracts.push(newContract);
        await saveData(data);
        return res.json({ success: true, contract: newContract });
    }
    res.status(404).json({ success: false, message: "Folder not found" });
});

// API: Add Payment
app.post('/api/add-payment', async (req, res) => {
    const { username, folderId, amount, date, method, notes, depositPaidFull, receipts } = req.body;
    if (!folderId || !amount || !date || !method) {
        return res.status(400).json({ success: false, message: "Missing required parameters" });
    }

    const data = await getData();
    const folderResult = findFolderById(data, folderId);
    const folder = folderResult ? folderResult.folder : null;

    if (!folder) {
        return res.status(404).json({ success: false, message: "Project not found" });
    }

    if (!folder.payments) {
        folder.payments = [];
    }

    const newPayment = {
        id: Date.now(),
        amount: parseFloat(amount),
        date: date,
        method: method,
        depositPaidFull: !!depositPaidFull,
        notes: notes || '',
        receipts: receipts || []
    };

    folder.payments.push(newPayment);
    if (newPayment.depositPaidFull) {
        folder.paymentStatus = 'Paid in Full';
    }
    await saveData(data);
    res.json({ success: true, payment: newPayment });
});


// API: Generate temporary PDF preview from request parameters (unsaved)
app.get('/api/preview-pdf', async (req, res) => {
    const { company, customer, seller, price, date, projectName, items: itemsStr, template, workingAddress, billingAddress } = req.query;
    const data = await getData();
    
    // Fetch company info
    const companies = data.companies || {};
    const companyKey = company ? company.toLowerCase() : '';
    const compInfo = companies[companyKey] || {
        officialName: "FieldSync Draft",
        logo: "./logo.JPG",
        nameCard: ""
    };

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=contract_preview.pdf`);
    doc.pipe(res);

    const useTemplate = template !== 'none';

    if (!useTemplate) {
        doc.fontSize(25).font('Helvetica-Bold').text('OFFICIAL CONTRACT', { align: 'center' });
        doc.moveDown();
        doc.fontSize(14).font('Helvetica').text(`Project: ${projectName || 'Preview Project'}`);
        doc.text(`Date: ${date || ''}`);
        doc.moveDown();

        doc.fontSize(12).text('------------------------------------------');
        doc.text(`Customer Name: ${customer || ''}`);
        doc.text(`Seller Name: ${seller || ''}`);
        doc.text(`Total Price: $${price || '0'}`);
        doc.text('------------------------------------------');

        doc.moveDown();
        doc.text('Terms and Conditions:');
        doc.fontSize(10).text('This is a computer-generated document. All information is pulled directly from the project database.');
    } else {
        // Draw logo
        let logoBuffer = null;
        if (compInfo.logo) {
            try {
                if (compInfo.logo.startsWith('data:')) {
                    const base64Data = compInfo.logo.replace(/^data:image\/\w+;base64,/, "");
                    logoBuffer = Buffer.from(base64Data, 'base64');
                } else {
                    const path = require('path');
                    let resolvedPath = compInfo.logo;
                    if (resolvedPath.startsWith('./')) resolvedPath = resolvedPath.substring(2);
                    const possiblePaths = [
                        path.join(__dirname, 'public', resolvedPath),
                        path.join(__dirname, resolvedPath),
                        compInfo.logo
                    ];
                    for (let p of possiblePaths) {
                        if (fs.existsSync(p)) {
                            logoBuffer = fs.readFileSync(p);
                            break;
                        }
                    }
                }
            } catch (err) {
                console.error("Error loading logo image:", err);
            }
        }

        if (logoBuffer) {
            try {
                doc.image(logoBuffer, 40, 40, { width: 80, height: 80 });
            } catch (err) {
                console.error("PDFKit image rendering error:", err);
                doc.rect(40, 40, 80, 80).stroke('#ccc');
                doc.fontSize(8).text('Logo Error', 45, 75);
            }
        } else {
            doc.rect(40, 40, 80, 80).stroke('#ccc');
            doc.fontSize(8).text('No Logo', 45, 75);
        }

        doc.fillColor('#000000');
        doc.fontSize(16).font('Helvetica-Bold').text(compInfo.officialName, 135, 40);
        doc.fontSize(9).font('Helvetica').fillColor('#4a5568').text(compInfo.nameCard || "", 135, 60, { width: 430, lineGap: 2 });

        doc.moveTo(40, 130).lineTo(572, 130).strokeColor('#e2e8f0').lineWidth(1).stroke();

        doc.fillColor('#718096').fontSize(8).font('Helvetica-Bold').text('RECIPIENT:', 40, 150);
        doc.fillColor('#1a202c').fontSize(14).font('Helvetica-Bold').text(customer || '', 40, 163);
        doc.fillColor('#4a5568').fontSize(9).font('Helvetica').text(`Working Address: ${workingAddress || ''}`, 40, 180, { width: 250 });
        doc.text(`Billing Address: ${billingAddress || ''}`, 40, 195, { width: 250 });

        const boxX = 320;
        const boxY = 150;
        const boxWidth = 252;

        doc.rect(boxX, boxY, boxWidth, 25).fill('#4a5568');
        doc.fillColor('#ffffff').fontSize(12).font('Helvetica-Bold').text('Quote Preview', boxX + 10, boxY + 6);

        doc.rect(boxX, boxY + 25, boxWidth, 25).fill('#ffffff');
        doc.rect(boxX, boxY + 25, boxWidth, 25).stroke('#cbd5e0');
        doc.fillColor('#718096').fontSize(9).font('Helvetica').text('Sent on', boxX + 10, boxY + 33);
        doc.fillColor('#1a202c').fontSize(9).font('Helvetica-Bold').text(date || '', boxX + 10, boxY + 33, { width: boxWidth - 20, align: 'right' });

        doc.rect(boxX, boxY + 50, boxWidth, 30).fill('#718096');
        doc.fillColor('#ffffff').fontSize(12).font('Helvetica-Bold').text('Total', boxX + 10, boxY + 59);
        doc.fillColor('#ffffff').fontSize(12).font('Helvetica-Bold').text(`$${Number(price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, boxX + 10, boxY + 59, { width: boxWidth - 20, align: 'right' });

        const tableY = 250;
        doc.rect(40, tableY, 532, 25).fill('#4a5568');
        doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
        doc.text('Product/Service', 45, tableY + 8);
        doc.text('Description', 165, tableY + 8);
        doc.text('Qty.', 395, tableY + 8);
        doc.text('Unit Price', 445, tableY + 8);
        doc.text('Total', 525, tableY + 8);

        let items = [];
        try {
            if (itemsStr) items = JSON.parse(itemsStr);
        } catch (e) {}

        const rowHeight = 35;
        let currentY = tableY + 25;

        if (items.length > 0) {
            items.forEach((item, index) => {
                doc.rect(40, currentY, 532, rowHeight).stroke('#e2e8f0');
                doc.moveTo(160, currentY).lineTo(160, currentY + rowHeight).stroke('#e2e8f0');
                doc.moveTo(390, currentY).lineTo(390, currentY + rowHeight).stroke('#e2e8f0');
                doc.moveTo(435, currentY).lineTo(435, currentY + rowHeight).stroke('#e2e8f0');
                doc.moveTo(515, currentY).lineTo(515, currentY + rowHeight).stroke('#e2e8f0');

                doc.fillColor('#1a202c').fontSize(9).font('Helvetica');
                doc.text(`Item #${index + 1}`, 45, currentY + 13, { width: 110, height: 20, ellipsis: true });
                doc.text(item.description || '', 165, currentY + 7, { width: 220, height: 25, ellipsis: true });
                doc.text('1', 395, currentY + 13, { width: 35, align: 'center' });
                
                const itemPrice = parseFloat(item.price) || 0;
                doc.text(`$${Number(itemPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 440, currentY + 13, { width: 70, align: 'right' });
                doc.text(`$${Number(itemPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 518, currentY + 13, { width: 50, align: 'right' });

                currentY += rowHeight;
            });
        } else {
            doc.rect(40, currentY, 532, rowHeight).stroke('#e2e8f0');
            doc.moveTo(160, currentY).lineTo(160, currentY + rowHeight).stroke('#e2e8f0');
            doc.moveTo(390, currentY).lineTo(390, currentY + rowHeight).stroke('#e2e8f0');
            doc.moveTo(435, currentY).lineTo(435, currentY + rowHeight).stroke('#e2e8f0');
            doc.moveTo(515, currentY).lineTo(515, currentY + rowHeight).stroke('#e2e8f0');

            doc.fillColor('#1a202c').fontSize(9).font('Helvetica');
            doc.text('1', 395, currentY + 13, { width: 35, align: 'center' });
            doc.text(`$${Number(price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 518, currentY + 13, { width: 50, align: 'right' });

            currentY += rowHeight;
        }

        const totalBoxY = currentY + 15;
        doc.fillColor('#1a202c').fontSize(11).font('Helvetica-Bold').text('Total', 435, totalBoxY + 6);
        doc.rect(490, totalBoxY, 82, 25).stroke('#cbd5e0');
        doc.fontSize(10).font('Helvetica-Bold').text(`$${Number(price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 495, totalBoxY + 8, { width: 72, align: 'right' });

        const footerY = totalBoxY + 60;
        doc.fillColor('#718096').fontSize(9).font('Helvetica').text('This quote is valid for the next 30 days, after which values may be subject to change.', 40, footerY);
    }
    doc.end();
});

// API: Generate PDF for a specific contract
app.get('/api/view-pdf', async (req, res) => {
    const { username, folderId, contractId, termination } = req.query;
    const data = await getData();

    const folderResult = findFolderById(data, folderId);
    if (!folderResult) return res.status(404).send("Folder not found");
    const folder = folderResult.folder;
    const managerUser = folderResult.owner;

    if (termination === 'true') {
        const termDoc = folder.terminationDoc;
        if (!termDoc) return res.status(404).send("Termination document not found");

        const doc = new PDFDocument({ margin: 40 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="Termination_Doc_${folder.id}.pdf"`);
        doc.pipe(res);

        // Fetch company info for branding
        const companies = data.companies || {};
        const companyKey = (managerUser && managerUser.company) ? managerUser.company.toLowerCase() : '';
        const compInfo = companies[companyKey] || {
            officialName: (managerUser && managerUser.company) || "FieldSync",
            logo: "./logo.JPG",
            nameCard: ""
        };

        // Load company logo if available
        let logoBuffer = null;
        if (compInfo.logo) {
            try {
                if (compInfo.logo.startsWith('data:image')) {
                    const base64Data = compInfo.logo.replace(/^data:image\/\w+;base64,/, "");
                    logoBuffer = Buffer.from(base64Data, 'base64');
                } else {
                    const resolvedPath = compInfo.logo.startsWith('./') ? compInfo.logo.slice(2) : compInfo.logo;
                    const possiblePaths = [
                        path.join(__dirname, 'public', resolvedPath),
                        path.join(__dirname, resolvedPath),
                        compInfo.logo
                    ];
                    for (let p of possiblePaths) {
                        if (fs.existsSync(p)) {
                            logoBuffer = fs.readFileSync(p);
                            break;
                        }
                    }
                }
            } catch (err) {
                console.error("Error loading logo image:", err);
            }
        }

        if (logoBuffer) {
            try {
                doc.image(logoBuffer, 40, 40, { width: 80, height: 80 });
            } catch (err) {
                doc.rect(40, 40, 80, 80).stroke('#ccc');
                doc.fontSize(8).text('Logo', 45, 75);
            }
        } else {
            doc.rect(40, 40, 80, 80).stroke('#ccc');
            doc.fontSize(8).text('No Logo', 45, 75);
        }

        // Company Name & Info Header
        doc.fillColor('#000000');
        doc.fontSize(16).font('Helvetica-Bold').text(compInfo.officialName || 'FieldSync', 135, 40);
        doc.fontSize(9).font('Helvetica').fillColor('#4a5568').text(compInfo.nameCard || "", 135, 60, { width: 430, lineGap: 2 });

        // Dividing Line
        doc.moveTo(40, 130).lineTo(572, 130).strokeColor('#e2e8f0').lineWidth(1).stroke();

        // Title Badge
        doc.rect(40, 145, 532, 28).fill('#991b1b');
        doc.fillColor('#ffffff').fontSize(13).font('Helvetica-Bold').text('PROJECT TERMINATION DOCUMENT', 40, 153, { align: 'center', width: 532 });

        // Project Info Box
        doc.rect(40, 185, 532, 85).fill('#f8fafc');
        doc.rect(40, 185, 532, 85).stroke('#cbd5e0');

        doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text('Project Name:', 55, 195);
        doc.font('Helvetica').text(folder.name || 'Untitled Project', 160, 195);

        doc.font('Helvetica-Bold').text('Customer Name:', 55, 213);
        doc.font('Helvetica').text(folder.customerName || 'N/A', 160, 213);

        doc.font('Helvetica-Bold').text('Working Address:', 55, 231);
        doc.font('Helvetica').text(folder.workingAddress || 'N/A', 160, 231);

        const terminationDateTime = termDoc.dateTime || termDoc.date || new Date().toISOString();
        doc.font('Helvetica-Bold').text('Date & Time:', 55, 249);
        doc.fillColor('#991b1b').font('Helvetica-Bold').text(terminationDateTime, 160, 249);

        // Termination Reason Box
        const reasonY = 285;
        doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold').text('Termination Details / Reason:', 40, reasonY);
        
        const reasonBoxY = reasonY + 18;
        const reasonText = termDoc.reason || termDoc.text || 'No details provided.';
        doc.rect(40, reasonBoxY, 532, 90).fill('#ffffff');
        doc.rect(40, reasonBoxY, 532, 90).stroke('#cbd5e0');
        doc.fillColor('#334155').fontSize(10).font('Helvetica').text(reasonText, 52, reasonBoxY + 12, {
            width: 508,
            height: 68,
            lineGap: 3
        });

        // Authorized Signature Section
        const sigY = reasonBoxY + 105;
        doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold').text('Authorized Signature:', 40, sigY);

        const sigBoxY = sigY + 18;
        doc.rect(40, sigBoxY, 260, 90).fill('#f8fafc');
        doc.rect(40, sigBoxY, 260, 90).stroke('#cbd5e0');

        if (termDoc.signature) {
            try {
                const base64Data = termDoc.signature.replace(/^data:image\/png;base64,/, "");
                const imgBuffer = Buffer.from(base64Data, 'base64');
                doc.image(imgBuffer, 45, sigBoxY + 5, { width: 250, height: 80, fit: [250, 80] });
            } catch (err) {
                console.error("PDFKit signature render error:", err);
                doc.fontSize(9).font('Helvetica').fillColor('#ef4444').text('[Signature Image Error]', 50, sigBoxY + 35);
            }
        }

        doc.fillColor('#64748b').fontSize(9).font('Helvetica').text(`Signed Date & Time: ${terminationDateTime}`, 40, sigBoxY + 98);

        // Footer
        doc.fillColor('#94a3b8').fontSize(8).font('Helvetica').text('Official Project Termination Record - Generated by FieldSync', 40, 740, { align: 'center', width: 532 });

        doc.end();
        return;
    }

    const contract = folder.contracts.find(c => c.id == contractId);
    if (!contract) return res.status(404).send("Contract not found");

    const contractIndex = folder.contracts.findIndex(c => c.id == contractId);
    const quoteNum = contractIndex >= 0 ? contractIndex : 0;

    // Fetch company info
    const companies = data.companies || {};
    const companyKey = (managerUser && managerUser.company) ? managerUser.company.toLowerCase() : '';
    const compInfo = companies[companyKey] || {
        officialName: "FieldSync Draft",
        logo: "./logo.JPG",
        nameCard: ""
    };

    // Create a PDF Document
    const doc = new PDFDocument({ margin: 40 });

    // Set the filename that appears in the browser tab
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=contract_${contract.id}.pdf`);

    doc.pipe(res); // Pipe the PDF directly to the response

    // Check if contract template is 'none'
    const useTemplate = contract.template !== 'none';

    if (!useTemplate) {
        // --- Render standard plain text contract style ---
        doc.fontSize(25).font('Helvetica-Bold').text('OFFICIAL CONTRACT', { align: 'center' });
        doc.moveDown();
        doc.fontSize(14).font('Helvetica').text(`Project: ${folder.name}`);
        doc.text(`Date: ${contract.date}`);
        if (contract.expirationDate) {
            doc.text(`Expiration Date: ${contract.expirationDate}`);
        }
        doc.moveDown();

        doc.fontSize(12).text('------------------------------------------');
        doc.text(`Customer Name: ${contract.customer}`);
        doc.text(`Seller Name: ${contract.seller}`);
        doc.text(`Total Price: $${contract.price}`);
        doc.text('------------------------------------------');

        doc.moveDown();
        doc.text('Terms and Conditions:');
        doc.fontSize(10).text('This is a computer-generated document. All information is pulled directly from the project database.');

        // --- Add the Signature Image ---
        if (contract.signature) {
            doc.moveDown();
            doc.fontSize(10).font('Helvetica-Bold').text('Customer Signature:');

            const base64Data = contract.signature.replace(/^data:image\/png;base64,/, "");
            const imgBuffer = Buffer.from(base64Data, 'base64');
            try {
                doc.image(imgBuffer, {
                    width: 150,
                    align: 'left'
                });
            } catch (err) {
                console.error("PDFKit signature render error:", err);
            }
        }
    } else {
        // --- Render Company default template style ---
        // Try to draw logo
        let logoBuffer = null;
        if (compInfo.logo) {
            try {
                if (compInfo.logo.startsWith('data:')) {
                    const base64Data = compInfo.logo.replace(/^data:image\/\w+;base64,/, "");
                    logoBuffer = Buffer.from(base64Data, 'base64');
                } else {
                    const path = require('path');
                    let resolvedPath = compInfo.logo;
                    if (resolvedPath.startsWith('./')) resolvedPath = resolvedPath.substring(2);
                    const possiblePaths = [
                        path.join(__dirname, 'public', resolvedPath),
                        path.join(__dirname, resolvedPath),
                        compInfo.logo
                    ];
                    for (let p of possiblePaths) {
                        if (fs.existsSync(p)) {
                            logoBuffer = fs.readFileSync(p);
                            break;
                        }
                    }
                }
            } catch (err) {
                console.error("Error loading logo image:", err);
            }
        }

        // Draw logo if buffer exists
        if (logoBuffer) {
            try {
                doc.image(logoBuffer, 40, 40, { width: 80, height: 80 });
            } catch (err) {
                console.error("PDFKit image rendering error:", err);
                doc.rect(40, 40, 80, 80).stroke('#ccc');
                doc.fontSize(8).text('Logo Error', 45, 75);
            }
        } else {
            doc.rect(40, 40, 80, 80).stroke('#ccc');
            doc.fontSize(8).text('No Logo', 45, 75);
        }

        // Draw Company Name & Namecard (Description Card)
        doc.fillColor('#000000');
        doc.fontSize(16).font('Helvetica-Bold').text(compInfo.officialName, 135, 40);
        doc.fontSize(9).font('Helvetica').fillColor('#4a5568').text(compInfo.nameCard || "", 135, 60, { width: 430, lineGap: 2 });

        // Draw separator line
        doc.moveTo(40, 130).lineTo(572, 130).strokeColor('#e2e8f0').lineWidth(1).stroke();

        // --- Recipient & Quote Summary Column ---
        // Recipient details (Left Column)
        doc.fillColor('#718096').fontSize(8).font('Helvetica-Bold').text('RECIPIENT:', 40, 150);
        doc.fillColor('#1a202c').fontSize(14).font('Helvetica-Bold').text(contract.customer, 40, 163);
        doc.fillColor('#4a5568').fontSize(9).font('Helvetica').text(`Working Address: ${folder.workingAddress || ''}`, 40, 180, { width: 250 });
        doc.text(`Billing Address: ${folder.customerBillingAddress || ''}`, 40, 195, { width: 250 });

        // Quote Summary Box (Right Column)
        const boxX = 320;
        const boxY = 150;
        const boxWidth = 252;

        // Header segment (Dark Grey background)
        doc.rect(boxX, boxY, boxWidth, 25).fill('#4a5568');
        doc.fillColor('#ffffff').fontSize(12).font('Helvetica-Bold').text(`Quote #${quoteNum}`, boxX + 10, boxY + 6);

        // Date segment (White background, light grey border)
        doc.rect(boxX, boxY + 25, boxWidth, 25).fill('#ffffff');
        doc.rect(boxX, boxY + 25, boxWidth, 25).stroke('#cbd5e0');
        doc.fillColor('#718096').fontSize(9).font('Helvetica').text('Sent on', boxX + 10, boxY + 33);
        doc.fillColor('#1a202c').fontSize(9).font('Helvetica-Bold').text(contract.date, boxX + 10, boxY + 33, { width: boxWidth - 20, align: 'right' });

        if (contract.expirationDate) {
            doc.rect(boxX, boxY + 50, boxWidth, 25).fill('#ffffff');
            doc.rect(boxX, boxY + 50, boxWidth, 25).stroke('#cbd5e0');
            doc.fillColor('#718096').fontSize(9).font('Helvetica').text('Expires on', boxX + 10, boxY + 58);
            doc.fillColor('#1a202c').fontSize(9).font('Helvetica-Bold').text(contract.expirationDate, boxX + 10, boxY + 58, { width: boxWidth - 20, align: 'right' });
        }

        const totalY = contract.expirationDate ? (boxY + 75) : (boxY + 50);
        // Total segment (Medium Grey background)
        doc.rect(boxX, totalY, boxWidth, 30).fill('#718096');
        doc.fillColor('#ffffff').fontSize(12).font('Helvetica-Bold').text('Total', boxX + 10, totalY + 9);
        doc.fillColor('#ffffff').fontSize(12).font('Helvetica-Bold').text(`$${Number(contract.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, boxX + 10, totalY + 9, { width: boxWidth - 20, align: 'right' });

        // --- Product/Service Table ---
        const tableY = 250;
        
        // Header Row
        doc.rect(40, tableY, 532, 25).fill('#4a5568');
        doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
        doc.text('Product/Service', 45, tableY + 8);
        doc.text('Description', 165, tableY + 8);
        doc.text('Qty.', 395, tableY + 8);
        doc.text('Unit Price', 445, tableY + 8);
        doc.text('Total', 525, tableY + 8);

        // If contract has items, draw them dynamically!
        const items = contract.items || [];
        const rowHeight = 35;
        let currentY = tableY + 25;

        if (items.length > 0) {
            items.forEach((item, index) => {
                // Draw row bottom borders and vertical dividers
                doc.rect(40, currentY, 532, rowHeight).stroke('#e2e8f0');
                
                // Vertical dividers
                doc.moveTo(160, currentY).lineTo(160, currentY + rowHeight).stroke('#e2e8f0');
                doc.moveTo(390, currentY).lineTo(390, currentY + rowHeight).stroke('#e2e8f0');
                doc.moveTo(435, currentY).lineTo(435, currentY + rowHeight).stroke('#e2e8f0');
                doc.moveTo(515, currentY).lineTo(515, currentY + rowHeight).stroke('#e2e8f0');

                // Content
                doc.fillColor('#1a202c').fontSize(9).font('Helvetica');
                doc.text(`Item #${index + 1}`, 45, currentY + 13, { width: 110, height: 20, ellipsis: true });
                doc.text(item.description || '', 165, currentY + 7, { width: 220, height: 25, ellipsis: true });
                doc.text('1', 395, currentY + 13, { width: 35, align: 'center' });
                
                const itemPrice = parseFloat(item.price) || 0;
                doc.text(`$${Number(itemPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 440, currentY + 13, { width: 70, align: 'right' });
                doc.text(`$${Number(itemPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 518, currentY + 13, { width: 50, align: 'right' });

                currentY += rowHeight;
            });
        } else {
            // Empty Template Row (Legacy fallback)
            doc.rect(40, currentY, 532, rowHeight).stroke('#e2e8f0');
            doc.moveTo(160, currentY).lineTo(160, currentY + rowHeight).stroke('#e2e8f0');
            doc.moveTo(390, currentY).lineTo(390, currentY + rowHeight).stroke('#e2e8f0');
            doc.moveTo(435, currentY).lineTo(435, currentY + rowHeight).stroke('#e2e8f0');
            doc.moveTo(515, currentY).lineTo(515, currentY + rowHeight).stroke('#e2e8f0');

            doc.fillColor('#1a202c').fontSize(9).font('Helvetica');
            doc.text('1', 395, currentY + 13, { width: 35, align: 'center' });
            doc.text(`$${Number(contract.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 518, currentY + 13, { width: 50, align: 'right' });

            currentY += rowHeight;
        }

        // Draw bottom total Box
        const totalBoxY = currentY + 15;
        doc.fillColor('#1a202c').fontSize(11).font('Helvetica-Bold').text('Total', 435, totalBoxY + 6);
        
        // Value Border Box
        doc.rect(490, totalBoxY, 82, 25).stroke('#cbd5e0');
        doc.fontSize(10).font('Helvetica-Bold').text(`$${Number(contract.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 495, totalBoxY + 8, { width: 72, align: 'right' });

        // --- Footer Notice ---
        const footerY = totalBoxY + 60;
        doc.fillColor('#718096').fontSize(9).font('Helvetica').text('This quote is valid for the next 30 days, after which values may be subject to change.', 40, footerY);

        // --- Signature Section ---
        if (contract.signature) {
            const sigY = footerY + 30;
            doc.fillColor('#1a202c').fontSize(10).font('Helvetica-Bold').text('Customer Signature:', 40, sigY);

            const base64Data = contract.signature.replace(/^data:image\/png;base64,/, "");
            const imgBuffer = Buffer.from(base64Data, 'base64');

            try {
                doc.image(imgBuffer, 40, sigY + 15, {
                    width: 150,
                    align: 'left'
                });
            } catch (err) {
                console.error("Error drawing signature image inside PDF:", err);
                doc.fillColor('red').fontSize(8).text('[Signature Render Error]', 40, sigY + 15);
            }
        }
    }

    doc.end(); // Finalize the PDF
});

// API: Get admin company data (managers, crews, and all company projects)
app.get('/api/admin/company-data', async (req, res) => {
    const { company } = req.query;
    if (!company) return res.status(400).json({ success: false, message: "Company parameter required" });

    const data = await getData();
    // Filter users belonging to this company (case-insensitive)
    const companyUsers = data.users.filter(u => u.company && u.company.toLowerCase() === company.toLowerCase());

    const managers = [];
    const crews = [];
    const projects = [];
    const pendingUsers = [];

    companyUsers.forEach(u => {
        if (u.approved === false && !u.denied) {
            pendingUsers.push({
                username: u.username,
                fullname: u.fullname || u.username,
                role: u.role
            });
            return;
        }

        const isUserActive = u.active !== false && u.deactivated !== true && !u.denied;
        if (isUserActive) {
            if (u.role === 'manager' || u.role === 'admin') {
                managers.push({
                    username: u.username,
                    fullname: u.fullname || u.username
                });
            } else if (u.role === 'crew') {
                crews.push({
                    username: u.username,
                    fullname: u.fullname || u.username
                });
            }
        }
        
        // Folders are stored physically under the user's folders array
        if (u.folders && Array.isArray(u.folders)) {
            u.folders.forEach(f => {
                projects.push({
                    id: f.id,
                    name: f.name,
                    managerUsername: u.username,
                    managerName: u.fullname || u.username,
                    crewUsername: f.crew || '',
                    crewUsernames: f.crews || (f.crew ? [f.crew.toLowerCase()] : []),
                    crewName: f.crews && f.crews.length > 0 
                        ? f.crews.map(cr => data.users.find(usr => usr.username.toLowerCase() === cr.toLowerCase())?.fullname || cr).join(', ')
                        : (f.crew ? (data.users.find(usr => usr.username.toLowerCase() === f.crew.toLowerCase())?.fullname || f.crew) : 'None'),
                    status: f.status || 'Draft'
                });
            });
        }
    });

    const companies = data.companies || {};
    const compInfo = companies[company.toLowerCase()] || {};
    const tier = compInfo.tier || 'standard';
    const companyId = compInfo.companyId || '';

    const employees = companyUsers
        .filter(u => u.approved !== false || u.denied === true)
        .map(u => ({
            username: u.username,
            fullname: u.fullname || u.username,
            role: u.role || 'crew',
            email: u.email || '',
            cellphone: u.cellphone || '',
            approved: u.approved !== false,
            active: u.active !== false && u.deactivated !== true && !u.denied,
            denied: u.denied === true
        }));

    res.json({ managers, crews, projects: sortFolders(projects), pendingUsers, tier, companyId, employees });
});

// API: Toggle employee active / deactivated status
app.post('/api/admin/toggle-user-status', async (req, res) => {
    const { username, active } = req.body;
    if (!username) {
        return res.status(400).json({ success: false, message: "Username is required" });
    }

    const data = await getData();
    const user = data.users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    const newActiveState = Boolean(active);
    user.active = newActiveState;
    if (!newActiveState) {
        user.deactivated = true;
    } else {
        delete user.deactivated;
        delete user.denied;
        user.approved = true;
    }

    await saveData(data);
    res.json({
        success: true,
        username: user.username,
        active: user.active,
        message: `User ${user.username} is now ${user.active ? 'active' : 'deactivated'}.`
    });
});

// API: Admin resets employee password and assigns temporary password
app.post('/api/admin/reset-user-password', async (req, res) => {
    const { username } = req.body;
    if (!username) {
        return res.status(400).json({ success: false, message: "Username is required" });
    }

    const data = await getData();
    const user = data.users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let rand = '';
    for (let i = 0; i < 6; i++) {
        rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const tempPassword = `Temp-${rand}`;
    user.password = tempPassword;

    let destination = '';
    let channel = 'none';

    if (user.email && user.email.trim()) {
        destination = user.email.trim();
        channel = 'email';
        console.log(`
======================================================================
[MOCK EMAIL SENT - TEMPORARY PASSWORD ASSIGNED]
To: ${destination}
Subject: FieldSync Temporary Password Assigned
Body: Hello ${user.fullname || user.username},

Your administrator has assigned a temporary password to your account.
Temporary Password: ${tempPassword}

Please log in with this temporary password and update your credentials.
======================================================================
        `);
    } else if (user.cellphone && user.cellphone.trim()) {
        destination = user.cellphone.trim();
        channel = 'cellphone';
        console.log(`
======================================================================
[MOCK SMS SENT - TEMPORARY PASSWORD ASSIGNED]
To: ${destination}
Body: FieldSync: Your administrator has reset your password. Your temporary password is: ${tempPassword}
======================================================================
        `);
    }

    await saveData(data);
    res.json({
        success: true,
        username: user.username,
        tempPassword,
        channel,
        destination,
        message: destination
            ? `Temporary password assigned and sent to ${channel === 'email' ? 'email' : 'cell phone'} (${destination}).`
            : `Temporary password assigned: ${tempPassword} (No contact email or cell phone listed for user).`
    });
});

// API: Reassign project (manager or crew)
app.post('/api/admin/reassign-project', async (req, res) => {
    const { type, folderId, toUser } = req.body;
    if (!type || !folderId) {
        return res.status(400).json({ success: false, message: "Missing required parameters" });
    }

    const data = await getData();

    if (type === 'manager') {
        // Find the manager currently owning the folder
        let sourceUser = null;
        let folderIndex = -1;
        data.users.forEach(u => {
            if (u.folders) {
                const idx = u.folders.findIndex(f => f.id == folderId);
                if (idx !== -1) {
                    sourceUser = u;
                    folderIndex = idx;
                }
            }
        });

        if (!sourceUser) {
            return res.status(404).json({ success: false, message: "Project not found" });
        }

        const destUser = data.users.find(u => u.username.toLowerCase() === toUser.toLowerCase() && (u.role === 'manager' || u.role === 'admin'));
        if (!destUser) {
            return res.status(404).json({ success: false, message: "Destination manager/admin not found" });
        }

        // Move folder
        const [folderToMove] = sourceUser.folders.splice(folderIndex, 1);
        if (!destUser.folders) destUser.folders = [];
        destUser.folders.push(folderToMove);

        await saveData(data);
        return res.json({ success: true });
    } else if (type === 'crew') {
        // Find the folder inside whoever owns it (must be under some manager's folders)
        let folder = null;
        data.users.forEach(u => {
            if (u.folders) {
                const found = u.folders.find(f => f.id == folderId);
                if (found) folder = found;
            }
        });

        if (!folder) {
            return res.status(404).json({ success: false, message: "Project not found" });
        }

        if (toUser) {
            const crewUser = data.users.find(u => u.username.toLowerCase() === toUser.toLowerCase() && u.role === 'crew');
            if (!crewUser) {
                return res.status(404).json({ success: false, message: "Crew user not found" });
            }
            folder.crew = crewUser.username;
        } else {
            folder.crew = null; // Unassigned
        }

        await saveData(data);
        return res.json({ success: true });
    }

    res.status(400).json({ success: false, message: "Invalid reassignment type" });
});

// API: Get company settings (logo and official name)
app.get('/api/admin/company-info', async (req, res) => {
    const { company } = req.query;
    if (!company) return res.status(400).json({ success: false, message: "Company parameter required" });

    const data = await getData();
    const companies = data.companies || {};
    const compInfo = companies[company.toLowerCase()] || {
        officialName: "FieldSync Draft",
        logo: "./logo.JPG",
        nameCard: ""
    };

    res.json(compInfo);
});

// API: Save company settings
app.post('/api/admin/company-info', async (req, res) => {
    const { company, officialName, logo, nameCard } = req.body;
    if (!company || !officialName) {
        return res.status(400).json({ success: false, message: "Missing required parameters" });
    }

    const data = await getData();
    if (!data.companies) data.companies = {};

    data.companies[company.toLowerCase()] = {
        officialName: officialName,
        logo: logo || "./logo.JPG",
        nameCard: nameCard || ""
    };

    await saveData(data);
    res.json({ success: true });
});

// API: Add reply to a note
app.post('/api/add-reply', async (req, res) => {
    const { username, folderId, noteId, replyContent } = req.body;
    const data = await getData();
    
    const user = data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    let note = null;
    data.users.forEach(u => {
        if (u.folders) {
            u.folders.forEach(f => {
                if (f.notes) {
                    const foundNote = f.notes.find(n => String(n.id) === String(noteId));
                    if (foundNote) {
                        note = foundNote;
                    }
                }
            });
        }
    });

    if (note) {
        if (!note.replies) note.replies = [];
        note.replies.push({
            id: Date.now(),
            username: user.username,
            fullname: user.fullname || user.username,
            role: user.role || 'user',
            content: replyContent,
            date: new Date().toLocaleString()
        });
        await saveData(data);
        return res.json({ success: true });
    }
    res.status(404).json({ success: false, message: "Note not found" });
});

// API: Get all unique companies (public, used for signup page suggestion)
app.get('/api/companies', async (req, res) => {
    const data = await getData();
    const map = new Map(); // lowercase -> original case
    if (data.companies) {
        Object.values(data.companies).forEach(c => {
            if (c.officialName) {
                map.set(c.officialName.toLowerCase(), c.officialName);
            }
        });
    }
    data.users.forEach(u => {
        if (u.company) {
            map.set(u.company.toLowerCase(), u.company);
        }
    });
    res.json(Array.from(map.values()));
});

// API: Get Super Admin console data (all users, all unique companies)
app.get('/api/super-admin/data', async (req, res) => {
    const data = await getData();
    
    const companiesSet = new Set();
    if (data.companies) {
        Object.keys(data.companies).forEach(k => companiesSet.add(k.toLowerCase()));
    }
    data.users.forEach(u => {
        if (u.company) {
            companiesSet.add(u.company.toLowerCase());
        }
    });
    
    res.json({
        users: data.users.map(u => ({
            username: u.username,
            fullname: u.fullname || u.username,
            company: u.company || '',
            role: u.role || 'user'
        })),
        companies: Array.from(companiesSet)
    });
});

// API: Create new company (Super Admin only)
app.post('/api/super-admin/create-company', async (req, res) => {
    const { companyName } = req.body;
    if (!companyName) return res.status(400).json({ success: false, message: "Company name is required" });

    const data = await getData();
    if (!data.companies) data.companies = {};

    const key = companyName.toLowerCase().trim();
    if (data.companies[key]) {
        return res.status(400).json({ success: false, message: "Company already exists" });
    }

    const newCompanyId = generateCompanyId(data.companies);
    data.companies[key] = {
        companyId: newCompanyId,
        officialName: companyName.trim(),
        logo: "./logo.JPG"
    };

    await saveData(data);
    res.json({ success: true });
});

// API: Assign user to company (Super Admin only)
app.post('/api/super-admin/assign-user-company', async (req, res) => {
    const { username, company } = req.body;
    if (!username) return res.status(400).json({ success: false, message: "Username is required" });

    const data = await getData();
    const user = data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.company = company ? company.trim() : '';
    await saveData(data);
    res.json({ success: true });
});

// API: Create new user with any role/company (Super Admin only)
app.post('/api/super-admin/create-user', async (req, res) => {
    const { username, password, fullname, role, company } = req.body;
    if (!username || !password || !role) {
        return res.status(400).json({ success: false, message: "Username, password and role are required" });
    }

    const data = await getData();
    const exists = data.users.some(u => u.username.toLowerCase() === username.toLowerCase());
    if (exists) {
        return res.status(400).json({ success: false, message: "Username already exists" });
    }

    const trimmedCompany = company ? company.trim() : '';
    if (trimmedCompany) {
        if (!data.companies) data.companies = {};
        const compKey = trimmedCompany.toLowerCase();
        if (!data.companies[compKey]) {
            data.companies[compKey] = {
                officialName: trimmedCompany,
                logo: "./logo.JPG"
            };
        }
    }

    const newUser = {
        username: username.trim(),
        password: password,
        fullname: fullname ? fullname.trim() : username.trim(),
        role: role,
        company: trimmedCompany,
        approved: true,
        folders: []
    };

    data.users.push(newUser);

    await saveData(data);
    res.json({ success: true, user: newUser });
});

// API: Get contract details by signature token
app.get('/api/contract-by-token', async (req, res) => {
    const { token } = req.query;
    if (!token) return res.status(400).json({ success: false, message: "Token is required" });

    const data = await getData();
    let foundContract = null;
    let managerUser = null;
    let projectName = "";

    data.users.forEach(u => {
        if (u.folders) {
            u.folders.forEach(f => {
                if (f.contracts) {
                    const c = f.contracts.find(c => c.signatureToken === token || c.token === token);
                    if (c) {
                        foundContract = c;
                        managerUser = u;
                        projectName = f.name;
                    }
                }
            });
        }
    });

    if (!foundContract) {
        return res.status(404).json({ success: false, message: "Contract not found or already signed" });
    }

    // Get company details
    const companies = data.companies || {};
    const companyKey = (managerUser && managerUser.company) ? managerUser.company.toLowerCase() : '';
    const compInfo = companies[companyKey] || {
        officialName: "FieldSync Draft",
        logo: "./logo.JPG"
    };

    res.json({
        success: true,
        contract: {
            customer: foundContract.customer,
            seller: foundContract.seller,
            price: foundContract.price,
            date: foundContract.date,
            projectName: projectName,
            companyOfficialName: compInfo.officialName,
            companyLogo: compInfo.logo
        }
    });
});

// API: Submit signature using token
app.post('/api/submit-signature', async (req, res) => {
    const { token, signature } = req.body;
    if (!token || !signature) {
        return res.status(400).json({ success: false, message: "Token and signature are required" });
    }

    const data = await getData();
    let foundContract = null;
    let foundFolder = null;

    data.users.forEach(u => {
        if (u.folders) {
            u.folders.forEach(f => {
                if (f.contracts) {
                    const c = f.contracts.find(c => c.signatureToken === token || c.token === token);
                    if (c) {
                        foundContract = c;
                        foundFolder = f;
                    }
                }
            });
        }
    });

    if (!foundContract) {
        return res.status(404).json({ success: false, message: "Contract not found" });
    }

    foundContract.signature = signature;
    foundContract.signed = true;
    delete foundContract.signatureToken; // remove token once signed
    foundContract.token = null;

    if (foundFolder) {
        foundFolder.status = "Signed";
    }

    await saveData(data);
    res.json({ success: true });
});

// API: Get all customers across the platform (Super Admin only)
app.get('/api/super-admin/customers', async (req, res) => {
    const data = await getData();
    const customers = [];

    data.users.forEach(u => {
        if (u.folders) {
            u.folders.forEach(f => {
                if (f.contracts) {
                    f.contracts.forEach(c => {
                        customers.push({
                            customer: c.customer,
                            phone: c.phone || '',
                            email: c.email || '',
                            projectName: f.name,
                            company: u.company || ''
                        });
                    });
                }
            });
        }
    });

    res.json(customers);
});

// API: Update project status (Manager only)
app.post('/api/project/update-status', async (req, res) => {
    const { folderId, status, signature, date, terminationDoc } = req.body;
    if (!folderId || !status) {
        return res.status(400).json({ success: false, message: "Folder ID and status are required" });
    }

    const validStatuses = ['Draft', 'Signed', 'In-Porgress', 'Sent to Client', 'Done', 'Signed_Unpaid', 'Terminated', 'Remaining Balance'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const data = await getData();
    const folderResult = findFolderById(data, folderId);
    if (!folderResult) {
        return res.status(404).json({ success: false, message: "Project not found" });
    }
    const folder = folderResult.folder;

    folder.status = status;

    if (status === 'Signed' && signature) {
        if (folder.contracts && folder.contracts.length > 0) {
            const latestContract = folder.contracts[folder.contracts.length - 1];
            latestContract.signature = signature;
            if (date) {
                latestContract.date = date;
            }
        }
    }

    if (status === 'Terminated' && terminationDoc) {
        folder.terminationDoc = terminationDoc;
    }

    await saveData(data);
    res.json({ success: true });
});

// API: Update project payment status (Manager only)
app.post('/api/project/update-payment-status', async (req, res) => {
    const { folderId, paymentStatus } = req.body;
    if (!folderId || !paymentStatus) {
        return res.status(400).json({ success: false, message: "Folder ID and payment status are required" });
    }

    const validPaymentStatuses = ['N/A', 'Unpaid', 'Deposit Paid', 'Paid in Full'];
    if (!validPaymentStatuses.includes(paymentStatus)) {
        return res.status(400).json({ success: false, message: "Invalid payment status value" });
    }

    const data = await getData();
    const folderResult = findFolderById(data, folderId);
    if (!folderResult) {
        return res.status(404).json({ success: false, message: "Project not found" });
    }
    const folder = folderResult.folder;

    folder.paymentStatus = paymentStatus;
    await saveData(data);
    res.json({ success: true });
});

// API: Approve pending user (Admin only)
app.post('/api/admin/approve-user', async (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ success: false, message: "Username required" });

    const data = await getData();
    const user = data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.approved = true;
    user.active = true;
    delete user.deactivated;
    delete user.denied;
    await saveData(data);
    res.json({ success: true, username: user.username, active: true });
});

// API: Deny pending user (Admin only)
app.post('/api/admin/deny-user', async (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ success: false, message: "Username required" });

    const data = await getData();
    const user = data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Mark as denied and inactive so they appear on the employee list with inactive status
    user.approved = true;
    user.active = false;
    user.deactivated = true;
    user.denied = true;
    await saveData(data);
    res.json({
        success: true,
        username: user.username,
        active: false,
        message: `User ${user.username} was denied and added to employee list with inactive status.`
    });
});

// API: Reassign multiple crews to project (Admin only)
app.post('/api/admin/reassign-project-crews', async (req, res) => {
    const { folderId, crews } = req.body;
    if (!folderId || !Array.isArray(crews)) {
        return res.status(400).json({ success: false, message: "Missing required parameters" });
    }

    const data = await getData();
    let folder = null;

    data.users.forEach(u => {
        if (u.folders) {
            const found = u.folders.find(f => f.id == folderId);
            if (found) folder = found;
        }
    });

    if (!folder) {
        return res.status(404).json({ success: false, message: "Project not found" });
    }

    // Map to valid crew usernames in the system
    const validCrews = crews.filter(cr => {
        const user = data.users.find(u => u.username.toLowerCase() === cr.toLowerCase() && u.role === 'crew');
        return !!user;
    });

    folder.crews = validCrews;
    // Sync legacy single crew property to the first one in the list for compatibility
    folder.crew = validCrews.length > 0 ? validCrews[0] : null;

    await saveData(data);
    res.json({ success: true });
});

// API: Reassign crews by Manager (Manager can only edit their own projects)
app.post('/api/manager/reassign-project-crews', async (req, res) => {
    const { folderId, crews, username } = req.body;
    if (!folderId || !Array.isArray(crews) || !username) {
        return res.status(400).json({ success: false, message: "Missing required parameters" });
    }

    const data = await getData();
    const user = data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user || (user.role !== 'manager' && user.role !== 'admin')) {
        return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    const folder = user.folders ? user.folders.find(f => f.id == folderId) : null;
    if (!folder) {
        return res.status(403).json({ success: false, message: "You can only reassign crews to your own projects." });
    }

    // Map to valid crew usernames in the system
    const validCrews = crews.filter(cr => {
        const u = data.users.find(usr => usr.username.toLowerCase() === cr.toLowerCase() && usr.role === 'crew');
        return !!u;
    });

    folder.crews = validCrews;
    folder.crew = validCrews.length > 0 ? validCrews[0] : null;

    await saveData(data);
    res.json({ success: true });
});

// API: Customer lookup by exact match of phone or email
app.get('/api/customer-lookup', async (req, res) => {
    const { phone, email } = req.query;
    const data = await getData();
    
    let matchedCustomer = null;

    data.users.forEach(u => {
        if (u.folders) {
            u.folders.forEach(f => {
                if (phone && f.customerPhone && f.customerPhone.trim() === phone.trim()) {
                    matchedCustomer = {
                        customerName: f.customerName,
                        customerPhone: f.customerPhone,
                        customerEmail: f.customerEmail,
                        customerBillingAddress: f.customerBillingAddress
                    };
                }
                if (email && f.customerEmail && f.customerEmail.trim().toLowerCase() === email.trim().toLowerCase()) {
                    matchedCustomer = {
                        customerName: f.customerName,
                        customerPhone: f.customerPhone,
                        customerEmail: f.customerEmail,
                        customerBillingAddress: f.customerBillingAddress
                    };
                }
            });
        }
    });

    if (matchedCustomer) {
        return res.json({ found: true, ...matchedCustomer });
    }
    res.json({ found: false });
});

// API: Upgrade company to premium
app.post('/api/company/upgrade', async (req, res) => {
    const { company } = req.body;
    if (!company) return res.status(400).json({ success: false, message: "Company name required" });

    const data = await getData();
    if (!data.companies) data.companies = {};
    
    const companyKey = company.toLowerCase();
    if (!data.companies[companyKey]) {
        data.companies[companyKey] = {
            officialName: company,
            logo: "./logo.JPG",
            nameCard: ""
        };
    }

    data.companies[companyKey].tier = 'premium';
    await saveData(data);
    res.json({ success: true, tier: 'premium' });
});

if (require.main === module) {
    app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
}

module.exports = app;
