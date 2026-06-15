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

// API: Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const data = getData();
    const user = data.users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    
    if (user) {
        res.json({
            success: true,
            username: user.username,
            fullname: user.fullname || user.username,
            company: user.company || '',
            role: user.role || 'user',
            folders: user.folders
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

    const newFolder = { id: Date.now(), name: folderName, contracts: [], notes: [] };
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
            res.json(assignedFolders);
        } else {
            res.json(user.folders || []);
        }
    } else {
        res.status(404).json({ success: false, message: "User not found" });
    }
});

app.post('/api/add-note', (req, res) => {
    const { username, folderId, noteContent } = req.body;
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
            date: new Date().toLocaleString()
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

        folder.contracts.push({
            id: Date.now(),
            ...contractData // includes customer, seller, price, date
        });

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
    data.users.forEach(u => {
        if (u.role === 'manager' && u.folders) {
            const found = u.folders.find(f => f.id == folderId);
            if (found) folder = found;
        }
    });

    if (!folder) return res.status(404).send("Folder not found");
    const contract = folder.contracts.find(c => c.id == contractId);
    if (!contract) return res.status(404).send("Contract not found");

    // Create a PDF Document
    const doc = new PDFDocument();

    // Set the filename that appears in the browser tab
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=contract_${contract.id}.pdf`);

    doc.pipe(res); // Pipe the PDF directly to the response

    // --- Draw the PDF Content ---
    doc.fontSize(25).text('OFFICIAL CONTRACT', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Project: ${folder.name}`);
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
        doc.text('Customer Signature:');

        // Remove the "data:image/png;base64," prefix to get raw base64
        const base64Data = contract.signature.replace(/^data:image\/png;base64,/, "");

        // Convert base64 string to a Buffer (the format PDFKit needs)
        const imgBuffer = Buffer.from(base64Data, 'base64');

        // Draw the image onto the PDF
        doc.image(imgBuffer, {
            width: 150, // Resize the signature to fit nicely
            align: 'left'
        });
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
                    crewName: f.crew ? (data.users.find(usr => usr.username.toLowerCase() === f.crew.toLowerCase())?.fullname || f.crew) : 'None'
                });
            });
        }
    });

    res.json({ managers, crews, projects });
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

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
