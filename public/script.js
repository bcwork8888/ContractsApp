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
    const sigMethod = document.getElementById('sig-method').value;
    const signLater = sigMethod === 'link';
    const email = document.getElementById('cust-email').value.trim();

    if (signLater) {
        if (!email) {
            return alert("Customer email is required for Sign Later option");
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return alert("Please enter a valid email address");
        }
    }

    if (!signLater) {
        // Validate that signature canvas is not blank
        const ctx = canvas.getContext('2d');
        const pixelBuffer = new Uint32Array(
            ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer
        );
        const isBlank = !pixelBuffer.some(color => color !== 0);
        if (isBlank) {
            return alert("Please sign the contract on the signature pad before saving.");
        }
    }

    const contractData = {
        customer: document.getElementById('cust-name').value.trim(),
        seller: document.getElementById('my-name').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        price: document.getElementById('price').value,
        date: document.getElementById('contract-date').value,
        template: document.getElementById('contract-template').value,
        signLater: signLater,
        email: email,
        signature: signatureImage
    };

    if (!contractData.customer || !contractData.price) return alert("Please fill in the details");

    const res = await fetch('/api/add-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, folderId: currentFolderId, contractData })
    });

    if (res.ok) {
        // Clear canvas and inputs
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        document.getElementById('cust-name').value = '';
        document.getElementById('my-name').value = '';
        document.getElementById('phone').value = '';
        document.getElementById('price').value = '';
        document.getElementById('contract-date').value = '';
        document.getElementById('cust-email').value = '';
        document.getElementById('sig-method').value = 'draw';
        toggleSigMethod();

        navigate('work');
        loadWorkData(); // Refresh both notes and contracts
    }
}

