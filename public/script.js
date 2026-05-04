let currentUser = null;


// Function to generate the 10 text fields in the popup
function openContractModal() {
    const container = document.getElementById('modal-fields');
    container.innerHTML = ''; // Clear old fields

    for (let i = 1; i <= 10; i++) {
        const input = document.createElement('input');
        input.placeholder = `Text field ${i}`;
        input.className = "contract-input";
        container.appendChild(input);
    }
    document.getElementById('modal').style.display = 'block';
}

async function saveContract() {
    const username = sessionStorage.getItem('username');
    const canvas = document.getElementById('sig-canvas');
    const signatureImage = canvas.toDataURL('image/png');
    const contractData = {
        customer: document.getElementById('cust-name').value,
        seller: document.getElementById('my-name').value,
        price: document.getElementById('price').value,
        date: document.getElementById('contract-date').value,
        signature: signatureImage
    };

    if (!contractData.customer || !contractData.price) return alert("Please fill in the details");

    const res = await fetch('/api/add-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, folderId: currentFolderId, contractData })
    });

    if (res.ok) {
        // Clear inputs
        // Clear canvas and inputs
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        document.getElementById('cust-name').value = '';
        document.getElementById('my-name').value = '';
        document.getElementById('price').value = '';
        document.getElementById('contract-date').value = '';

        navigate('work');
        loadWorkData(); // Refresh both notes and contracts
    }
}

async function loadWorkData() {
    const username = sessionStorage.getItem('username');
    const res = await fetch(`/api/folders?username=${username}`);
    const folders = await res.json();
    const folder = folders.find(f => f.id == currentFolderId);

    // Render Contracts
    loadContracts();

    // Call your existing loadNotes logic here or merge them
    loadNotes();
}

// Helper to switch views
function toggleView(viewId) {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('signup-section').classList.add('hidden');
    document.getElementById(viewId).classList.remove('hidden');
}

async function signup() {
    const user = document.getElementById('new-user').value;
    const pass = document.getElementById('new-pass').value;

    if (!user || !pass) return alert("Please fill in all fields");

    const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass })
    });

    const result = await res.json();

    if (result.success) {
        alert("Account created! Please login.");
        toggleView('login-section');
    } else {
        alert(result.message);
    }
}

// Central navigation function
function navigate(view) {
    document.querySelectorAll('div[id$="-view"], div[id$="-section"]').forEach(div => {
        div.classList.add('hidden');
    });

    // Show the requested view
    if (view === 'dashboard') {
        document.getElementById('dashboard-view').classList.remove('hidden');
        loadFolders(); // Refresh list from server
    } else if (view === 'add-project') {
        document.getElementById('add-project-view').classList.remove('hidden');
    } else if (view === 'login') {
        document.getElementById('login-section').classList.remove('hidden');
    } else if (view === 'work') {
        document.getElementById('work-view').classList.remove('hidden');
    } else if (view === 'add-note') {
        document.getElementById('add-note-view').classList.remove('hidden');
    } else if (view === 'add-contract') {
        document.getElementById('add-contract-view').classList.remove('hidden');
        document.getElementById('contract-date').valueAsDate = new Date();
        document.getElementById('my-name').value = sessionStorage.getItem('fullname');
    }
}

// Updated Login function to "redirect"
async function login() {
    const user = document.getElementById('user').value;
    const pass = document.getElementById('pass').value;

    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass})
    });

    if (res.ok) {
        const result = await res.json();
        sessionStorage.setItem('username', user); // Store user in session
        sessionStorage.setItem('fullname', result.fullname);
        navigate('dashboard');
    } else {
        alert("Login failed");
    }
}

