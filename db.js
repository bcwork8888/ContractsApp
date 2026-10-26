require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const DATA_FILE = path.join(__dirname, 'data.json');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const isSupabaseConfigured = Boolean(process.env.USE_LOCAL_DB !== 'true' && process.env.NODE_ENV !== 'test' && supabaseUrl && supabaseKey);
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

        // Auto-seed Supabase if database tables are currently empty
        if (!usersData || usersData.length === 0) {
            console.log('[DB] Supabase database is empty. Auto-seeding initial data from data.json...');
            const localData = readLocalData();
            await saveData(localData);
            return localData;
        }

        const localData = readLocalData();

        const companies = {};
        (companiesData || []).forEach(c => {
            const localComp = localData.companies && localData.companies[c.key];
            companies[c.key] = {
                companyId: c.company_id || (localComp && localComp.companyId) || '',
                officialName: c.official_name,
                logo: c.logo,
                nameCard: c.name_card,
                tier: c.tier
            };
        });

        const users = (usersData || []).map(u => {
            const localUser = (localData.users || []).find(lu => lu.username && lu.username.toLowerCase() === u.username.toLowerCase());
            const userProjects = (projectsData || []).filter(p => p.username && p.username.toLowerCase() === u.username.toLowerCase());
            
            const folders = userProjects.map(p => {
                const localFolder = localUser && localUser.folders && localUser.folders.find(lf => String(lf.id) === String(p.id));
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
                    signatureToken: c.token,
                    signed: Boolean(c.signed),
                    isChangeOrder: Boolean(c.is_change_order || c.isChangeOrder),
                    void: Boolean(c.void),
                    expirationDate: c.expiration_date || c.expirationDate || '',
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
                    payments: (p.payments && Array.isArray(p.payments)) ? p.payments : ((localFolder && localFolder.payments) || []),
                    paymentStatus: p.payment_status || (localFolder && localFolder.paymentStatus) || 'N/A',
                    crewsViewContractPayment: p.crews_view_contract_payment !== undefined ? Boolean(p.crews_view_contract_payment) : Boolean(localFolder && localFolder.crewsViewContractPayment),
                    terminationDoc: p.termination_doc || (localFolder && localFolder.terminationDoc) || null,
                    contracts: projContracts,
                    notes: projNotes
                };
            });

            const userCompKey = (u.company || '').toLowerCase();
            const compObj = companies[userCompKey] || (localData.companies && localData.companies[userCompKey]);
            const resolvedCompanyId = u.company_id || (localUser && localUser.companyId) || (compObj && compObj.companyId) || '';

            return {
                username: u.username,
                password: u.password,
                fullname: u.fullname,
                company: u.company,
                companyId: resolvedCompanyId,
                role: u.role,
                approved: u.approved,
                email: u.email || (localUser && localUser.email) || '',
                cellphone: u.cellphone || (localUser && localUser.cellphone) || '',
                active: u.active !== undefined ? u.active : (localUser && localUser.active !== undefined ? localUser.active : true),
                deactivated: u.deactivated !== undefined ? u.deactivated : (localUser && localUser.deactivated !== undefined ? localUser.deactivated : false),
                denied: u.denied !== undefined ? u.denied : (localUser && localUser.denied !== undefined ? localUser.denied : false),
                resetPasswordToken: (localUser && localUser.resetPasswordToken) || null,
                resetPasswordExpires: (localUser && localUser.resetPasswordExpires) || null,
                folders: folders
            };
        });

        return { users, companies };
    } catch (err) {
        console.error('[DB] Exception querying Supabase:', err);
        return readLocalData();
    }
}

