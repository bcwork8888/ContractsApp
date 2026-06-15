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
    const fullname = document.getElementById('signup-fullname').value;
    const company = document.getElementById('signup-company').value;
    const role = document.getElementById('signup-role').value;

    if (!user || !pass) return alert("Please fill in all fields");

    const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass, fullname, company, role })
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
        const fullname = sessionStorage.getItem('fullname');
        const company = sessionStorage.getItem('company');
        const role = sessionStorage.getItem('role');

        document.getElementById('welcome-msg').innerText = `Welcome, ${fullname} (${role})`;
        if (role === 'admin') {
            document.getElementById('company-msg').innerHTML = `Workspace: ${company} <a href="#" id="admin-link" onclick="navigate('admin'); return false;" style="margin-left: 15px; font-size: 14px; color: var(--brand-blue); text-decoration: underline;">[Admin Console]</a>`;
        } else {
            document.getElementById('company-msg').innerText = `Workspace: ${company}`;
        }
        
        const userNameSpan = document.querySelector('.user-name');
        if (userNameSpan) userNameSpan.innerText = fullname;

        const addProjBtn = document.getElementById('add-project-btn');
        if (addProjBtn) {
            addProjBtn.style.display = (role === 'crew') ? 'none' : 'inline-block';
        }

        document.getElementById('dashboard-view').classList.remove('hidden');
        loadFolders(); // Refresh list from server
    } else if (view === 'add-project') {
        document.getElementById('add-project-view').classList.remove('hidden');
    } else if (view === 'login') {
        document.getElementById('login-section').classList.remove('hidden');
    } else if (view === 'work') {
        const role = sessionStorage.getItem('role');
        const contractsCol = document.getElementById('contracts-column');
        const addNoteBtn = document.getElementById('add-note-btn');

        if (role === 'crew') {
            if (contractsCol) contractsCol.style.display = 'none';
            if (addNoteBtn) addNoteBtn.style.display = 'none';
        } else {
            if (contractsCol) contractsCol.style.display = 'block';
            if (addNoteBtn) addNoteBtn.style.display = 'inline-block';
        }

        document.getElementById('work-view').classList.remove('hidden');
    } else if (view === 'add-note') {
        document.getElementById('add-note-view').classList.remove('hidden');
    } else if (view === 'add-contract') {
        document.getElementById('add-contract-view').classList.remove('hidden');
        document.getElementById('contract-date').valueAsDate = new Date();
        document.getElementById('my-name').value = sessionStorage.getItem('fullname');
    } else if (view === 'admin') {
        const role = sessionStorage.getItem('role');
        if (role !== 'admin') {
            alert("Unauthorized access");
            return navigate('dashboard');
        }
        document.getElementById('admin-view').classList.remove('hidden');
        loadAdminConsole();
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
        sessionStorage.setItem('username', result.username);
        sessionStorage.setItem('fullname', result.fullname);
        sessionStorage.setItem('company', result.company);
        sessionStorage.setItem('role', result.role);
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

// --- Voice Input (Speech-to-Text) Implementation ---
function initVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        return; // Speech recognition not supported in this browser
    }

    // Find all text inputs and textareas
    const targets = document.querySelectorAll('input[type="text"], textarea');
    targets.forEach(input => {
        // Skip if already initialized
        if (input.dataset.voiceInit === "true") return;
        input.dataset.voiceInit = "true";

        // Create container wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'input-voice-wrapper';
        
        // Insert wrapper before input
        input.parentNode.insertBefore(wrapper, input);
        // Move input inside wrapper
        wrapper.appendChild(input);

        // Create mic button
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'voice-input-btn';
        btn.title = 'Voice Input';
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="22"></line>
            </svg>
        `;

        wrapper.appendChild(btn);

        // Initialize SpeechRecognition
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = navigator.language || 'zh-CN';

        let isListening = false;

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isListening) {
                rec.stop();
            } else {
                // Stop any other active instances first
                document.querySelectorAll('.voice-input-btn.listening').forEach(activeBtn => {
                    activeBtn.click();
                });
                rec.start();
            }
        });

        rec.onstart = () => {
            isListening = true;
            btn.classList.add('listening');
            input.placeholder = "Listening...";
        };

        rec.onresult = (event) => {
            const text = event.results[0][0].transcript;
            if (input.value) {
                input.value += ' ' + text;
            } else {
                input.value = text;
            }
            // Trigger input and change events to update bindings/listeners
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        };

        rec.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            btn.classList.remove('listening');
            isListening = false;
        };

        rec.onend = () => {
            btn.classList.remove('listening');
            isListening = false;
            input.placeholder = input.getAttribute('placeholder') || '';
        };
    });
}

// Initialize on script load
initVoiceInput();

// Setup MutationObserver to watch for dynamically added text fields
const voiceObserver = new MutationObserver(() => {
    initVoiceInput();
});
voiceObserver.observe(document.body, { childList: true, subtree: true });

// --- Admin Console Functions ---
async function loadAdminConsole() {
    const company = sessionStorage.getItem('company');
    document.getElementById('admin-company-title').innerText = `Workspace Company: ${company}`;

    const res = await fetch(`/api/admin/company-data?company=${encodeURIComponent(company)}`);
    if (!res.ok) {
        alert("Failed to load admin data");
        return;
    }
    const { managers, crews, projects } = await res.json();

    const container = document.getElementById('admin-projects-list');
    if (!projects || projects.length === 0) {
        container.innerHTML = '<p>No projects found in this company.</p>';
        return;
    }

    container.innerHTML = projects.map(proj => {
        // Generate options for managers
        const managerOptionsHtml = managers.map(m => {
            const selected = m.username.toLowerCase() === proj.managerUsername.toLowerCase() ? 'selected' : '';
            return `<option value="${m.username}" ${selected}>${m.fullname} (${m.username})</option>`;
        }).join('');

        // Generate options for crews (including Unassigned)
        const crewOptionsHtml = `
            <option value="" ${!proj.crewUsername ? 'selected' : ''}>Unassigned</option>
            ${crews.map(c => {
                const selected = c.username.toLowerCase() === proj.crewUsername.toLowerCase() ? 'selected' : '';
                return `<option value="${c.username}" ${selected}>${c.fullname} (${c.username})</option>`;
            }).join('')}
        `;

        return `
            <div class="project-admin-card" style="border: 1px solid var(--border-blue); padding: 18px; margin-bottom: 15px; border-radius: 8px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 12px;">
                <div>
                    <strong style="font-size: 16px; color: var(--primary-blue);">📁 ${proj.name}</strong>
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 20px; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 10px;">
                    <!-- Manager Assignment -->
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <span style="font-size: 13px; font-weight: 600;">Manager:</span>
                        <select id="reassign-mgr-select-${proj.id}" style="padding: 4px 8px; font-size: 13px; border-radius: 6px; border: 1px solid var(--border-blue);">
                            ${managerOptionsHtml}
                        </select>
                        <button onclick="reassignProject('manager', ${proj.id})" class="btn-primary" style="padding: 4px 10px; font-size: 12px; border-radius: 6px;">
                            Assign Manager
                        </button>
                    </div>
                    <!-- Crew Assignment -->
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <span style="font-size: 13px; font-weight: 600;">Crew:</span>
                        <select id="reassign-crew-select-${proj.id}" style="padding: 4px 8px; font-size: 13px; border-radius: 6px; border: 1px solid var(--border-blue);">
                            ${crewOptionsHtml}
                        </select>
                        <button onclick="reassignProject('crew', ${proj.id})" class="btn-primary" style="padding: 4px 10px; font-size: 12px; border-radius: 6px;">
                            Assign Crew
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function reassignProject(type, folderId) {
    const selectEl = document.getElementById(`reassign-${type === 'manager' ? 'mgr' : 'crew'}-select-${folderId}`);
    const toUser = selectEl.value;

    if (!confirm(`Are you sure you want to change the ${type} of this project?`)) {
        return;
    }

    const res = await fetch('/api/admin/reassign-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, folderId, toUser })
    });

    if (res.ok) {
        alert(`${type.charAt(0).toUpperCase() + type.slice(1)} reassigned successfully!`);
        loadAdminConsole();
    } else {
        const error = await res.json();
        alert("Error: " + (error.message || "Failed to reassign"));
    }
}



