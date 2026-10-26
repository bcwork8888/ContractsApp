describe('Button Double-Submission Guard Unit Tests', () => {
    function createMockButton(id = 'submit-btn') {
        const attributes = {};
        const classes = new Set();
        return {
            id,
            tagName: 'BUTTON',
            disabled: false,
            parentElement: null,
            classList: {
                add: (c) => classes.add(c),
                remove: (c) => classes.delete(c),
                contains: (c) => classes.has(c)
            },
            getAttribute: (attr) => attributes[attr] || null,
            setAttribute: (attr, val) => { attributes[attr] = String(val); },
            removeAttribute: (attr) => { delete attributes[attr]; },
            closest: function(sel) { return this; }
        };
    }

    function createMockContainer(buttons) {
        const container = {
            querySelectorAll: (sel) => buttons
        };
        buttons.forEach(b => { b.parentElement = container; });
        return container;
    }

    async function withButtonLock(triggerEl, actionFn) {
        let btn = triggerEl;

        if (btn) {
            if (btn.disabled || btn.getAttribute('data-submitting') === 'true' || btn.classList.contains('btn-busy')) {
                return; // Prevent second apply
            }
            btn.setAttribute('data-submitting', 'true');
            btn.disabled = true;
            btn.classList.add('btn-busy');
        }

        let siblingButtons = [];
        if (btn && btn.parentElement) {
            siblingButtons = Array.from(btn.parentElement.querySelectorAll('button')).filter(b => b !== btn && !b.disabled);
            siblingButtons.forEach(b => {
                b.setAttribute('data-sibling-disabled', 'true');
                b.disabled = true;
            });
        }

        try {
            return await actionFn();
        } finally {
            if (btn) {
                btn.removeAttribute('data-submitting');
                btn.disabled = false;
                btn.classList.remove('btn-busy');
            }
            if (siblingButtons && siblingButtons.length > 0) {
                siblingButtons.forEach(b => {
                    if (b.getAttribute('data-sibling-disabled') === 'true') {
                        b.removeAttribute('data-sibling-disabled');
                        b.disabled = false;
                    }
                });
            }
        }
    }

    test('should disable button while async action is running and re-enable afterwards', async () => {
        const btn = createMockButton('create-btn');
        let checkDisabledWhileRunning = false;
        let executionFinished = false;

        const promise = withButtonLock(btn, async () => {
            await new Promise(r => setTimeout(r, 40));
            checkDisabledWhileRunning = btn.disabled && btn.getAttribute('data-submitting') === 'true' && btn.classList.contains('btn-busy');
            executionFinished = true;
        });

        expect(btn.disabled).toBe(true);
        expect(btn.getAttribute('data-submitting')).toBe('true');

        await promise;

        expect(checkDisabledWhileRunning).toBe(true);
        expect(executionFinished).toBe(true);
        expect(btn.disabled).toBe(false);
        expect(btn.getAttribute('data-submitting')).toBeNull();
        expect(btn.classList.contains('btn-busy')).toBe(false);
    });

    test('should prevent second execution when button is clicked while call is in progress', async () => {
        const btn = createMockButton('create-btn');
        let callCount = 0;

        const asyncAction = async () => {
            callCount++;
            await new Promise(r => setTimeout(r, 60));
        };

        // First click triggers the call
        const firstCall = withButtonLock(btn, asyncAction);

        // Second click occurs while call is in progress
        const secondCall = withButtonLock(btn, asyncAction);

        await Promise.all([firstCall, secondCall]);

        expect(callCount).toBe(1); // Second click was blocked!
        expect(btn.disabled).toBe(false);
    });

    test('should disable sibling cancel button during save and restore after', async () => {
        const btn = createMockButton('save-btn');
        const cancelBtn = createMockButton('cancel-btn');
        createMockContainer([btn, cancelBtn]);

        expect(cancelBtn.disabled).toBe(false);

        let checkCancelDisabled = false;
        await withButtonLock(btn, async () => {
            checkCancelDisabled = cancelBtn.disabled && cancelBtn.getAttribute('data-sibling-disabled') === 'true';
        });

        expect(checkCancelDisabled).toBe(true);
        expect(cancelBtn.disabled).toBe(false);
        expect(cancelBtn.getAttribute('data-sibling-disabled')).toBeNull();
    });

    test('should safely re-enable button even if the async call throws an error', async () => {
        const btn = createMockButton('error-btn');

        await expect(withButtonLock(btn, async () => {
            throw new Error('Database connection failed');
        })).rejects.toThrow('Database connection failed');

        expect(btn.disabled).toBe(false);
        expect(btn.getAttribute('data-submitting')).toBeNull();
        expect(btn.classList.contains('btn-busy')).toBe(false);
    });
});
