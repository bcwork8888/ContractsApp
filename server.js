const express = require('express');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const app = express();
const PORT = 8888;

app.use(express.json());
app.use(express.static('public')); // Serves your HTML/JS

// Logout route redirecting back to home/login
app.get('/logout', (req, res) => {
    res.redirect('/');
});

// Helper to read JSON
const getData = () => JSON.parse(fs.readFileSync('data.json'));
// Helper to write JSON
const saveData = (data) => fs.writeFileSync('data.json', JSON.stringify(data, null, 2));

const STATUS_ORDER = {
    'draft': 0,
    'in-porgress': 1,
    'signed': 2,
    'done': 3
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

// API: Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const data = getData();
    const user = data.users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    
    if (user) {
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
            role: user.role || 'user',
            folders: user.folders,
            companyOfficialName: compInfo.officialName,
            companyLogo: compInfo.logo,
            companyNameCard: compInfo.nameCard || ""
        });
    } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
    }
});

// API: Add Folder
app.post('/api/add-folder', (req, res) => {
    const { username, folderName } = req.body;
    const data = getData();
    const user = data.users.find(u => u.username.toLowerCase() === username.toLowerCase());

    const newFolder = { id: Date.now(), name: folderName, contracts: [], notes: [], status: 'Draft' };
    user.folders.push(newFolder);
    saveData(data);
    res.json(newFolder);
});

// API: Sign Up
app.post('/api/signup', (req, res) => {
    const { username, password, fullname, company, role } = req.body;
    const data = getData();

    // Check if user already exists
    const existingUser = data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (existingUser) {
        return res.status(400).json({ success: false, message: "User already exists" });
    }

    // Create new user object
    const newUser = {
        username,
        password,
        fullname,
        company,
        role,
        folders: []
    };

    data.users.push(newUser);
    saveData(data);
    res.json({ success: true });
});

// API: Get user folders
app.get('/api/folders', (req, res) => {
    const { username } = req.query;
    const data = getData();
    const user = data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (user) {
        if (user.role === 'crew') {
            const assignedFolders = [];
            data.users.forEach(u => {
                if (u.role === 'manager' && u.folders) {
                    u.folders.forEach(f => {
                        if (f.crew && f.crew.toLowerCase() === username.toLowerCase()) {
                            assignedFolders.push(f);
                        }
                    });
                }
            });
            res.json(sortFolders(assignedFolders));
        } else {
            res.json(sortFolders(user.folders || []));
        }
    } else {
        res.status(404).json({ success: false, message: "User not found" });
    }
});

app.post('/api/add-note', (req, res) => {
    const { username, folderId, noteContent, photos } = req.body;
    const data = getData();
    
    let folder = null;
    data.users.forEach(u => {
        if (u.role === 'manager' && u.folders) {
            const found = u.folders.find(f => f.id == folderId);
            if (found) folder = found;
        }
    });

    if (folder) {
        if (!folder.notes) folder.notes = []; // Ensure array exists
        folder.notes.push({
            id: Date.now(),
            content: noteContent,
            date: new Date().toLocaleString(),
            photos: photos || []
        });
        saveData(data);
        return res.json({ success: true });
    }
    res.status(404).json({ success: false, message: "Folder not found" });
});

app.post('/api/add-contract', (req, res) => {
    const { username, folderId, contractData } = req.body;
    const data = getData();

    let folder = null;
    data.users.forEach(u => {
        if (u.role === 'manager' && u.folders) {
            const found = u.folders.find(f => f.id == folderId);
            if (found) folder = found;
        }
    });

    if (folder) {
        if (!folder.contracts) folder.contracts = [];

        const newContract = {
            id: Date.now(),
            customer: contractData.customer,
            seller: contractData.seller,
            price: contractData.price,
            date: contractData.date,
            template: contractData.template,
            phone: contractData.phone || '',
            email: contractData.email || ''
        };

        if (contractData.signLater) {
            if (!contractData.email) {
                return res.status(400).json({ success: false, message: "Email is required for Sign Later option" });
            }
            const token = 'token_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
            newContract.signatureToken = token;
            newContract.signature = ''; // empty signature for now

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
        }

        folder.contracts.push(newContract);
        saveData(data);
        return res.json({ success: true });
    }
    res.status(404).json({ success: false });
});

