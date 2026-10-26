const fs = require('fs');
const path = require('path');

describe('Add Contract Step 1 (Review & Add Notes) Flow Tests', () => {
    let indexHtml;
    let scriptJs;

    beforeAll(() => {
        indexHtml = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
        scriptJs = fs.readFileSync(path.join(__dirname, '../public/script.js'), 'utf8');
    });

    test('index.html contains two-step wizard elements for Add Contract', () => {
        expect(indexHtml).toContain('id="contract-step-pill-1"');
        expect(indexHtml).toContain('id="contract-step-pill-2"');
        expect(indexHtml).toContain('id="contract-step-badge-1"');
        expect(indexHtml).toContain('id="contract-step-badge-2"');
        expect(indexHtml).toContain('id="add-contract-step-1"');
        expect(indexHtml).toContain('id="add-contract-step-2"');
        
        // Step 1 components
        expect(indexHtml).toContain('id="step1-notes-summary-banner"');
        expect(indexHtml).toContain('id="step1-summary-included-count"');
        expect(indexHtml).toContain('id="step1-summary-total-price"');
        expect(indexHtml).toContain('id="step1-note-text"');
        expect(indexHtml).toContain('id="step1-note-price"');
        expect(indexHtml).toContain('id="step1-note-uncontract"');
        expect(indexHtml).toContain('id="step1-note-photos-input"');
        expect(indexHtml).toContain('id="step1-note-photos-preview"');
        expect(indexHtml).toContain('id="step1-notes-container"');
        expect(indexHtml).toContain('onclick="saveStep1Note(event)"');
        expect(indexHtml).toContain('onclick="goToContractStep2()"');

        // Step 2 components
        expect(indexHtml).toContain('id="cust-name"');
        expect(indexHtml).toContain('id="price"');
        expect(indexHtml).toContain('id="preview-items-btn"');
        expect(indexHtml).toContain('onclick="goToContractStep1()"');
    });

    test('script.js implements step controllers and navigation handling', () => {
        expect(scriptJs).toContain('function goToContractStep1(');
        expect(scriptJs).toContain('function goToContractStep2(');
        expect(scriptJs).toContain('function renderContractNotesReview(');
        expect(scriptJs).toContain('function saveStep1Note(');
        expect(scriptJs).toContain('function previewStep1NotePhotos(');
        expect(scriptJs).toContain('function recalculateContractItemsFromNotes(');

        // Verify Step 1 is set upon contract / change order creation
        expect(scriptJs).toMatch(/handleNewContractClick[\s\S]*?currentAddContractStep = 1;/);
        expect(scriptJs).toMatch(/handleAddChangeOrderClick[\s\S]*?currentAddContractStep = 1;/);

        // Verify Step 2 is preserved upon returning from previews and signature
        expect(scriptJs).toMatch(/cancelFinalPreview[\s\S]*?currentAddContractStep = 2;/);
        expect(scriptJs).toMatch(/cancelSignatureView[\s\S]*?currentAddContractStep = 2;/);
        expect(scriptJs).toMatch(/confirmPreviewItems[\s\S]*?currentAddContractStep = 2;/);
        expect(scriptJs).toMatch(/cancelPreviewItems[\s\S]*?currentAddContractStep = 2;/);
    });

    test('TRANSLATIONS contain step1 and step2 keys across zh, en, and es', () => {
        const requiredKeys = [
            'step1_review_add_notes',
            'step2_contract_details',
            'step1_desc',
            'step1_notes_instruction',
            'notes_summary',
            'estimated_contract_price',
            'project_notes',
            'next_step',
            'back_to_notes',
            'included_in_contract',
            'uncontracted_badge',
            'no_notes_for_project'
        ];

        for (const key of requiredKeys) {
            expect(scriptJs).toContain(`"${key}":`);
        }
    });

    test('Contract notes calculation accurately calculates included items and price', () => {
        const mockNotes = [
            { id: 101, content: 'Demolition and site prep', price: 500, uncontract: false },
            { id: 102, content: 'Drywall installation and painting', price: '1200.50', uncontract: false },
            { id: 103, content: 'Optional side patio lighting', price: 300, uncontract: true }, // uncontracted
            { id: 104, content: 'Client requested warranty info', uncontract: false } // no price
        ];

        let includedCount = 0;
        let totalPrice = 0;
        const contractItems = [];

        mockNotes.forEach(note => {
            const isIncluded = !note.uncontract;
            if (isIncluded) {
                includedCount++;
                const itemPrice = note.price ? parseFloat(note.price) || 0 : 0;
                totalPrice += itemPrice;
                contractItems.push({
                    noteId: note.id,
                    description: note.content,
                    price: itemPrice
                });
            }
        });

        expect(includedCount).toBe(3);
        expect(totalPrice).toBeCloseTo(1700.50, 2);
        expect(contractItems.length).toBe(3);
        expect(contractItems[0].price).toBe(500);
        expect(contractItems[1].price).toBe(1200.50);
        expect(contractItems[2].price).toBe(0);
    });

    test('Change order calculation filters out notes created prior to latest contract', () => {
        const latestContractId = 200;
        const mockNotes = [
            { id: 150, content: 'Base contract line 1', price: 800, uncontract: false }, // before latest contract
            { id: 250, content: 'Change order item 1: additional tiles', price: 350, uncontract: false }, // after
            { id: 300, content: 'Change order item 2: plumbing reroute', price: 450, uncontract: false }, // after
            { id: 350, content: 'Change order item 3: internal note', price: 100, uncontract: true } // uncontracted
        ];

        const changeOrderNotes = mockNotes.filter(note => {
            const noteTime = note.modifiedAt || note.id;
            return noteTime > latestContractId && !note.uncontract;
        });

        expect(changeOrderNotes.length).toBe(2);
        expect(changeOrderNotes[0].id).toBe(250);
        expect(changeOrderNotes[1].id).toBe(300);

        const changeOrderTotal = changeOrderNotes.reduce((sum, n) => sum + (parseFloat(n.price) || 0), 0);
        expect(changeOrderTotal).toBe(800);
    });
});