async function loadWorkData() {
    const username = sessionStorage.getItem('username');
    const role = sessionStorage.getItem('role');
    const res = await fetch(`/api/folders?username=${username}`);
    const folders = await res.json();
    const folder = folders.find(f => f.id == currentFolderId);

    if (folder) {
        const select = document.getElementById('project-status-select');
        if (select) {
            select.value = folder.status || 'Draft';
            select.disabled = (role !== 'manager');
        }
    }

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
        if (role === 'super admin') {
            document.getElementById('company-msg').innerHTML = `Workspace: ${company || 'Global'} <a href="#" id="super-admin-link" onclick="navigate('super-admin'); return false;" style="margin-left: 15px; font-size: 14px; color: var(--brand-blue); text-decoration: underline;">[Super Admin Console]</a>`;
        } else if (role === 'admin') {
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
            if (addNoteBtn) addNoteBtn.style.display = 'inline-block';
        } else {
            if (contractsCol) contractsCol.style.display = 'block';
            if (addNoteBtn) addNoteBtn.style.display = 'inline-block';
        }

        const backBtn = document.getElementById('work-back-btn');
        if (backBtn) {
            if (role === 'admin') {
                backBtn.innerText = "← Back to Admin Console";
                backBtn.onclick = () => navigate('admin');
            } else {
                backBtn.innerText = "← Back to Projects";
                backBtn.onclick = () => navigate('dashboard');
            }
        }

        document.getElementById('work-view').classList.remove('hidden');
    } else if (view === 'add-note') {
        document.getElementById('note-text').value = '';
        const previewContainer = document.getElementById('note-photos-preview-container');
        if (previewContainer) previewContainer.innerHTML = '';
        notePhotosData = [];
        document.getElementById('add-note-view').classList.remove('hidden');
    } else if (view === 'add-contract') {
        document.getElementById('add-contract-view').classList.remove('hidden');
        document.getElementById('contract-date').valueAsDate = new Date();
        document.getElementById('my-name').value = sessionStorage.getItem('fullname');
        
        // Reset signature method and clear canvas
        const methodSelect = document.getElementById('sig-method');
        if (methodSelect) {
            methodSelect.value = 'draw';
            toggleSigMethod();
        }
        clearCanvas();
    } else if (view === 'admin') {
        const role = sessionStorage.getItem('role');
        if (role !== 'admin') {
            alert("Unauthorized access");
            return navigate('dashboard');
        }
        document.getElementById('admin-view').classList.remove('hidden');
        loadAdminConsole();
    } else if (view === 'company-info') {
        const role = sessionStorage.getItem('role');
        if (role !== 'admin') {
            alert("Unauthorized access");
            return navigate('dashboard');
        }
        document.getElementById('company-info-view').classList.remove('hidden');
        loadCompanyInfo();
    } else if (view === 'super-admin') {
        const role = sessionStorage.getItem('role');
        if (role !== 'super admin') {
            alert("Unauthorized access");
            return navigate('dashboard');
        }
        document.getElementById('super-admin-view').classList.remove('hidden');
        switchSuperTab('console');
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
        sessionStorage.setItem('companyOfficialName', result.companyOfficialName || "FieldSync Draft");
        sessionStorage.setItem('companyLogo', result.companyLogo || "./logo.JPG");
        sessionStorage.setItem('companyNameCard', result.companyNameCard || "");
        updateHeaderBranding();
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

    const statusOrder = {
        'draft': 0,
        'in-porgress': 1,
        'signed': 2,
        'done': 3
    };
    folders.sort((a, b) => {
        const orderA = statusOrder[(a.status || 'Draft').toLowerCase()] ?? 99;
        const orderB = statusOrder[(b.status || 'Draft').toLowerCase()] ?? 99;
        return orderA - orderB;
    });

    const container = document.getElementById('folder-container');
    container.innerHTML = '';

    folders.forEach(f => {
        const div = document.createElement('div');
        div.className = 'folder-card';
        // Add styling so it looks like a clickable folder
        div.style = "border: 1px solid #000; padding: 20px; cursor: pointer; background: #f9f9f9;";

        div.innerHTML = `<strong>📁 ${f.name}</strong> <span style="font-size: 11px; margin-left: 8px; padding: 2px 6px; border-radius: 4px; background: #e2e8f0; font-weight: bold; color: #475569;">${f.status || 'Draft'}</span>`;

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

    // 3. Load notes/contracts/status
    loadWorkData();

    // 4. Trigger the navigation
    navigate('work');
}

async function saveNote() {
    const content = document.getElementById('note-text').value;
    const username = sessionStorage.getItem('username');

    if (!content && notePhotosData.length === 0) return alert("Note content or photos cannot be empty");

    const res = await fetch('/api/add-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: username,
            folderId: currentFolderId,
            noteContent: content,
            photos: notePhotosData
        })
    });

    if (res.ok) {
        document.getElementById('note-text').value = ''; // Clear input
        const previewContainer = document.getElementById('note-photos-preview-container');
        if (previewContainer) previewContainer.innerHTML = '';
        notePhotosData = [];
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
            <div style="border-bottom: 1px solid #ddd; padding: 15px 10px; margin-bottom: 10px; background: #fafafa; border-radius: 6px;">
                <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 500;">${note.content}</p>
                ${note.photos && note.photos.length > 0 ? `
                    <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 10px;">
                        ${note.photos.map(photo => `
                            <img src="${photo}" style="max-width: 120px; max-height: 120px; object-fit: cover; border-radius: 4px; cursor: pointer; border: 1px solid #ddd;" onclick="viewFullImage('${photo}')">
                        `).join('')}
                    </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <small style="color: #888;">${note.date}</small>
                    <button onclick="toggleReplyForm(${note.id})" style="padding: 2px 8px; font-size: 12px; background: transparent; border: 1px solid var(--border-blue); color: var(--brand-blue); border-radius: 4px; cursor: pointer;">Reply</button>
                </div>
                
                <!-- Replies Thread -->
                <div id="replies-container-${note.id}" style="margin-left: 20px; border-left: 2px solid #e2e8f0; padding-left: 12px; margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">
                    ${note.replies && note.replies.length > 0 ? note.replies.map(reply => `
                        <div style="background: white; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 13.5px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                <strong style="color: #4a5568;">${reply.fullname || reply.username} (${reply.role})</strong>
                                <small style="color: #a0aec0;">${reply.date}</small>
                            </div>
                            <p style="margin: 0; color: #2d3748;">${reply.content}</p>
                        </div>
                    `).join('') : ''}
                </div>
                
                <!-- Inline Reply Form -->
                <div id="reply-form-${note.id}" style="display: none; margin-left: 20px; margin-top: 10px; gap: 8px; align-items: center;">
                    <input type="text" id="reply-input-${note.id}" placeholder="Write a reply..." style="flex: 1; padding: 6px 12px; font-size: 13px; border-radius: 6px; border: 1px solid var(--border-blue);">
                    <button onclick="submitReply(${note.id})" class="btn-primary" style="padding: 6px 12px; font-size: 13px; border-radius: 6px;">Send</button>
                </div>
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
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <a href="#" onclick="openFolder(${proj.id}, '${proj.name.replace(/'/g, "\\'")}'); return false;" style="font-size: 16px; font-weight: bold; color: var(--brand-blue); text-decoration: underline;">📁 ${proj.name}</a>
                    <span style="font-size: 11px; padding: 2px 6px; border-radius: 4px; background: #e2e8f0; font-weight: bold; color: #475569;">${proj.status || 'Draft'}</span>
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

// --- Company Branding & Information Functions ---
function updateHeaderBranding() {
    const officialName = sessionStorage.getItem('companyOfficialName') || "FieldSync Draft";
    const logo = sessionStorage.getItem('companyLogo') || "./logo.JPG";
    const nameCard = sessionStorage.getItem('companyNameCard') || "";
    
    const titleSpan = document.querySelector('.site-title');
    if (titleSpan) titleSpan.innerText = officialName;
    
    const logoImg = document.querySelector('.logo-image');
    if (logoImg) logoImg.src = logo;

    const cardContainer = document.getElementById('company-card-container');
    const cardText = document.getElementById('company-card-text');
    if (cardContainer && cardText) {
        if (nameCard) {
            cardText.innerText = nameCard;
            cardContainer.style.display = 'block';
        } else {
            cardContainer.style.display = 'none';
        }
    }
}

// Auto-run branding update on script load
updateHeaderBranding();

async function loadCompanyInfo() {
    const company = sessionStorage.getItem('company');
    const res = await fetch(`/api/admin/company-info?company=${encodeURIComponent(company)}`);
    if (!res.ok) {
        alert("Failed to load company info");
        return;
    }
    const compInfo = await res.json();
    document.getElementById('company-official-name').value = compInfo.officialName || '';
    document.getElementById('company-name-card').value = compInfo.nameCard || '';

    const preview = document.getElementById('company-logo-preview');
    const previewContainer = document.getElementById('company-logo-preview-container');
    
    const previewLogo = document.getElementById('preview-pdf-logo');
    const previewPlaceholder = document.getElementById('preview-pdf-logo-placeholder');

    if (compInfo.logo) {
        preview.src = compInfo.logo;
        preview.setAttribute('data-original-src', compInfo.logo);
        previewContainer.style.display = 'block';

        if (previewLogo && previewPlaceholder) {
            previewLogo.src = compInfo.logo;
            previewLogo.style.display = 'block';
            previewPlaceholder.style.display = 'none';
        }
    } else {
        preview.src = '';
        previewContainer.style.display = 'none';

        if (previewLogo && previewPlaceholder) {
            previewLogo.style.display = 'none';
            previewPlaceholder.style.display = 'block';
        }
    }
    // Clear file input
    document.getElementById('company-logo-input').value = '';
    
    updateLivePreview();
}

function previewCompanyLogo() {
    const fileInput = document.getElementById('company-logo-input');
    const preview = document.getElementById('company-logo-preview');
    const previewContainer = document.getElementById('company-logo-preview-container');

    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            previewContainer.style.display = 'block';

            // Update live preview panel logo
            const previewLogo = document.getElementById('preview-pdf-logo');
            const previewPlaceholder = document.getElementById('preview-pdf-logo-placeholder');
            if (previewLogo && previewPlaceholder) {
                previewLogo.src = e.target.result;
                previewLogo.style.display = 'block';
                previewPlaceholder.style.display = 'none';
            }
        };
        reader.readAsDataURL(file);
    }
}

async function saveCompanyInfo() {
    const company = sessionStorage.getItem('company');
    const officialName = document.getElementById('company-official-name').value;
    const nameCard = document.getElementById('company-name-card').value;
    const preview = document.getElementById('company-logo-preview');

    if (!officialName) {
        alert("Please enter an official company name.");
        return;
    }

    let logoData = null;
    if (preview.src && preview.src.startsWith('data:')) {
        logoData = preview.src;
    } else if (preview.src) {
        logoData = preview.getAttribute('data-original-src');
    }

    const res = await fetch('/api/admin/company-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            company: company,
            officialName: officialName,
            logo: logoData,
            nameCard: nameCard
        })
    });

    if (res.ok) {
        alert("Company Information saved successfully!");
        sessionStorage.setItem('companyOfficialName', officialName);
        sessionStorage.setItem('companyNameCard', nameCard);
        if (logoData) {
            sessionStorage.setItem('companyLogo', logoData);
        }
        updateHeaderBranding();
        navigate('admin');
    } else {
        alert("Failed to save company information");
    }
}

// --- Note Photos Upload & Lightbox Helpers ---
let notePhotosData = [];

function previewNotePhotos() {
    const fileInput = document.getElementById('note-photos-input');
    const container = document.getElementById('note-photos-preview-container');
    if (!fileInput || !container) return;

    const files = Array.from(fileInput.files);
    
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const dataUrl = e.target.result;
            notePhotosData.push(dataUrl);
            
            const div = document.createElement('div');
            div.style.position = 'relative';
            div.style.display = 'inline-block';
            
            const img = document.createElement('img');
            img.src = dataUrl;
            img.style.width = '80px';
            img.style.height = '80px';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '4px';
            img.style.border = '1px solid #ddd';
            
            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '×';
            removeBtn.style.position = 'absolute';
            removeBtn.style.top = '-5px';
            removeBtn.style.right = '-5px';
            removeBtn.style.background = 'red';
            removeBtn.style.color = 'white';
            removeBtn.style.border = 'none';
            removeBtn.style.borderRadius = '50%';
            removeBtn.style.width = '20px';
            removeBtn.style.height = '20px';
            removeBtn.style.cursor = 'pointer';
            removeBtn.style.fontSize = '12px';
            removeBtn.style.fontWeight = 'bold';
            removeBtn.style.lineHeight = '18px';
            removeBtn.style.padding = '0';
            removeBtn.style.textAlign = 'center';
            
            removeBtn.onclick = function() {
                const idx = notePhotosData.indexOf(dataUrl);
                if (idx > -1) {
                    notePhotosData.splice(idx, 1);
                }
                div.remove();
            };
            
            div.appendChild(img);
            div.appendChild(removeBtn);
            container.appendChild(div);
        };
        reader.readAsDataURL(file);
    });
    
    fileInput.value = '';
}

function viewFullImage(src) {
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('image-modal-content');
    if (modal && modalImg) {
        modalImg.src = src;
        modal.classList.remove('hidden');
    }
}

function closeImageModal() {
    const modal = document.getElementById('image-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function toggleReplyForm(noteId) {
    const form = document.getElementById(`reply-form-${noteId}`);
    if (form) {
        if (form.style.display === 'none' || form.style.display === '') {
            form.style.display = 'flex';
        } else {
            form.style.display = 'none';
        }
    }
}

async function submitReply(noteId) {
    const input = document.getElementById(`reply-input-${noteId}`);
    if (!input) return;

    const content = input.value.trim();
    if (!content) {
        alert("Reply cannot be empty");
        return;
    }

    const username = sessionStorage.getItem('username');
    const res = await fetch('/api/add-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: username,
            folderId: currentFolderId,
            noteId: noteId,
            replyContent: content
        })
    });

    if (res.ok) {
        input.value = '';
        const form = document.getElementById(`reply-form-${noteId}`);
        if (form) form.style.display = 'none';
        loadNotes();
    } else {
        alert("Failed to submit reply");
    }
}

// --- Super Admin Console Functions ---
async function loadSuperAdminConsole() {
    const res = await fetch('/api/super-admin/data');
    if (!res.ok) {
        alert("Failed to load super admin data");
        return;
    }
    const { users, companies } = await res.json();
    
    // Populate the super-new-company select dropdown
    const companySelect = document.getElementById('super-new-company');
    if (companySelect) {
        companySelect.innerHTML = `
            <option value="">Unassigned</option>
            ${companies.map(c => `
                <option value="${c}">${c}</option>
            `).join('')}
        `;
    }

    const container = document.getElementById('super-users-list');
    if (!users || users.length === 0) {
        container.innerHTML = '<p>No users registered.</p>';
        return;
    }
    
    container.innerHTML = users.map(user => {
        const companyOptions = `
            <option value="" ${!user.company ? 'selected' : ''}>Unassigned</option>
            ${companies.map(c => `
                <option value="${c}" ${user.company.toLowerCase() === c.toLowerCase() ? 'selected' : ''}>${c}</option>
            `).join('')}
        `;
        
        return `
            <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; display: flex; justify-content: space-between; align-items: center; gap: 15px;">
                <div>
                    <strong style="font-size: 15px; color: #1e293b;">${user.fullname} (${user.username})</strong>
                    <div style="font-size: 12.5px; color: #64748b; margin-top: 2px;">Role: <strong>${user.role}</strong> | Company: <strong>${user.company || 'Unassigned'}</strong></div>
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <select id="super-assign-select-${user.username}" style="padding: 6px 10px; font-size: 13px; border-radius: 6px; border: 1px solid var(--border-blue);">
                        ${companyOptions}
                    </select>
                    <button onclick="superAssignCompany('${user.username}')" class="btn-primary" style="padding: 6px 12px; font-size: 13px; border-radius: 6px;">Assign</button>
                </div>
            </div>
        `;
    }).join('');
}

async function superCreateCompany() {
    const nameInput = document.getElementById('super-company-name');
    const companyName = nameInput.value.trim();
    if (!companyName) {
        alert("Please enter a company name");
        return;
    }
    
    const res = await fetch('/api/super-admin/create-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName })
    });
    
    if (res.ok) {
        alert(`Company "${companyName}" created successfully!`);
        nameInput.value = '';
        loadSuperAdminConsole();
    } else {
        const error = await res.json();
        alert("Error: " + (error.message || "Failed to create company"));
    }
}

async function superAssignCompany(username) {
    const select = document.getElementById(`super-assign-select-${username}`);
    if (!select) return;
    
    const company = select.value;
    const res = await fetch('/api/super-admin/assign-user-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, company })
    });
    
    if (res.ok) {
        alert("User company reassigned successfully!");
        loadSuperAdminConsole();
    } else {
        alert("Failed to reassign user");
    }
}

async function superCreateUser() {
    const username = document.getElementById('super-new-user').value.trim();
    const password = document.getElementById('super-new-pass').value;
    const fullname = document.getElementById('super-new-fullname').value.trim();
    const role = document.getElementById('super-new-role').value;
    const company = document.getElementById('super-new-company').value;

    if (!username || !password || !role) {
        alert("Please fill in username, password and role");
        return;
    }

    const res = await fetch('/api/super-admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, fullname, role, company })
    });

    if (res.ok) {
        alert(`User "${username}" created successfully!`);
        document.getElementById('super-new-user').value = '';
        document.getElementById('super-new-pass').value = '';
        document.getElementById('super-new-fullname').value = '';
        loadSuperAdminConsole();
    } else {
        const error = await res.json();
        alert("Error: " + (error.message || "Failed to create user"));
    }
}

function updateLivePreview() {
    const officialName = document.getElementById('company-official-name').value.trim() || "Company Name";
    const nameCard = document.getElementById('company-name-card').value.trim() || "Company Name Card Description";

    const previewName = document.getElementById('preview-pdf-company-name');
    const previewCard = document.getElementById('preview-pdf-namecard');

    if (previewName) previewName.innerText = officialName;
    if (previewCard) previewCard.innerText = nameCard;
}

function toggleSigMethod() {
    const method = document.getElementById('sig-method').value;
    const drawSec = document.getElementById('sig-draw-container');
    const linkSec = document.getElementById('sig-link-container');
    if (method === 'draw') {
        if (drawSec) drawSec.style.display = 'flex';
        if (linkSec) linkSec.style.display = 'none';
    } else {
        if (drawSec) drawSec.style.display = 'none';
        if (linkSec) linkSec.style.display = 'flex';
    }
}

function switchSuperTab(tab) {
    const consoleTab = document.getElementById('super-tab-console');
    const customersTab = document.getElementById('super-tab-customers');
    const consoleContent = document.getElementById('super-content-console');
    const customersContent = document.getElementById('super-content-customers');

    if (tab === 'console') {
        if (consoleTab) {
            consoleTab.style.background = 'var(--primary-blue)';
            consoleTab.style.color = 'white';
        }
        if (customersTab) {
            customersTab.style.background = '#f1f5f9';
            customersTab.style.color = '#475569';
        }
        if (consoleContent) consoleContent.classList.remove('hidden');
        if (customersContent) customersContent.classList.add('hidden');
        loadSuperAdminConsole();
    } else {
        if (customersTab) {
            customersTab.style.background = 'var(--primary-blue)';
            customersTab.style.color = 'white';
        }
        if (consoleTab) {
            consoleTab.style.background = '#f1f5f9';
            consoleTab.style.color = '#475569';
        }
        if (customersContent) customersContent.classList.remove('hidden');
        if (consoleContent) consoleContent.classList.add('hidden');
        loadSuperCustomerRegistry();
    }
}

async function loadSuperCustomerRegistry() {
    const res = await fetch('/api/super-admin/customers');
    if (!res.ok) {
        alert("Failed to load customer information");
        return;
    }
    const customers = await res.json();
    const tbody = document.getElementById('super-customer-table-body');
    if (!tbody) return;

    if (!customers || customers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="padding: 15px; text-align: center; color: #64748b;">No customers registered in the database.</td></tr>`;
        return;
    }

    tbody.innerHTML = customers.map(c => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px 10px; font-weight: 600; color: #0f172a;">${c.customer}</td>
            <td style="padding: 12px 10px; color: #475569;">${c.phone || '<span style="color:#cbd5e1; font-style:italic;">None</span>'}</td>
            <td style="padding: 12px 10px; color: #475569;">${c.email || '<span style="color:#cbd5e1; font-style:italic;">None</span>'}</td>
            <td style="padding: 12px 10px; color: #475569;">${c.projectName}</td>
            <td style="padding: 12px 10px; font-weight: 500; color: #1e3a8a;">${c.company || '<span style="color:#cbd5e1;">Unassigned</span>'}</td>
        </tr>
    `).join('');
}

async function updateProjectStatus() {
    const select = document.getElementById('project-status-select');
    if (!select) return;
    const status = select.value;

    const res = await fetch('/api/project/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: currentFolderId, status: status })
    });

    if (res.ok) {
        alert("Project status updated successfully!");
        loadWorkData();
    } else {
        alert("Failed to update project status");
    }
}