// API: Generate PDF for a specific contract
app.get('/api/view-pdf', (req, res) => {
    const { username, folderId, contractId } = req.query;
    const data = getData();

    let folder = null;
    let managerUser = null;
    
    // Find the folder and the owner (manager) user
    data.users.forEach(u => {
        if (u.role === 'manager' && u.folders) {
            const found = u.folders.find(f => f.id == folderId);
            if (found) {
                folder = found;
                managerUser = u;
            }
        }
    });

    if (!folder) return res.status(404).send("Folder not found");
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
        doc.fillColor('#4a5568').fontSize(10).font('Helvetica').text(folder.name, 40, 180, { width: 250 });

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

        // Total segment (Medium Grey background)
        doc.rect(boxX, boxY + 50, boxWidth, 30).fill('#718096');
        doc.fillColor('#ffffff').fontSize(12).font('Helvetica-Bold').text('Total', boxX + 10, boxY + 59);
        doc.fillColor('#ffffff').fontSize(12).font('Helvetica-Bold').text(`$${Number(contract.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, boxX + 10, boxY + 59, { width: boxWidth - 20, align: 'right' });

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

        // Empty Template Row
        const rowHeight = 35;
        const rowY = tableY + 25;
        
        // Draw row bottom borders and vertical dividers
        doc.rect(40, rowY, 532, rowHeight).stroke('#e2e8f0');
        
        // Vertical dividers
        doc.moveTo(160, rowY).lineTo(160, rowY + rowHeight).stroke('#e2e8f0');
        doc.moveTo(390, rowY).lineTo(390, rowY + rowHeight).stroke('#e2e8f0');
        doc.moveTo(435, rowY).lineTo(435, rowY + rowHeight).stroke('#e2e8f0');
        doc.moveTo(515, rowY).lineTo(515, rowY + rowHeight).stroke('#e2e8f0');

        // Keep product/service, description, unit price empty for now, but draw Qty=1 and Total=price as summary
        doc.fillColor('#1a202c').fontSize(9).font('Helvetica');
        doc.text('1', 395, rowY + 13, { width: 35, align: 'center' });
        doc.text(`$${Number(contract.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 518, rowY + 13, { width: 50, align: 'right' });

        // Draw bottom total Box
        const totalBoxY = rowY + rowHeight + 15;
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
app.get('/api/admin/company-data', (req, res) => {
    const { company } = req.query;
    if (!company) return res.status(400).json({ success: false, message: "Company parameter required" });

    const data = getData();
    // Filter users belonging to this company (case-insensitive)
    const companyUsers = data.users.filter(u => u.company && u.company.toLowerCase() === company.toLowerCase());

    const managers = [];
    const crews = [];
    const projects = [];

    companyUsers.forEach(u => {
        if (u.role === 'manager') {
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
        
        // Folders are stored physically under the manager's folders array
        if (u.role === 'manager' && u.folders) {
            u.folders.forEach(f => {
                projects.push({
                    id: f.id,
                    name: f.name,
                    managerUsername: u.username,
                    managerName: u.fullname || u.username,
                    crewUsername: f.crew || '',
                    crewName: f.crew ? (data.users.find(usr => usr.username.toLowerCase() === f.crew.toLowerCase())?.fullname || f.crew) : 'None',
                    status: f.status || 'Draft'
                });
            });
        }
    });

    res.json({ managers, crews, projects: sortFolders(projects) });
});

// API: Reassign project (manager or crew)
app.post('/api/admin/reassign-project', (req, res) => {
    const { type, folderId, toUser } = req.body;
    if (!type || !folderId) {
        return res.status(400).json({ success: false, message: "Missing required parameters" });
    }

    const data = getData();

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

        const destUser = data.users.find(u => u.username.toLowerCase() === toUser.toLowerCase() && u.role === 'manager');
        if (!destUser) {
            return res.status(404).json({ success: false, message: "Destination manager not found" });
        }

        // Move folder
        const [folderToMove] = sourceUser.folders.splice(folderIndex, 1);
        if (!destUser.folders) destUser.folders = [];
        destUser.folders.push(folderToMove);

        saveData(data);
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

        saveData(data);
        return res.json({ success: true });
    }

    res.status(400).json({ success: false, message: "Invalid reassignment type" });
});

// API: Get company settings (logo and official name)
app.get('/api/admin/company-info', (req, res) => {
    const { company } = req.query;
    if (!company) return res.status(400).json({ success: false, message: "Company parameter required" });

    const data = getData();
    const companies = data.companies || {};
    const compInfo = companies[company.toLowerCase()] || {
        officialName: "FieldSync Draft",
        logo: "./logo.JPG",
        nameCard: ""
    };

    res.json(compInfo);
});

// API: Save company settings
app.post('/api/admin/company-info', (req, res) => {
    const { company, officialName, logo, nameCard } = req.body;
    if (!company || !officialName) {
        return res.status(400).json({ success: false, message: "Missing required parameters" });
    }

    const data = getData();
    if (!data.companies) data.companies = {};

    data.companies[company.toLowerCase()] = {
        officialName: officialName,
        logo: logo || "./logo.JPG",
        nameCard: nameCard || ""
    };

    saveData(data);
    res.json({ success: true });
});

// API: Add reply to a note
app.post('/api/add-reply', (req, res) => {
    const { username, folderId, noteId, replyContent } = req.body;
    const data = getData();
    
    const user = data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    let note = null;
    data.users.forEach(u => {
        if (u.role === 'manager' && u.folders) {
            u.folders.forEach(f => {
                if (f.notes) {
                    const foundNote = f.notes.find(n => n.id == noteId);
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
        saveData(data);
        return res.json({ success: true });
    }
    res.status(404).json({ success: false, message: "Note not found" });
});

// API: Get Super Admin console data (all users, all unique companies)
app.get('/api/super-admin/data', (req, res) => {
    const data = getData();
    
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
app.post('/api/super-admin/create-company', (req, res) => {
    const { companyName } = req.body;
    if (!companyName) return res.status(400).json({ success: false, message: "Company name is required" });

    const data = getData();
    if (!data.companies) data.companies = {};

    const key = companyName.toLowerCase().trim();
    if (data.companies[key]) {
        return res.status(400).json({ success: false, message: "Company already exists" });
    }

    data.companies[key] = {
        officialName: companyName.trim(),
        logo: "./logo.JPG"
    };

    saveData(data);
    res.json({ success: true });
});

// API: Assign user to company (Super Admin only)
app.post('/api/super-admin/assign-user-company', (req, res) => {
    const { username, company } = req.body;
    if (!username) return res.status(400).json({ success: false, message: "Username is required" });

    const data = getData();
    const user = data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.company = company ? company.trim() : '';
    saveData(data);
    res.json({ success: true });
});

// API: Create new user with any role/company (Super Admin only)
app.post('/api/super-admin/create-user', (req, res) => {
    const { username, password, fullname, role, company } = req.body;
    if (!username || !password || !role) {
        return res.status(400).json({ success: false, message: "Username, password and role are required" });
    }

    const data = getData();
    const exists = data.users.some(u => u.username.toLowerCase() === username.toLowerCase());
    if (exists) {
        return res.status(400).json({ success: false, message: "Username already exists" });
    }

    data.users.push({
        username: username.trim(),
        password: password,
        fullname: fullname ? fullname.trim() : username.trim(),
        role: role,
        company: company ? company.trim() : '',
        folders: []
    });

    saveData(data);
    res.json({ success: true });
});

// API: Get contract details by signature token
app.get('/api/contract-by-token', (req, res) => {
    const { token } = req.query;
    if (!token) return res.status(400).json({ success: false, message: "Token is required" });

    const data = getData();
    let foundContract = null;
    let managerUser = null;
    let projectName = "";

    data.users.forEach(u => {
        if (u.role === 'manager' && u.folders) {
            u.folders.forEach(f => {
                if (f.contracts) {
                    const c = f.contracts.find(c => c.signatureToken === token);
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
app.post('/api/submit-signature', (req, res) => {
    const { token, signature } = req.body;
    if (!token || !signature) {
        return res.status(400).json({ success: false, message: "Token and signature are required" });
    }

    const data = getData();
    let foundContract = null;

    data.users.forEach(u => {
        if (u.role === 'manager' && u.folders) {
            u.folders.forEach(f => {
                if (f.contracts) {
                    const c = f.contracts.find(c => c.signatureToken === token);
                    if (c) {
                        foundContract = c;
                    }
                }
            });
        }
    });

    if (!foundContract) {
        return res.status(404).json({ success: false, message: "Contract not found" });
    }

    foundContract.signature = signature;
    delete foundContract.signatureToken; // remove token once signed

    saveData(data);
    res.json({ success: true });
});

// API: Get all customers across the platform (Super Admin only)
app.get('/api/super-admin/customers', (req, res) => {
    const data = getData();
    const customers = [];

    data.users.forEach(u => {
        if (u.role === 'manager' && u.folders) {
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
app.post('/api/project/update-status', (req, res) => {
    const { folderId, status } = req.body;
    if (!folderId || !status) {
        return res.status(400).json({ success: false, message: "Folder ID and status are required" });
    }

    const validStatuses = ['Draft', 'Signed', 'In-Porgress', 'Done'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const data = getData();
    let folder = null;

    data.users.forEach(u => {
        if (u.role === 'manager' && u.folders) {
            const found = u.folders.find(f => f.id == folderId);
            if (found) folder = found;
        }
    });

    if (!folder) {
        return res.status(404).json({ success: false, message: "Project not found" });
    }

    folder.status = status;
    saveData(data);
    res.json({ success: true });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
