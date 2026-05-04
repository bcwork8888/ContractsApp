const express = require('express');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const app = express();
const PORT = 8888;

app.use(express.json());
app.use(express.static('public')); // Serves your HTML/JS

// Helper to read JSON
const getData = () => JSON.parse(fs.readFileSync('data.json'));
// Helper to write JSON
const saveData = (data) => fs.writeFileSync('data.json', JSON.stringify(data, null, 2));

// API: Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const data = getData();
    const user = data.users.find(u => u.username === username && u.password === password);
    
    if (user) {
        res.json({ success: true, folders: user.folders, fullname: user.fullname});
    } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
    }
});

// API: Add Folder
app.post('/api/add-folder', (req, res) => {
    const { username, folderName } = req.body;
    const data = getData();
    const user = data.users.find(u => u.username === username);

    const newFolder = { id: Date.now(), name: folderName, contracts: [], notes: [] };
    user.folders.push(newFolder);
    saveData(data);
    res.json(newFolder);
});

// API: Sign Up
app.post('/api/signup', (req, res) => {
    const { username, password } = req.body;
    const data = getData();

    // Check if user already exists
    const existingUser = data.users.find(u => u.username === username);
    if (existingUser) {
        return res.status(400).json({ success: false, message: "User already exists" });
    }

    // Create new user object
    const newUser = {
        username: username,
        password: password,
        folders: [] // Start with an empty list of folders
    };

    data.users.push(newUser);
    saveData(data);
    res.json({ success: true });
});

// API: Get user folders
app.get('/api/folders', (req, res) => {
    const { username } = req.query;
    const data = getData();
    const user = data.users.find(u => u.username === username);
    res.json(user ? user.folders : []);
});

app.post('/api/add-note', (req, res) => {
    const { username, folderId, noteContent } = req.body;
    const data = getData();
    const user = data.users.find(u => u.username === username);

    if (user) {
        // Find the folder by its ID (ensure both are Numbers or Strings)
        const folder = user.folders.find(f => f.id == folderId);
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
    }
    res.status(404).json({ success: false, message: "Folder or User not found" });
});

app.post('/api/add-contract', (req, res) => {
    const { username, folderId, contractData } = req.body;
    const data = getData();
    const user = data.users.find(u => u.username === username);

    if (user) {
        const folder = user.folders.find(f => f.id == folderId);
        if (folder) {
            if (!folder.contracts) folder.contracts = [];

            folder.contracts.push({
                id: Date.now(),
                ...contractData // includes customer, seller, price, date
            });

            saveData(data);
            return res.json({ success: true });
        }
    }
    res.status(404).json({ success: false });
});

// API: Generate PDF for a specific contract
app.get('/api/view-pdf', (req, res) => {
    const { username, folderId, contractId } = req.query;
    const data = getData();
    const user = data.users.find(u => u.username === username);

    if (!user) return res.status(404).send("User not found");

    const folder = user.folders.find(f => f.id == folderId);
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

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
