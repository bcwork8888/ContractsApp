require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file to run migration.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const dataFile = path.join(__dirname, '..', 'data.json');

async function migrate() {
    console.log('🚀 Starting migration from data.json to Supabase...');

    if (!fs.existsSync(dataFile)) {
        console.error('❌ data.json file not found at:', dataFile);
        process.exit(1);
    }

    const rawData = fs.readFileSync(dataFile, 'utf8');
    const data = JSON.parse(rawData);

    // 1. Migrate Companies
    if (data.companies) {
        console.log('📦 Migrating companies...');
        for (const [key, comp] of Object.entries(data.companies)) {
            const { error } = await supabase.from('companies').upsert({
                key: key,
                official_name: comp.officialName || key,
                logo: comp.logo || './logo.JPG',
                name_card: comp.nameCard || '',
                tier: comp.tier || 'standard'
            }, { onConflict: 'key' });

            if (error) console.error(`  ⚠️ Company ${key} migration error:`, error.message);
        }
    }

    // 2. Migrate Users, Projects, Contracts, Notes
    if (data.users && Array.isArray(data.users)) {
        console.log('👥 Migrating users and nested projects...');
        for (const user of data.users) {
            const { error: userError } = await supabase.from('users').upsert({
                username: user.username.toLowerCase(),
                password: user.password,
                fullname: user.fullname || user.username,
                company: user.company || '',
                role: user.role || 'user',
                approved: user.approved !== false
            }, { onConflict: 'username' });

            if (userError) {
                console.error(`  ⚠️ User ${user.username} migration error:`, userError.message);
                continue;
            }

            if (user.folders && Array.isArray(user.folders)) {
                for (const folder of user.folders) {
                    const folderIdStr = String(folder.id);
                    const { error: projError } = await supabase.from('projects').upsert({
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

                    if (projError) {
                        console.error(`    ⚠️ Project ${folder.name} (${folderIdStr}) error:`, projError.message);
                        continue;
                    }

                    // Migrate Contracts
                    if (folder.contracts && Array.isArray(folder.contracts)) {
                        for (const contract of folder.contracts) {
                            const contractIdStr = String(contract.id);
                            await supabase.from('contracts').upsert({
                                id: contractIdStr,
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

                    // Migrate Notes
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

                            // Migrate Note Replies
                            if (note.replies && Array.isArray(note.replies)) {
                                for (const reply of note.replies) {
                                    const replyIdStr = String(reply.id);
                                    await supabase.from('note_replies').upsert({
                                        id: replyIdStr,
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

    console.log('✅ Migration to Supabase finished successfully!');
}

migrate().catch(err => {
    console.error('❌ Migration failed:', err);
});
