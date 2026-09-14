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

// Fallback Local File Helpers
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
        console.error('[DB] Error writing to local data.json:', err);
    }
}

// Global store accessor for legacy sync routes
async function getFullData() {
    if (!isSupabaseConfigured) {
        return readLocalData();
    }

    // Assemble full JSON from Supabase tables
    const { data: usersData } = await supabase.from('users').select('*');
    const { data: companiesData } = await supabase.from('companies').select('*');
    const { data: projectsData } = await supabase.from('projects').select('*');
    const { data: contractsData } = await supabase.from('contracts').select('*');
    const { data: notesData } = await supabase.from('notes').select('*');
    const { data: repliesData } = await supabase.from('note_replies').select('*');

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
        const userProjects = (projectsData || []).filter(p => p.username.toLowerCase() === u.username.toLowerCase());
        
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
}

async function saveFullData(data) {
    if (!isSupabaseConfigured) {
        return writeLocalData(data);
    }
    // In Supabase mode, granular sync functions are used instead of rewriting the entire database
}

module.exports = {
    isSupabaseConfigured,
    supabase,
    getFullData,
    saveFullData,
    readLocalData,
    writeLocalData
};