// Fetch and display folders
async function loadFolders() {
    const username = sessionStorage.getItem('username');
    const res = await fetch(`/api/folders?username=${username}`);
    const folders = await res.json();

    const container = document.getElementById('folder-container');
    container.innerHTML = '';

    folders.forEach(f => {
        const div = document.createElement('div');
        div.className = 'folder-card';
        // Add styling so it looks like a clickable folder
        div.style = "border: 1px solid #000; padding: 20px; cursor: pointer; background: #f9f9f9;";

        div.innerHTML = `<strong>📁 ${f.name}</strong>`;

        // This is the trigger that "redirects" you
        div.onclick = () => openFolder(f.id, f.name);

        container.appendChild(div);
    });
}
// Save the new project and go back
async function saveNewProject() {
    const name = document.getElementById('project-name').value;
    const username = sessionStorage.getItem('username');

    await fetch('/api/add-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, folderName: name })
    });

    document.getElementById('project-name').value = ''; // Clear input
    navigate('dashboard');
}

let currentFolderId = null;

// Called when a folder card is clicked
function openFolder(folderId, folderName) {
    // 1. Store the current folder context
    currentFolderId = folderId;

    // 2. Update the header on the Work View page
    const title = document.getElementById('folder-title');
    if (title) title.innerText = `Project: ${folderName}`;

    // 3. Clear out old notes/contracts from previous views
    loadContracts();
    loadNotes();

    // 4. Trigger the navigation
    navigate('work');
}

async function saveNote() {
    const content = document.getElementById('note-text').value;
    const username = sessionStorage.getItem('username');

    if (!content) return alert("Note cannot be empty");

    const res = await fetch('/api/add-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: username,
            folderId: currentFolderId,
            noteContent: content
        })
    });

    if (res.ok) {
        document.getElementById('note-text').value = ''; // Clear input
        navigate('work');
        loadWorkData();
    }
}

async function loadNotes() {
    const username = sessionStorage.getItem('username');
    // Fetch folders to get the latest notes for the current folder
    const res = await fetch(`/api/folders?username=${username}`);
    const folders = await res.json();

    const folder = folders.find(f => f.id == currentFolderId);
    const container = document.getElementById('notes-list');

    if (folder && folder.notes && folder.notes.length > 0) {
        container.innerHTML = folder.notes.map(note => `
            <div style="border-bottom: 1px solid #ddd; padding: 10px; margin-bottom: 5px;">
                <p>${note.content}</p>
                <small style="color: #888;">${note.date}</small>
            </div>
        `).join('');
    } else {
        container.innerHTML = '<p>No notes found for this project.</p>';
    }
}

async function loadContracts() {
    const username = sessionStorage.getItem('username');
    // Fetch folders to get the latest notes for the current folder
    const res = await fetch(`/api/folders?username=${username}`);
    const folders = await res.json();

    const folder = folders.find(f => f.id == currentFolderId);
    const container = document.getElementById('contracts-list');

    if (folder && folder.contracts && folder.contracts.length > 0) {
        container.innerHTML = folder.contracts.map(contract => `
            <div style="border-bottom: 1px solid #ddd; padding: 10px; margin-bottom: 5px;">
                <p>Customer: ${contract.customer}</p>
                <p>
                    <strong>Price:</strong> 
                    <a href="/api/view-pdf?username=${username}&folderId=${currentFolderId}&contractId=${contract.id}" target="_blank" style="color: blue; text-decoration: underline;">
                        $${contract.price}
                    </a>
                </p>
                
                <small style="color: #888;">Date: ${contract.date}</small>
            </div>
        `).join('');
    } else {
        container.innerHTML = '<p>No contracts found for this project.</p>';
    }
}

const canvas = document.getElementById('sig-canvas');
const ctx = canvas.getContext('2d');
let writing = false;

canvas.onmousedown = () => writing = true;
canvas.onmouseup = () => writing = false;
canvas.onmousemove = (e) => {
    if (!writing) return;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
};

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
}

// When saving, convert the drawing to a string to store in JSON
function getSignatureImage() {
    return canvas.toDataURL(); // Converts drawing to a Base64 string
}



