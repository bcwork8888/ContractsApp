require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const DATA_FILE = path.join(__dirname, 'data.json');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);
let supabase = null;

if (isSupabaseConfigured) {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('[DB] Connected to Supabase Cloud Database');
} else {
    console.log('[DB] Running in local file mode (data.json)');
}

// Local File Helpers
function readLocalData() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            return { users: [], companies: {} };
        }
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (err) {
        console.error('[DB] Error reading local data.json:', err);
        return { users: [], companies: {} };
    }
}

function writeLocalData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        // Ignored in read-only environment
    }
}

// Asynchronous Data Accessor
async function getData() {
    if (!isSupabaseConfigured) {
        return readLocalData();
    }

    try {
        const { data: usersData, error: uErr } = await supabase.from('users').select('*');
        const { data: companiesData, error: cErr } = await supabase.from('companies').select('*');
        const { data: projectsData, error: pErr } = await supabase.from('projects').select('*');
        const { data: contractsData, error: ctErr } = await supabase.from('contracts').select('*');
        const { data: notesData, error: nErr } = await supabase.from('notes').select('*');
        const { data: repliesData, error: rErr } = await supabase.from('note_replies').select('*');

        if (uErr || cErr || pErr || ctErr || nErr || rErr) {
            console.error('[DB] Supabase query error, falling back to local storage:', uErr || cErr || pErr || ctErr || nErr || rErr);
            return readLocalData();
        }

        const companies = {};
        (companiesData || []).forEach(c => {
            companies[c.key] = {
                officialName: c.official_name,
                logo: c.logo,
                nameCard: c.name_card,
                tier: c.tier
            };
        });

        const users = (usersData || []).map(u => {
            const userProjects = (projectsData || []).filter(p => p.username && p.username.toLowerCase() === u.username.toLowerCase());
            
            const folders = userProjects.map(p => {
                const projContracts = (contractsData || []).filter(c => String(c.folder_id) === String(p.id)).map(c => ({
                    id: isNaN(c.id) ? c.id : Number(c.id),
                    customer: c.customer,
                    seller: c.seller,
                    price: c.price,
                    date: c.date,
                    template: c.template,
                    phone: c.phone,
                    email: c.email,
                    signature: c.signature,
                    token: c.token,
                    signed: c.signed,
                    companyOfficialName: c.company_official_name,
                    companyLogo: c.company_logo,
                    companyNameCard: c.company_name_card,
                    items: c.items || []
                }));

                const projNotes = (notesData || []).filter(n => String(n.folder_id) === String(p.id)).map(n => {
                    const noteReplies = (repliesData || []).filter(r => String(r.note_id) === String(n.id)).map(r => ({
                        id: isNaN(r.id) ? r.id : Number(r.id),
                        username: r.username,
                        fullname: r.fullname,
                        role: r.role,
                        content: r.content,
                        date: r.date
                    }));

                    return {
                        id: isNaN(n.id) ? n.id : Number(n.id),
                        content: n.content,
                        date: n.date,
                        price: n.price,
                        photos: n.photos || [],
                        replies: noteReplies
                    };
                });

                return {
                    id: isNaN(p.id) ? p.id : Number(p.id),
                    name: p.name,
                    workingAddress: p.working_address,
                    customerName: p.customer_name,
                    customerPhone: p.customer_phone,
                    customerBillingAddress: p.customer_billing_address,
                    customerEmail: p.customer_email,
                    status: p.status,
                    crew: p.crew,
                    crews: p.crews || [],
                    contracts: projContracts,
                    notes: projNotes
                };
            });

            return {
                username: u.username,
                password: u.password,
                fullname: u.fullname,
                company: u.company,
                role: u.role,
                approved: u.approved,
                folders: folders
            };
        });

        return { users, companies };
    } catch (err) {
        console.error('[DB] Exception querying Supabase:', err);
        return readLocalData();
    }
}

// Asynchronous Data Saver
async function saveData(data) {
    writeLocalData(data);

    if (!isSupabaseConfigured) {
        return;
    }

    try {
        // 1. Sync Companies
        if (data.companies) {
            for (const [key, comp] of Object.entries(data.companies)) {
                await supabase.from('companies').upsert({
                    key: key,
                    official_name: comp.officialName || key,
                    logo: comp.logo || './logo.JPG',
                    name_card: comp.nameCard || '',
                    tier: comp.tier || 'standard'
                }, { onConflict: 'key' });
            }
        }

        // 2. Sync Users & Nested Entities
        if (data.users && Array.isArray(data.users)) {
            for (const user of data.users) {
                await supabase.from('users').upsert({
                    username: user.username.toLowerCase(),
                    password: user.password,
                    fullname: user.fullname || user.username,
                    company: user.company || '',
                    role: user.role || 'user',
                    approved: user.approved !== false
                }, { onConflict: 'username' });

                if (user.folders && Array.isArray(user.folders)) {
                    for (const folder of user.folders) {
                        const folderIdStr = String(folder.id);
                        await supabase.from('projects').upsert({
                            id: folderIdStr,
                            username: user.username.toLowerCase(),
                            name: folder.name,
                            working_address: folder.workingAddress || '',
                            customer_name: folder.customerName || '',
                            customer_phone: folder.customerPhone || '',
                            customer_billing_address: folder.customerBillingAddress || '',
                            customer_email: folder.customerEmail || '',
                            status: folder.status || 'Draft',
                            crew: folder.crew || null,
                            crews: folder.crews || []
                        }, { onConflict: 'id' });

                        if (folder.contracts && Array.isArray(folder.contracts)) {
                            for (const contract of folder.contracts) {
                                await supabase.from('contracts').upsert({
                                    id: String(contract.id),
                                    folder_id: folderIdStr,
                                    customer: contract.customer || '',
                                    seller: contract.seller || '',
                                    price: contract.price ? Number(contract.price) : 0,
                                    date: contract.date || '',
                                    template: contract.template || 'company_default',
                                    phone: contract.phone || '',
                                    email: contract.email || '',
                                    signature: contract.signature || '',
                                    token: contract.token || null,
                                    signed: Boolean(contract.signed),
                                    company_official_name: contract.companyOfficialName || null,
                                    company_logo: contract.companyLogo || null,
                                    company_name_card: contract.companyNameCard || null,
                                    items: contract.items || []
                                }, { onConflict: 'id' });
                            }
                        }

                        if (folder.notes && Array.isArray(folder.notes)) {
                            for (const note of folder.notes) {
                                const noteIdStr = String(note.id);
                                await supabase.from('notes').upsert({
                                    id: noteIdStr,
                                    folder_id: folderIdStr,
                                    content: note.content || '',
                                    date: note.date || '',
                                    price: note.price ? Number(note.price) : null,
                                    photos: note.photos || []
                                }, { onConflict: 'id' });

                                if (note.replies && Array.isArray(note.replies)) {
                                    for (const reply of note.replies) {
                                        await supabase.from('note_replies').upsert({
                                            id: String(reply.id),
                                            note_id: noteIdStr,
                                            username: reply.username || '',
                                            fullname: reply.fullname || '',
                                            role: reply.role || '',
                                            content: reply.content || '',
                                            date: reply.date || ''
                                        }, { onConflict: 'id' });
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    } catch (err) {
        console.error('[DB] Error saving data to Supabase:', err);
    }
}

module.exports = {
    isSupabaseConfigured,
    supabase,
    getData,
    saveData,
    readLocalData,
    writeLocalData
};