// Asynchronous Data Saver with Fast Batch Upsert
async function saveData(data) {
    writeLocalData(data);

    if (!isSupabaseConfigured) {
        return;
    }

    try {
        // 1. Batch Upsert Companies
        if (data.companies && typeof data.companies === 'object') {
            const companiesList = Object.entries(data.companies).map(([key, comp]) => ({
                key: key,
                official_name: comp.officialName || key,
                logo: comp.logo || './logo.JPG',
                name_card: comp.nameCard || '',
                tier: comp.tier || 'standard'
            }));
            if (companiesList.length > 0) {
                const { error } = await supabase.from('companies').upsert(companiesList, { onConflict: 'key' });
                if (error) console.error('[DB] Supabase batch upsert companies error:', error.message);
            }
        }

        // 2. Prepare Batches for Users, Projects, Contracts, Notes, Replies
        if (data.users && Array.isArray(data.users)) {
            const usersList = [];
            const projectsList = [];
            const contractsList = [];
            const notesList = [];
            const repliesList = [];

            for (const user of data.users) {
                usersList.push({
                    username: user.username.toLowerCase(),
                    password: user.password,
                    fullname: user.fullname || user.username,
                    company: user.company || '',
                    role: user.role || 'user',
                    approved: user.approved !== false
                });

                if (user.folders && Array.isArray(user.folders)) {
                    for (const folder of user.folders) {
                        const folderIdStr = String(folder.id);
                        projectsList.push({
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
                        });

                        if (folder.contracts && Array.isArray(folder.contracts)) {
                            for (const contract of folder.contracts) {
                                contractsList.push({
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
                                    token: contract.token || contract.signatureToken || null,
                                    signed: Boolean(contract.signed),
                                    company_official_name: contract.companyOfficialName || null,
                                    company_logo: contract.companyLogo || null,
                                    company_name_card: contract.companyNameCard || null,
                                    items: contract.items || []
                                });
                            }
                        }

                        if (folder.notes && Array.isArray(folder.notes)) {
                            for (const note of folder.notes) {
                                const noteIdStr = String(note.id);
                                notesList.push({
                                    id: noteIdStr,
                                    folder_id: folderIdStr,
                                    content: note.content || '',
                                    date: note.date || '',
                                    price: note.price ? Number(note.price) : null,
                                    photos: note.photos || []
                                });

                                if (note.replies && Array.isArray(note.replies)) {
                                    for (const reply of note.replies) {
                                        repliesList.push({
                                            id: String(reply.id),
                                            note_id: noteIdStr,
                                            username: reply.username || '',
                                            fullname: reply.fullname || '',
                                            role: reply.role || '',
                                            content: reply.content || '',
                                            date: reply.date || ''
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Sequential table-level batch upserts (satisfying foreign key dependencies)
            if (usersList.length > 0) {
                const { error } = await supabase.from('users').upsert(usersList, { onConflict: 'username' });
                if (error) console.error('[DB] Supabase batch upsert users error:', error.message);
            }

            if (projectsList.length > 0) {
                const { error } = await supabase.from('projects').upsert(projectsList, { onConflict: 'id' });
                if (error) console.error('[DB] Supabase batch upsert projects error:', error.message);
            }

            if (contractsList.length > 0) {
                const { error } = await supabase.from('contracts').upsert(contractsList, { onConflict: 'id' });
                if (error) console.error('[DB] Supabase batch upsert contracts error:', error.message);
            }

            if (notesList.length > 0) {
                const { error } = await supabase.from('notes').upsert(notesList, { onConflict: 'id' });
                if (error) console.error('[DB] Supabase batch upsert notes error:', error.message);
            }

            if (repliesList.length > 0) {
                const { error } = await supabase.from('note_replies').upsert(repliesList, { onConflict: 'id' });
                if (error) console.error('[DB] Supabase batch upsert note_replies error:', error.message);
            }
        }
    } catch (err) {
        console.error('[DB] Error saving data to Supabase:', err);
    }
}

async function testConnection() {
    if (!isSupabaseConfigured) {
        return {
            connected: false,
            mode: 'local_file',
            message: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables are missing on Vercel.'
        };
    }

    try {
        const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
        if (error) {
            return {
                connected: false,
                mode: 'supabase',
                error: error.message,
                message: 'Connected to Supabase client, but failed to query database table.'
            };
        }
        return {
            connected: true,
            mode: 'supabase',
            userCount: count,
            message: 'Successfully connected to Supabase database!'
        };
    } catch (err) {
        return {
            connected: false,
            mode: 'supabase',
            error: err.message,
            message: 'Exception connecting to Supabase.'
        };
    }
}

module.exports = {
    isSupabaseConfigured,
    supabase,
    getData,
    saveData,
    testConnection,
    readLocalData,
    writeLocalData
};
