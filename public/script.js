let currentUser = null;
let currentActiveView = 'login';

const ORIGINAL_FETCH = window.fetch;
// Resolves the remote Node server address. Change this URL to your deployed server hostname when publishing to the App Store!
const API_BASE_URL = (typeof window !== 'undefined' && (window.location.origin.startsWith('capacitor://') || window.location.origin.startsWith('file://') || !window.location.origin.startsWith('http')))
    ? 'http://localhost:8888' // Default local node server fallback
    : '';

window.fetch = function(input, init) {
    if (typeof input === 'string' && input.startsWith('/api/')) {
        input = API_BASE_URL + input;
    }
    return ORIGINAL_FETCH(input, init);
};

const TRANSLATIONS = {
  "zh": {
    "login": "登录",
    "username": "用户名",
    "password": "密码",
    "signup": "注册",
    "create_account": "创建账户",
    "choose_username": "选择用户名",
    "choose_password": "选择密码",
    "full_name": "姓名",
    "company_name": "公司名称",
    "role": "角色：",
    "manager": "经理",
    "admin": "管理员",
    "crew": "员工 (Crew)",
    "super_admin": "超级管理员",
    "create_account_btn": "创建账户",
    "back_to_login": "返回登录",
    "welcome": "欢迎",
    "my_projects": "我的项目",
    "add_project": "+ 新增项目",
    "create_new_project": "新建项目",
    "project_name": "项目名称 *:",
    "working_address": "工作地址 *:",
    "customer_name": "客户姓名 *:",
    "customer_phone": "客户电话 *:",
    "customer_billing_address": "客户账单地址 *:",
    "same_as_working": "同工作地址",
    "customer_email_optional": "客户邮箱 (选填):",
    "enter_project_name": "输入项目名称...",
    "enter_working_address": "输入工作地址...",
    "enter_customer_name": "输入客户姓名...",
    "enter_customer_phone": "输入客户电话...",
    "enter_customer_billing": "输入客户账单地址...",
    "enter_customer_email": "输入客户邮箱...",
    "save_project": "保存项目",
    "cancel": "取消",
    "edit_project": "编辑项目",
    "edit_project_info": "编辑项目信息",
    "update_project": "更新项目",
    "project_console": "项目控制台",
    "back_to_dashboard": "← 返回仪表盘",
    "back_to_projects": "← 返回项目列表",
    "project_status": "项目状态:",
    "draft": "草稿 (Draft)",
    "in_progress": "进行中 (In-Porgress)",
    "sent_to_client": "已发送给客户 (Sent to Client)",
    "signed": "已签署 (Signed)",
    "signed_unpaid": "已签署未付款 (Signed_Unpaid)",
    "terminated": "已终止 (Terminated)",
    "remaining_balance_status": "剩余余额 (Remaining Balance)",
    "done": "已完成 (Done)",
    "edit_project_info_btn": "编辑项目信息",
    "contracts": "合同",
    "notes": "备注",
    "add_contract_btn": "+ 新增合同",
    "add_change_order_btn": "+ 新增变更单",
    "uncontract_notes": "非合同备注 (Uncontract Notes)",
    "draft_contract": "草稿合同 (Draft Contract)",
    "signed_contract": "已签合同 (Signed Contract)",
    "change_order": "变更单 (Change Order)",
    "void_contract": "无效合同 (Void Contract)",
    "crews_can_view_contract_payment": "施工队可查看合同和付款",
    "terminated_notes": "终止记录 (Terminated Notes)",
    "contract_date": "合同日期:",
    "expiration_date": "失效日期:",
    "next_preview_change_order": "下一步: 预览变更单",
    "add_note_btn": "+ 新增备注",
    "payments": "付款记录 (Payments)",
    "deposit_paid_full": "已付定金全款 (Deposit Paid Full)",
    "payment_status": "付款状态:",
    "remaining_balance": "剩余余额:",
    "na": "N/A",
    "unpaid": "未付款 (Unpaid)",
    "deposit_paid": "定金已付 (Deposit Paid)",
    "paid_in_full": "全额已付 (Paid in Full)",
    "add_payment_btn": "+ 记录付款",
    "add_new_payment": "记录新付款",
    "payment_amount": "金额 ($) *:",
    "payment_date": "日期 *:",
    "payment_method": "付款方式 *:",
    "payment_notes": "备注 (选填):",
    "save_payment": "保存付款",
    "upload_receipts": "上传收据 (图片/PDF):",
    "cash": "现金 (Cash)",
    "credit_card": "信用卡 (Credit Card)",
    "check": "支票 (Check)",
    "zelle": "Zelle",
    "bank_transfer": "银行转账 (Bank Transfer)",
    "no_payments": "暂无付款记录",
    "add_new_note": "新增备注",
    "upload_attachments": "上传照片/视频 (照片最大5MB，视频最长1分钟/高级版7分钟，单条备注最多2个附件，项目最多20个附件):",
    "premium_membership": "高级会员",
    "confirm_premium_upgrade": "是否确认每月支付 $4.99 升级为高级会员？",
    "premium_upgrade_success": "成功升级为高级会员！",
    "save_note": "保存备注",
    "create_new_contract": "新建合同",
    "seller_name": "销售员姓名 *:",
    "customer_email": "客户邮箱 *:",
    "price": "价格 *:",
    "contract_date": "合同日期 *:",
    "preview_contract_items": "预览合同款项",
    "next_preview_contract": "下一步: 预览合同",
    "preview_contract_items_title": "预览合同款项",
    "preview_contract_items_desc": "检查并编辑从备注中获取的明细项目。总价将动态更新。",
    "item_description": "项目描述",
    "item_price_usd": "项目价格 ($)",
    "total_price": "总价 ($):",
    "confirm_apply": "确认并应用",
    "contract_preview": "合同预览",
    "confirm": "确认",
    "signature_finalize": "签字并归档",
    "signature_method": "签名方式:",
    "draw_signature": "现在绘制签名",
    "sign_later": "稍后通过邮件链接签署",
    "draw_signature_here": "在此处绘制签名:",
    "clear": "清除",
    "client_email_sig": "用于接收签名链接的客户邮箱:",
    "save_contract": "保存合同",
    "admin_console": "管理员控制台",
    "pending_approvals": "待审批用户",
    "company_projects": "公司项目",
    "company_info_tab": "公司信息",
    "pending_approvals_header": "待审批用户列表",
    "all_projects": "所有项目",
    "company_branding_info": "公司品牌信息",
    "back_to_admin_console": "← 返回管理员控制台",
    "company_official_name": "公司官方名称:",
    "company_logo_image": "公司 Logo 图片:",
    "company_name_card": "名片 / 地址 / 联系信息 (支持 HTML):",
    "save_branding_info": "保存品牌信息",
    "super_admin_console": "超级管理员控制台",
    "all_users": "所有用户",
    "all_customers": "所有客户",
    "users_list": "用户列表",
    "registered_customers": "已注册客户列表",
    "assign_crew_members": "指派员工",
    "select_project": "选择项目:",
    "select_crews": "选择员工:",
    "save_assignments": "保存指派",
    "log_out": "退出登录"
  },
  "en": {
    "login": "Login",
    "username": "Username",
    "password": "Password",
    "signup": "Sign Up",
    "create_account": "Create Account",
    "choose_username": "Choose Username",
    "choose_password": "Choose Password",
    "full_name": "Full Name",
    "company_name": "Company Name",
    "role": "Role:",
    "manager": "Manager",
    "admin": "Admin",
    "crew": "Crew",
    "super_admin": "Super Admin",
    "create_account_btn": "Register",
    "back_to_login": "Back to Login",
    "welcome": "Welcome",
    "my_projects": "My Projects",
    "add_project": "+ Add Project",
    "create_new_project": "Create New Project",
    "project_name": "Project Name *:",
    "working_address": "Working Address *:",
    "customer_name": "Customer Name *:",
    "customer_phone": "Customer Phone Number *:",
    "customer_billing_address": "Customer Billing Address *:",
    "same_as_working": "Same as working address",
    "customer_email_optional": "Customer Email (optional):",
    "enter_project_name": "Enter project name...",
    "enter_working_address": "Enter working address...",
    "enter_customer_name": "Enter customer name...",
    "enter_customer_phone": "Enter customer phone...",
    "enter_customer_billing": "Enter customer billing address...",
    "enter_customer_email": "Enter customer email...",
    "save_project": "Save Project",
    "cancel": "Cancel",
    "edit_project": "Edit Project",
    "edit_project_info": "Edit Project Info",
    "update_project": "Update Project",
    "project_console": "Project Console",
    "back_to_dashboard": "← Back to Dashboard",
    "back_to_projects": "← Back to Projects",
    "project_status": "Project Status:",
    "draft": "Draft",
    "in_progress": "In-Porgress",
    "sent_to_client": "Sent to Client",
    "signed": "Signed",
    "signed_unpaid": "Signed_Unpaid",
    "terminated": "Terminated",
    "remaining_balance_status": "Remaining Balance",
    "done": "Done",
    "edit_project_info_btn": "Edit Project Info",
    "contracts": "Contracts",
    "notes": "Notes",
    "add_contract_btn": "+ Add Contract",
    "add_change_order_btn": "+ Add Change Order",
    "uncontract_notes": "Uncontract Notes",
    "draft_contract": "Draft Contract",
    "signed_contract": "Signed Contract",
    "change_order": "Change Order",
    "void_contract": "Void Contract",
    "crews_can_view_contract_payment": "Crews can view contract and payment",
    "terminated_notes": "Terminated Notes",
    "contract_date": "Contract Date:",
    "expiration_date": "Expiration Date:",
    "next_preview_change_order": "Next: Preview Change Order",
    "add_note_btn": "+ Add Note",
    "payments": "Payments",
    "deposit_paid_full": "Deposit Paid Full",
    "payment_status": "Payment Status:",
    "remaining_balance": "Remaining Balance:",
    "na": "N/A",
    "unpaid": "Unpaid",
    "deposit_paid": "Deposit Paid",
    "paid_in_full": "Paid in Full",
    "add_payment_btn": "+ Add Payment",
    "add_new_payment": "Record New Payment",
    "payment_amount": "Amount ($) *:",
    "payment_date": "Date *:",
    "payment_method": "Method *:",
    "payment_notes": "Notes (Optional):",
    "save_payment": "Save Payment",
    "upload_receipts": "Upload Receipt (Photo/PDF):",
    "cash": "Cash",
    "credit_card": "Credit Card",
    "check": "Check",
    "zelle": "Zelle",
    "bank_transfer": "Bank Transfer",
    "no_payments": "No payments recorded for this project.",
    "add_new_note": "Add New Note",
    "note_content": "Note content *:",
    "item_price_optional": "Item Price (optional):",
    "upload_attachments": "Upload Photos/Videos (Photos max 5MB, Videos max 1min/7mins premium, Max 2 attachments per note, 20 per project):",
    "premium_membership": "Premium Membership",
    "confirm_premium_upgrade": "Confirm payment of $4.99/month to upgrade to Premium?",
    "premium_upgrade_success": "Successfully upgraded to Premium membership!",
    "save_note": "Save Note",
    "create_new_contract": "Create New Contract",
    "seller_name": "Seller Name *:",
    "customer_email": "Customer Email *:",
    "price": "Price *:",
    "contract_date": "Contract Date *:",
    "preview_contract_items": "Preview Contract Items",
    "next_preview_contract": "Next: Preview Contract",
    "preview_contract_items_title": "Preview Contract Items",
    "preview_contract_items_desc": "Review and edit the line items fetched from notes. The total price will update dynamically.",
    "item_description": "Item Description",
    "item_price_usd": "Item Price ($)",
    "total_price": "Total Price ($):",
    "confirm_apply": "Confirm & Apply",
    "contract_preview": "Contract Preview",
    "confirm": "Confirm",
    "signature_finalize": "Signature & Finalize",
    "signature_method": "Signature Method:",
    "draw_signature": "Draw signature now",
    "sign_later": "Sign later with email link",
    "draw_signature_here": "Draw Signature Here:",
    "clear": "Clear",
    "client_email_sig": "Client Email for Signature Link:",
    "save_contract": "Save Contract",
    "admin_console": "Admin Console",
    "pending_approvals": "Pending User Approvals",
    "company_projects": "Company Projects",
    "company_info_tab": "Company Info",
    "pending_approvals_header": "Pending User Approvals",
    "all_projects": "All Projects",
    "company_branding_info": "Company Branding Info",
    "back_to_admin_console": "← Back to Admin Console",
    "company_official_name": "Company Official Name:",
    "company_logo_image": "Company Logo Image:",
    "company_name_card": "Name Card / Address / Contact Info (HTML supported):",
    "save_branding_info": "Save Branding Info",
    "super_admin_console": "Super Admin Console",
    "all_users": "All Users",
    "all_customers": "All Customers",
    "users_list": "Users List",
    "registered_customers": "Registered Customers",
    "assign_crew_members": "Assign Crew Members",
    "select_project": "Select Project:",
    "select_crews": "Select Crews:",
    "save_assignments": "Save Assignments",
    "log_out": "Log out"
  },
  "es": {
    "login": "Iniciar Sesión",
    "username": "Usuario",
    "password": "Contraseña",
    "signup": "Registrarse",
    "create_account": "Crear Cuenta",
    "choose_username": "Elegir Usuario",
    "choose_password": "Elegir Contraseña",
    "full_name": "Nombre Completo",
    "company_name": "Nombre de la Empresa",
    "role": "Rol:",
    "manager": "Gerente",
    "admin": "Administrador",
    "crew": "Personal (Crew)",
    "super_admin": "Super Administrador",
    "create_account_btn": "Registrarse",
    "back_to_login": "Volver a Iniciar Sesión",
    "welcome": "Bienvenido",
    "my_projects": "Mis Proyectos",
    "add_project": "+ Añadir Proyecto",
    "create_new_project": "Crear Nuevo Proyecto",
    "project_name": "Nombre del Proyecto *:",
    "working_address": "Dirección de Trabajo *:",
    "customer_name": "Nombre del Cliente *:",
    "customer_phone": "Teléfono del Cliente *:",
    "customer_billing_address": "Dirección de Facturación *:",
    "same_as_working": "Misma que la de trabajo",
    "customer_email_optional": "Correo del Cliente (opcional):",
    "enter_project_name": "Ingrese nombre del proyecto...",
    "enter_working_address": "Ingrese dirección de trabajo...",
    "enter_customer_name": "Ingrese nombre del cliente...",
    "enter_customer_phone": "Ingrese teléfono del cliente...",
    "enter_customer_billing": "Ingrese dirección de facturación...",
    "enter_customer_email": "Ingrese correo del cliente...",
    "save_project": "Guardar Proyecto",
    "cancel": "Cancelar",
    "edit_project": "Editar Proyecto",
    "edit_project_info": "Editar Información del Proyecto",
    "update_project": "Actualizar Proyecto",
    "project_console": "Consola del Proyecto",
    "back_to_dashboard": "← Volver al Panel",
    "back_to_projects": "← Volver a Proyectos",
    "project_status": "Estado del Proyecto:",
    "draft": "Borrador (Draft)",
    "in_progress": "En Progreso (In-Porgress)",
    "sent_to_client": "Enviado al Cliente (Sent to Client)",
    "signed": "Firmado (Signed)",
    "signed_unpaid": "Firmado No Pagado (Signed_Unpaid)",
    "terminated": "Terminado (Terminated)",
    "remaining_balance_status": "Saldo Restante (Remaining Balance)",
    "done": "Terminado (Done)",
    "edit_project_info_btn": "Editar Información del Proyecto",
    "contracts": "Contratos",
    "notes": "Notas",
    "add_contract_btn": "+ Añadir Contrato",
    "add_change_order_btn": "+ Añadir Orden de Cambio",
    "uncontract_notes": "Notas sin Contrato (Uncontract Notes)",
    "crews_can_view_contract_payment": "Los equipos pueden ver el contrato y el pago",
    "draft_contract": "Contrato Borrador (Draft Contract)",
    "signed_contract": "Contrato Firmado (Signed Contract)",
    "change_order": "Orden de Cambio (Change Order)",
    "void_contract": "Contrato Anulado (Void Contract)",
    "terminated_notes": "Notas de Terminación (Terminated Notes)",
    "contract_date": "Fecha del Contrato:",
    "expiration_date": "Fecha de Vencimiento:",
    "next_preview_change_order": "Siguiente: Vista Previa de la Orden de Cambio",
    "add_note_btn": "+ Añadir Nota",
    "payments": "Pagos (Payments)",
    "deposit_paid_full": "Depósito Pagado Completo (Deposit Paid Full)",
    "payment_status": "Estado de Pago:",
    "remaining_balance": "Saldo Restante:",
    "na": "N/A",
    "unpaid": "No Pagado (Unpaid)",
    "deposit_paid": "Depósito Pagado (Deposit Paid)",
    "paid_in_full": "Pagado por Completo (Paid in Full)",
    "add_payment_btn": "+ Registrar Pago",
    "add_new_payment": "Registrar Nuevo Pago",
    "payment_amount": "Monto ($) *:",
    "payment_date": "Fecha *:",
    "payment_method": "Método *:",
    "payment_notes": "Notas (Opcional):",
    "save_payment": "Guardar Pago",
    "upload_receipts": "Subir Recibo (Foto/PDF):",
    "cash": "Efectivo (Cash)",
    "credit_card": "Tarjeta de Crédito (Credit Card)",
    "check": "Cheque (Check)",
    "zelle": "Zelle",
    "bank_transfer": "Transferencia Bancaria (Bank Transfer)",
    "no_payments": "No se encontraron pagos registrados.",
    "add_new_note": "Añadir Nueva Nota",
    "note_content": "Contenido de la Nota *:",
    "item_price_optional": "Precio del Artículo (opcional):",
    "upload_attachments": "Subir fotos/videos (Fotos máx. 5MB, Videos máx. 1min/7mins premium, Máx. 2 adjuntos por nota, 20 por proyecto):",
    "premium_membership": "Membresía Premium",
    "confirm_premium_upgrade": "¿Confirmar pago de $4.99/mes para actualizar a Premium?",
    "premium_upgrade_success": "¡Actualización exitosa a membresía Premium!",
    "save_note": "Guardar Nota",
    "create_new_contract": "Crear Nuevo Contrato",
    "seller_name": "Nombre del Vendedor *:",
    "customer_email": "Correo del Cliente *:",
    "price": "Precio *:",
    "contract_date": "Fecha del Contrato *:",
    "preview_contract_items": "Previsualizar Artículos del Contrato",
    "next_preview_contract": "Siguiente: Previsualizar Contrato",
    "preview_contract_items_title": "Previsualizar Artículos del Contrato",
    "preview_contract_items_desc": "Revise y edite los artículos extraídos de las notas. El precio total se actualizará automáticamente.",
    "item_description": "Descripción del Artículo",
    "item_price_usd": "Precio del Artículo ($)",
    "total_price": "Precio Total ($):",
    "confirm_apply": "Confirmar y Aplicar",
    "contract_preview": "Previsualizar Contrato",
    "confirm": "Confirmar",
    "signature_finalize": "Firma y Finalización",
    "signature_method": "Método de Firma:",
    "draw_signature": "Dibujar firma ahora",
    "sign_later": "Firmar más tarde con enlace por correo",
    "draw_signature_here": "Dibuje su Firma Aquí:",
    "clear": "Limpiar",
    "client_email_sig": "Correo del Cliente para el Enlace de Firma:",
    "save_contract": "Guardar Contrato",
    "admin_console": "Consola del Administrador",
    "pending_approvals": "Aprobaciones Pendientes",
    "company_projects": "Proyectos de la Empresa",
    "company_info_tab": "Información de la Empresa",
    "pending_approvals_header": "Lista de Aprobaciones Pendientes",
    "all_projects": "Todos los Proyectos",
    "company_branding_info": "Información de Marca de la Empresa",
    "back_to_admin_console": "← Volver a Consola Administrador",
    "company_official_name": "Nombre Oficial de la Empresa:",
    "company_logo_image": "Imagen del Logo de la Empresa:",
    "company_name_card": "Tarjeta de Presentación / Dirección / Contacto (soporta HTML):",
    "save_branding_info": "Guardar Información de Marca",
    "super_admin_console": "Consola del Super Administrador",
    "all_users": "Todos los Usuarios",
    "all_customers": "Todos los Clientes",
    "users_list": "Lista de Usuarios",
    "registered_customers": "Clientes Registrados",
    "assign_crew_members": "Asignar Personal",
    "select_project": "Seleccionar Proyecto:",
    "select_crews": "Seleccionar Personal:",
    "save_assignments": "Guardar Asignaciones",
    "log_out": "Cerrar Sesión"
  }
};

function t(key, defaultValue = '') {
    const lang = localStorage.getItem('lang') || 'zh';
    return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || defaultValue || key;
}

function applyTranslations(lang) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) {
            el.innerText = TRANSLATIONS[lang][key];
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) {
            el.placeholder = TRANSLATIONS[lang][key];
        }
    });

    const selector = document.getElementById('language-select');
    if (selector) {
        selector.value = lang;
    }
}

function changeLanguage(lang) {
    localStorage.setItem('lang', lang);
    applyTranslations(lang);
    
    // Refresh dynamic parts of current active view
    if (currentActiveView) {
        navigate(currentActiveView, false);
    }
}


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

function startContractPreview() {
    const customer = document.getElementById('cust-name').value.trim();
    const seller = document.getElementById('my-name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const price = document.getElementById('price').value;
    const date = document.getElementById('contract-date').value;
    const company = sessionStorage.getItem('company');
    const projectName = currentFolder ? currentFolder.name : '';

    if (!customer || !price) {
        return alert("Customer Name and Price are mandatory fields");
    }

    const workingAddress = currentFolder ? currentFolder.workingAddress : '';
    const billingAddress = currentFolder ? currentFolder.customerBillingAddress : '';

    const itemsParam = encodeURIComponent(JSON.stringify(contractItems || []));
    const url = API_BASE_URL + `/api/preview-pdf?company=${encodeURIComponent(company)}&customer=${encodeURIComponent(customer)}&seller=${encodeURIComponent(seller)}&price=${encodeURIComponent(price)}&date=${encodeURIComponent(date)}&projectName=${encodeURIComponent(projectName)}&items=${itemsParam}&workingAddress=${encodeURIComponent(workingAddress)}&billingAddress=${encodeURIComponent(billingAddress)}`;
    
    // Set iframe src
    document.getElementById('pdf-preview-iframe').src = url;
    
    navigate('final-contract-preview');
}

function confirmFinalPreview() {
    // Reset signature method and clear canvas
    const methodSelect = document.getElementById('sig-method');
    if (methodSelect) {
        methodSelect.value = 'draw';
        toggleSigMethod();
    }
    clearCanvas();
    navigate('contract-signature');
}

function cancelFinalPreview() {
    navigate('add-contract');
}

function cancelSignatureView() {
    navigate('add-contract');
}

async function finalSaveContract() {
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
        template: 'company_default',
        signLater: signLater,
        email: email,
        signature: signatureImage,
        items: contractItems || [],
        voidExisting: shouldVoidExistingContracts,
        isChangeOrder: isChangeOrderFlow,
        expirationDate: document.getElementById('contract-expiration-date').value
    };

    if (!contractData.customer || !contractData.price) return alert("Please fill in the details");

    const res = await fetch('/api/add-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, folderId: currentFolderId, contractData })
    });

    if (res.ok) {
        // Clear all inputs on success
        document.getElementById('cust-name').value = '';
        document.getElementById('phone').value = '';
        document.getElementById('price').value = '';
        const emailInput = document.getElementById('cust-email');
        if (emailInput) emailInput.value = '';
        document.getElementById('contract-expiration-date').value = '';
        clearCanvas();
        
        navigate('work');
        loadWorkData();
    } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Failed to save contract");
    }
}

async function loadWorkData() {
    const username = sessionStorage.getItem('username');
    const role = sessionStorage.getItem('role');
    const res = await fetch(`/api/folders?username=${username}`);
    const folders = await res.json();
    const folder = folders.find(f => f.id == currentFolderId);
    currentFolder = folder;

    if (folder) {
        const contractsCol = document.getElementById('contracts-column');
        const paymentsCol = document.getElementById('payments-column');
        if (role === 'crew') {
            const canView = !!folder.crewsViewContractPayment;
            if (contractsCol) contractsCol.style.display = canView ? 'block' : 'none';
            if (paymentsCol) paymentsCol.style.display = canView ? 'block' : 'none';
        } else {
            if (contractsCol) contractsCol.style.display = 'block';
            if (paymentsCol) paymentsCol.style.display = 'block';
        }
        const select = document.getElementById('project-status-select');
        if (select) {
            select.value = folder.status || 'Draft';
            select.disabled = (role !== 'manager' && role !== 'admin');
        }

        const editBtn = document.getElementById('edit-project-btn');
        if (editBtn) {
            editBtn.style.display = (role === 'crew') ? 'none' : 'inline-block';
        }
        
        // Update work view title to reflect updated name
        const title = document.getElementById('folder-title');
        if (title) title.innerText = `Project: ${folder.name}`;

        const paymentSelect = document.getElementById('payment-status-select');
        if (paymentSelect) {
            paymentSelect.value = folder.paymentStatus || 'N/A';
            paymentSelect.disabled = (role !== 'manager' && role !== 'admin');
        }

        let totalNotesPrice = 0;
        if (folder.notes) {
            folder.notes.forEach(note => {
                if (!note.uncontract) {
                    totalNotesPrice += parseFloat(note.price) || 0;
                }
            });
        }

        let totalPayments = 0;
        if (folder.payments && folder.payments.length > 0) {
            folder.payments.forEach(p => {
                totalPayments += parseFloat(p.amount) || 0;
            });
        }

        const remainingBalance = totalNotesPrice - totalPayments;
        const remainingBalanceEl = document.getElementById('remaining-balance-value');
        if (remainingBalanceEl) {
            remainingBalanceEl.innerText = `$${remainingBalance.toFixed(2)}`;
        }

        // Toggle Add Contract button visibility
        const addContractBtn = document.getElementById('add-contract-btn');
        if (addContractBtn) {
            addContractBtn.style.display = (folder.status === 'Draft' || folder.status === 'Signed_Unpaid') ? 'inline-block' : 'none';
        }

        // Toggle Add Change Order button visibility
        const addChangeOrderBtn = document.getElementById('add-change-order-btn');
        if (addChangeOrderBtn) {
            addChangeOrderBtn.style.display = (folder.status === 'Signed_Unpaid' || folder.status === 'Sent to Client') ? 'inline-block' : 'none';
        }

        // Toggle Termination Doc banner visibility
        const termDisplay = document.getElementById('termination-doc-display');
        if (termDisplay) {
            if (folder.status === 'Terminated' && folder.terminationDoc) {
                termDisplay.classList.remove('hidden');
                document.getElementById('term-doc-text').innerText = folder.terminationDoc.text || '';
                document.getElementById('term-doc-sig').src = folder.terminationDoc.signature || '';
                document.getElementById('term-doc-date').innerText = folder.terminationDoc.date || '';
            } else {
                termDisplay.classList.add('hidden');
            }
        }
    }

    // Render Contracts
    loadContracts();

    // Render Payments
    loadPayments();

    // Call your existing loadNotes logic here or merge them
    loadNotes();
}

async function loadPayments() {
    const username = sessionStorage.getItem('username');
    const res = await fetch(`/api/folders?username=${username}`);
    const folders = await res.json();

    const folder = folders.find(f => f.id == currentFolderId);
    const container = document.getElementById('payments-list');

    if (!container) return;

    if (folder && folder.payments && folder.payments.length > 0) {
        container.innerHTML = folder.payments.map(payment => {
            const amountFormatted = parseFloat(payment.amount).toFixed(2);
            const badgeHtml = payment.depositPaidFull ? `
                <span style="font-size: 10px; margin-left: 8px; padding: 2px 6px; border-radius: 4px; background: #def7ec; font-weight: bold; color: #03543f;">
                    ${t('deposit_paid_full', 'Deposit Paid Full')}
                </span>
            ` : '';
            return `
                <div style="border-bottom: 1px solid #ddd; padding: 10px; margin-bottom: 5px;">
                    <p><strong>Amount:</strong> $${amountFormatted}${badgeHtml}</p>
                    <p><strong>Method:</strong> ${t(payment.method.toLowerCase().replace(' ', '_'), payment.method)}</p>
                    <p><strong>Date:</strong> ${payment.date}</p>
                    ${payment.notes ? `<p style="font-size: 12px; color: #555; margin-top: 4px; margin-bottom: 8px;">Notes: ${payment.notes}</p>` : ''}
                    ${payment.receipts && payment.receipts.length > 0 ? `
                        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px;">
                            ${payment.receipts.map(receipt => {
                                if (receipt.startsWith('data:application/pdf')) {
                                    return `
                                        <a href="${receipt}" target="_blank" style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; padding: 4px 8px; background: #fee2e2; border-radius: 4px; color: #991b1b; text-decoration: none; border: 1px solid #fca5a5; font-weight: 500;">
                                            📄 PDF Receipt
                                        </a>
                                    `;
                                } else {
                                    return `<img src="${receipt}" style="max-width: 60px; max-height: 60px; object-fit: cover; border-radius: 4px; cursor: pointer; border: 1px solid #ddd;" onclick="viewFullImage('${receipt}')">`;
                                }
                            }).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    } else {
        container.innerHTML = `<p>${t('no_payments', 'No payments recorded for this project.')}</p>`;
    }
}

async function savePayment() {
    const amount = document.getElementById('payment-amount').value;
    const date = document.getElementById('payment-date').value;
    const method = document.getElementById('payment-method').value;
    const notes = document.getElementById('payment-notes').value;
    const depositPaidFull = document.getElementById('payment-deposit-paid-full').checked;

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        alert("Please enter a valid positive payment amount.");
        return;
    }
    if (!date) {
        alert("Please select a date.");
        return;
    }

    const username = sessionStorage.getItem('username');
    const res = await fetch('/api/add-payment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username,
            folderId: currentFolderId,
            amount: amount,
            date: date,
            method: method,
            depositPaidFull: depositPaidFull,
            notes: notes,
            receipts: paymentReceiptsData
        })
    });

    if (res.ok) {
        navigate('work');
        loadWorkData();
    } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Failed to save payment");
    }
}

async function updatePaymentStatus() {
    const select = document.getElementById('payment-status-select');
    if (!select) return;
    const paymentStatus = select.value;

    const res = await fetch('/api/project/update-payment-status', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ folderId: currentFolderId, paymentStatus: paymentStatus })
    });

    if (res.ok) {
        alert("Payment status updated successfully!");
    } else {
        alert("Failed to update payment status");
    }
}

// Helper to switch views
function toggleView(viewId) {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('signup-section').classList.add('hidden');
    document.getElementById(viewId).classList.remove('hidden');

    if (viewId === 'signup-section') {
        // Clear signup fields
        document.getElementById('new-user').value = '';
        document.getElementById('new-pass').value = '';
        document.getElementById('signup-fullname').value = '';
        document.getElementById('signup-company').value = '';
        document.getElementById('signup-role').value = 'manager';
        
        // Hide and clear suggestions
        const suggestionsDiv = document.getElementById('company-suggestions');
        if (suggestionsDiv) {
            suggestionsDiv.innerHTML = '';
            suggestionsDiv.style.display = 'none';
        }
        
        // Fetch existing companies for suggestion matching
        loadExistingCompanies();
    }
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
function navigate(view, pushState = true) {
    currentActiveView = view;
    document.querySelectorAll('div[id$="-view"], div[id$="-section"]').forEach(div => {
        div.classList.add('hidden');
    });

    if (pushState) {
        window.history.pushState({ view: view }, '', '#' + view);
    }

    const currentLang = localStorage.getItem('lang') || 'zh';
    applyTranslations(currentLang);

    // Show the requested view
    if (view === 'dashboard') {
        const fullname = sessionStorage.getItem('fullname');
        const company = sessionStorage.getItem('company');
        const role = sessionStorage.getItem('role');

        const roleText = t(role ? role.toLowerCase() : '', role);
        document.getElementById('welcome-msg').innerText = `${t('welcome')}, ${fullname} (${roleText})`;
        
        if (role === 'super admin') {
            document.getElementById('company-msg').innerHTML = `Workspace: ${company || 'Global'} <a href="#" id="super-admin-link" onclick="navigate('super-admin'); return false;" style="margin-left: 15px; font-size: 14px; color: var(--brand-blue); text-decoration: underline;">[${t('super_admin_console')}]</a>`;
        } else if (role === 'admin') {
            document.getElementById('company-msg').innerHTML = `Workspace: ${company} <a href="#" id="admin-link" onclick="navigate('admin'); return false;" style="margin-left: 15px; font-size: 14px; color: var(--brand-blue); text-decoration: underline;">[${t('admin_console')}]</a>`;
        } else if (role === 'manager') {
            document.getElementById('company-msg').innerHTML = `Workspace: ${company} <a href="#" id="manager-link" onclick="navigate('manager-console'); return false;" style="margin-left: 15px; font-size: 14px; color: var(--brand-blue); text-decoration: underline;">[${t('project_console')}]</a>`;
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
    } else if (view === 'edit-project') {
        document.getElementById('edit-project-view').classList.remove('hidden');
    } else if (view === 'login') {
        document.getElementById('login-section').classList.remove('hidden');
    } else if (view === 'work') {
        isChangeOrderFlow = false;
        const role = sessionStorage.getItem('role');
        const contractsCol = document.getElementById('contracts-column');
        const paymentsCol = document.getElementById('payments-column');
        const addNoteBtn = document.getElementById('add-note-btn');

        if (role === 'crew') {
            const canView = currentFolder && !!currentFolder.crewsViewContractPayment;
            if (contractsCol) contractsCol.style.display = canView ? 'block' : 'none';
            if (paymentsCol) paymentsCol.style.display = canView ? 'block' : 'none';
            if (addNoteBtn) addNoteBtn.style.display = 'inline-block';
        } else {
            if (contractsCol) contractsCol.style.display = 'block';
            if (paymentsCol) paymentsCol.style.display = 'block';
            if (addNoteBtn) addNoteBtn.style.display = 'inline-block';
        }

        const backBtn = document.getElementById('work-back-btn');
        if (backBtn) {
            if (role === 'admin') {
                backBtn.innerText = `← ${t('back_to_admin_console')}`;
                backBtn.onclick = () => navigate('admin');
            } else {
                backBtn.innerText = `← ${t('back_to_projects')}`;
                backBtn.onclick = () => navigate('dashboard');
            }
        }

        document.getElementById('work-view').classList.remove('hidden');
    } else if (view === 'add-note') {
        document.getElementById('note-text').value = '';
        const priceInput = document.getElementById('note-price');
        if (priceInput) priceInput.value = '';
        const uncontractInput = document.getElementById('note-uncontract');
        if (uncontractInput) uncontractInput.checked = false;
        const previewContainer = document.getElementById('note-photos-preview-container');
        if (previewContainer) previewContainer.innerHTML = '';
        notePhotosData = [];
        document.getElementById('add-note-view').classList.remove('hidden');
    } else if (view === 'contract-preview') {
        document.getElementById('contract-preview-view').classList.remove('hidden');
    } else if (view === 'final-contract-preview') {
        document.getElementById('final-contract-preview-view').classList.remove('hidden');
    } else if (view === 'contract-signature') {
        document.getElementById('contract-signature-view').classList.remove('hidden');
    } else if (view === 'add-contract') {
        document.getElementById('add-contract-view').classList.remove('hidden');
        
        const viewTitle = document.querySelector('#add-contract-view h2');
        if (viewTitle) {
            viewTitle.innerText = isChangeOrderFlow ? "Add Change Order" : "Add New Contract";
        }

        const nextBtn = document.querySelector('#add-contract-view button[onclick="startContractPreview()"]');
        if (nextBtn) {
            nextBtn.setAttribute('data-i18n', isChangeOrderFlow ? 'next_preview_change_order' : 'next_preview_contract');
        }
        applyTranslations(localStorage.getItem('lang') || 'zh');

        if (!isChangeOrderFlow) {
            document.getElementById('contract-date').valueAsDate = new Date();
            document.getElementById('contract-expiration-date').value = '';
            document.getElementById('my-name').value = sessionStorage.getItem('fullname');
            
            // Default customer details from the current active folder
            if (currentFolder) {
                document.getElementById('cust-name').value = currentFolder.customerName || '';
                document.getElementById('phone').value = currentFolder.customerPhone || '';
                const emailInput = document.getElementById('cust-email');
                if (emailInput) emailInput.value = currentFolder.customerEmail || '';
            }

            // Default price is the sum of all item prices from all notes (excluding uncontract notes)
            let totalNotePrice = 0;
            contractItems = []; // reset global items variable
            if (currentFolder && currentFolder.notes) {
                const contractNotes = currentFolder.notes.filter(note => !note.uncontract);
                contractNotes.forEach(note => {
                    const itemPrice = note.price ? parseFloat(note.price) || 0 : 0;
                    totalNotePrice += itemPrice;
                    contractItems.push({
                        noteId: note.id,
                        description: note.content || '',
                        price: itemPrice
                    });
                });
            }
            document.getElementById('price').value = totalNotePrice > 0 ? totalNotePrice.toFixed(2) : '';

            // Reset signature method and clear canvas
            const methodSelect = document.getElementById('sig-method');
            if (methodSelect) {
                methodSelect.value = 'draw';
                toggleSigMethod();
            }
            clearCanvas();
        }
    } else if (view === 'add-payment') {
        document.getElementById('add-payment-view').classList.remove('hidden');
        document.getElementById('payment-amount').value = '';
        document.getElementById('payment-date').valueAsDate = new Date();
        document.getElementById('payment-method').value = 'Cash';
        document.getElementById('payment-notes').value = '';
        document.getElementById('payment-deposit-paid-full').checked = false;
        paymentReceiptsData = [];
        const receiptPreviewContainer = document.getElementById('payment-receipt-preview-container');
        if (receiptPreviewContainer) receiptPreviewContainer.innerHTML = '';
        const receiptInput = document.getElementById('payment-receipt-input');
        if (receiptInput) receiptInput.value = '';
    } else if (view === 'manager-console') {
        const role = sessionStorage.getItem('role');
        if (role !== 'manager') {
            alert("Unauthorized access");
            return navigate('dashboard');
        }
        document.getElementById('manager-console-view').classList.remove('hidden');
        loadManagerConsole();
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
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.message || "Login failed");
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
        'sent to client': 2,
        'signed': 3,
        'signed_unpaid': 4,
        'terminated': 5,
        'remaining balance': 6,
        'done': 7
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

        div.innerHTML = `<strong>📁 ${f.name}</strong> <span style="font-size: 11px; margin-left: 8px; padding: 2px 6px; border-radius: 4px; background: #e2e8f0; font-weight: bold; color: #475569;">${f.status || 'Draft'}</span>`;

        // This is the trigger that "redirects" you
        div.onclick = () => openFolder(f.id, f.name);

        container.appendChild(div);
    });
}
// Save the new project and go back
async function saveNewProject() {
    const projectName = document.getElementById('project-name').value.trim();
    const workingAddress = document.getElementById('working-address').value.trim();
    const customerName = document.getElementById('customer-name').value.trim();
    const customerPhone = document.getElementById('customer-phone').value.trim();
    const customerBillingAddress = document.getElementById('customer-billing').value.trim();
    const customerEmail = document.getElementById('customer-email').value.trim();
    const crewsViewContractPayment = document.getElementById('crews-view-contract-payment').checked;

    if (!projectName || !workingAddress || !customerName || !customerPhone || !customerBillingAddress) {
        return alert("Please fill in all mandatory fields (*)");
    }

    const username = sessionStorage.getItem('username');

    const res = await fetch('/api/add-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            username, 
            projectName, 
            workingAddress, 
            customerName, 
            customerPhone, 
            customerBillingAddress, 
            customerEmail,
            crewsViewContractPayment
        })
    });

    if (res.ok) {
        document.getElementById('project-name').value = '';
        document.getElementById('working-address').value = '';
        document.getElementById('customer-name').value = '';
        document.getElementById('customer-phone').value = '';
        document.getElementById('customer-billing').value = '';
        document.getElementById('customer-email').value = '';
        document.getElementById('crews-view-contract-payment').checked = false;
        navigate('dashboard');
    } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Failed to create project");
    }
}

let currentFolderId = null;
let currentFolder = null;

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
    const price = document.getElementById('note-price').value.trim();
    const uncontractEl = document.getElementById('note-uncontract');
    const uncontract = uncontractEl ? uncontractEl.checked : false;
    const username = sessionStorage.getItem('username');

    if (!content && notePhotosData.length === 0) return alert("Note content or photos cannot be empty");

    const res = await fetch('/api/add-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: username,
            folderId: currentFolderId,
            noteContent: content,
            price: price || null,
            uncontract: uncontract,
            photos: notePhotosData
        })
    });

    if (res.ok) {
        document.getElementById('note-text').value = ''; // Clear input
        document.getElementById('note-price').value = ''; // Clear input
        const uncontractInput = document.getElementById('note-uncontract');
        if (uncontractInput) uncontractInput.checked = false;
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
                <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 500;">
                    ${note.content}
                    ${note.price ? `<span style="margin-left: 10px; font-size: 12px; padding: 2px 6px; background: #e0f2fe; color: #0369a1; border-radius: 4px; font-weight: bold; white-space: nowrap;">$${note.price}</span>` : ''}
                    ${note.uncontract ? `<span style="margin-left: 8px; font-size: 10px; padding: 2px 6px; background: #f1f5f9; color: #475569; border-radius: 4px; font-weight: bold; white-space: nowrap;">Uncontracted</span>` : ''}
                </p>
                ${note.photos && note.photos.length > 0 ? `
                    <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 10px;">
                        ${note.photos.map(photo => {
                            if (photo.startsWith('data:video/')) {
                                return `<video src="${photo}" controls style="max-width: 250px; max-height: 150px; border-radius: 4px; border: 1px solid #ddd;"></video>`;
                            } else {
                                return `<img src="${photo}" style="max-width: 120px; max-height: 120px; object-fit: cover; border-radius: 4px; cursor: pointer; border: 1px solid #ddd;" onclick="viewFullImage('${photo}')">`;
                            }
                        }).join('')}
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

    let itemsToRender = [];
    if (folder) {
        if (folder.contracts) {
            folder.contracts.forEach(c => {
                let type = '';
                let key = '';
                if (c.void) {
                    type = 'Void Contract';
                    key = 'void_contract';
                } else if (c.isChangeOrder) {
                    type = 'Change Order';
                    key = 'change_order';
                } else if (c.signature) {
                    type = 'Signed Contract';
                    key = 'signed_contract';
                } else {
                    type = 'Draft Contract';
                    key = 'draft_contract';
                }
                itemsToRender.push({
                    id: c.id,
                    type: type,
                    translationKey: key,
                    date: c.date,
                    isContract: true
                });
            });
        }
        if (folder.status === 'Terminated' && folder.terminationDoc) {
            itemsToRender.push({
                id: 'term-doc',
                type: 'Terminated Notes',
                translationKey: 'terminated_notes',
                date: folder.terminationDoc.date || '',
                isContract: false
            });
        }
    }

    if (itemsToRender.length > 0) {
        container.innerHTML = itemsToRender.map(item => {
            const isVoid = item.type === 'Void Contract';
            const labelText = t(item.translationKey) || item.type;
            
            let labelSpan = '';
            let pdfUrl = '';

            if (item.isContract) {
                pdfUrl = `${API_BASE_URL}/api/view-pdf?username=${username}&folderId=${currentFolderId}&contractId=${item.id}`;
                labelSpan = `
                    <span style="font-weight: bold; font-size: 15px; color: ${isVoid ? '#94a3b8' : '#1e293b'}; ${isVoid ? 'text-decoration: line-through;' : ''}">
                        ${labelText}
                    </span>
                `;
            } else {
                pdfUrl = `${API_BASE_URL}/api/view-pdf?username=${username}&folderId=${currentFolderId}&termination=true`;
                labelSpan = `
                    <span style="font-weight: bold; font-size: 15px; color: #ef4444;">
                        ${labelText}
                    </span>
                `;
            }

            const viewButton = `
                <button onclick="window.open('${pdfUrl}', '_blank')" style="padding: 4px 10px; font-size: 11px; font-weight: 600; border-radius: 6px; border: 1px solid var(--border-blue); background: #f8fafc; color: var(--brand-blue); cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#e0f2fe'" onmouseout="this.style.background='#f8fafc'">
                    View
                </button>
            `;

            return `
                <div style="border-bottom: 1px solid #ddd; padding: 10px; margin-bottom: 5px; ${isVoid ? 'background: #f8fafc;' : ''}; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div>${labelSpan}</div>
                        <div style="margin-top: 4px;"><small style="color: #888;">${item.date}</small></div>
                    </div>
                    <div>
                        ${viewButton}
                    </div>
                </div>
            `;
        }).join('');
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
    const { managers, crews, projects, pendingUsers } = await res.json();

    // Render Pending User Approvals
    const pendingContainer = document.getElementById('admin-pending-container');
    const pendingList = document.getElementById('admin-pending-list');
    
    if (pendingContainer && pendingList) {
        if (pendingUsers && pendingUsers.length > 0) {
            pendingContainer.style.display = 'block';
            pendingList.innerHTML = pendingUsers.map(u => `
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">
                    <div>
                        <strong style="font-size: 15px; color: #1e293b;">${u.fullname} (${u.username})</strong>
                        <div style="font-size: 12.5px; color: #64748b; margin-top: 2px;">Role requested: <strong>${u.role}</strong></div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="approveUser('${u.username}')" class="btn-primary" style="background: #10b981; padding: 6px 12px; font-size: 13px; border-radius: 6px;">Approve</button>
                        <button onclick="denyUser('${u.username}')" class="btn-primary" style="background: #ef4444; padding: 6px 12px; font-size: 13px; border-radius: 6px;">Deny</button>
                    </div>
                </div>
            `).join('');
        } else {
            pendingContainer.style.display = 'none';
            pendingList.innerHTML = '';
        }
    }

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

        // Generate checkboxes for crews
        const crewCheckboxesHtml = crews.map(c => {
            const isAssigned = proj.crewUsernames && proj.crewUsernames.some(u => u.toLowerCase() === c.username.toLowerCase());
            return `
                <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: normal; color: var(--text-dark); cursor: pointer; margin: 2px 0;">
                    <input type="checkbox" class="crew-checkbox-${proj.id}" value="${c.username}" ${isAssigned ? 'checked' : ''} style="cursor: pointer;">
                    ${c.fullname} (${c.username})
                </label>
            `;
        }).join('');

        return `
            <div class="project-admin-card" style="border: 1px solid var(--border-blue); padding: 18px; margin-bottom: 15px; border-radius: 8px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <a href="#" onclick="openFolder(${proj.id}, '${proj.name.replace(/'/g, "\\'")}'); return false;" style="font-size: 16px; font-weight: bold; color: var(--brand-blue); text-decoration: underline;">📁 ${proj.name}</a>
                    <span style="font-size: 11px; padding: 2px 6px; border-radius: 4px; background: #e2e8f0; font-weight: bold; color: #475569;">${proj.status || 'Draft'}</span>
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-start; border-top: 1px solid #f1f5f9; padding-top: 10px;">
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
                    <div style="display: flex; flex-direction: column; gap: 6px;">
                        <span style="font-size: 13px; font-weight: 600;">Assigned Crews:</span>
                        <div id="crew-checkboxes-container-${proj.id}" style="display: flex; flex-direction: column; gap: 4px; max-height: 100px; overflow-y: auto; border: 1px solid var(--border-blue); padding: 8px; border-radius: 6px; background: #fafafa; min-width: 200px; box-sizing: border-box;">
                            ${crewCheckboxesHtml || '<span style="font-size: 12.5px; color: #94a3b8; font-style: italic;">No crews registered</span>'}
                        </div>
                        <button onclick="updateProjectCrews(${proj.id})" class="btn-primary" style="padding: 4px 10px; font-size: 12px; border-radius: 6px; margin-top: 4px;">
                            Assign Crews
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

    const tier = compInfo.tier || 'standard';
    sessionStorage.setItem('companyTier', tier);

    const msgEl = document.getElementById('premium-status-message');
    const btnEl = document.getElementById('premium-upgrade-btn');
    if (msgEl && btnEl) {
        if (tier === 'premium') {
            msgEl.innerHTML = `<span style="color: #10b981; font-weight: bold;">✓ ${t('premium_membership', 'Premium Member Active')}</span><br/><span style="font-size: 12.5px; color: #64748b;">Supports up to 7 mins video uploads on notes for every project.</span>`;
            btnEl.style.display = 'none';
        } else {
            msgEl.innerHTML = `<span style="color: #ef4444; font-weight: bold;">Standard Plan</span><br/><span style="font-size: 12.5px; color: #64748b;">Limited to 1 minute video uploads.</span>`;
            btnEl.style.display = 'block';
        }
    }

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

async function upgradeToPremium() {
    const company = sessionStorage.getItem('company');
    const msg = t('confirm_premium_upgrade', 'Confirm payment of $4.99/month to upgrade to Premium?');
    if (!confirm(msg)) {
        return;
    }
    
    const res = await fetch('/api/company/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company })
    });
    
    if (res.ok) {
        const data = await res.json();
        sessionStorage.setItem('companyTier', data.tier);
        alert(t('premium_upgrade_success', 'Successfully upgraded to Premium membership!'));
        loadCompanyInfo();
    } else {
        alert('Failed to upgrade to Premium');
    }
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
    
    // 1. Check max files in one note (2 max)
    if (notePhotosData.length + files.length > 2) {
        alert("You can upload a maximum of 2 attachments per note.");
        fileInput.value = '';
        return;
    }

    // 2. Check max files in the whole project (20 max)
    let totalProjectPhotos = 0;
    if (currentFolder && currentFolder.notes) {
        currentFolder.notes.forEach(note => {
            if (note.photos) {
                totalProjectPhotos += note.photos.length;
            }
        });
    }

    if (totalProjectPhotos + notePhotosData.length + files.length > 20) {
        alert(`Adding these attachments would exceed the project maximum of 20 attachments (currently has ${totalProjectPhotos}).`);
        fileInput.value = '';
        return;
    }

    // 3. Process each file
    files.forEach(file => {
        const isVideo = file.type.startsWith('video/');
        const MAX_SIZE = isVideo ? 100 * 1024 * 1024 : 5 * 1024 * 1024; // 100MB vs 5MB
        
        if (file.size > MAX_SIZE) {
            alert(`File "${file.name}" exceeds the maximum size limit of ${isVideo ? '100MB' : '5MB'}.`);
            return;
        }

        if (isVideo) {
            // Validate duration
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = function() {
                window.URL.revokeObjectURL(video.src);
                const duration = video.duration;
                const companyTier = sessionStorage.getItem('companyTier') || 'standard';
                const maxDuration = companyTier === 'premium' ? 420 : 60; // 7 mins vs 1 min
                
                if (duration > maxDuration) {
                    if (companyTier === 'premium') {
                        alert(`File "${file.name}" exceeds the 7 minutes limit for Premium members.`);
                    } else {
                        alert(`File "${file.name}" exceeds the 1 minute limit. Please upgrade to Premium in Company Information to upload up to 7 minutes.`);
                    }
                    return;
                }
                
                // Read and add
                const reader = new FileReader();
                reader.onload = function(e) {
                    addAttachmentPreview(e.target.result, true);
                };
                reader.readAsDataURL(file);
            };
            video.src = URL.createObjectURL(file);
        } else {
            // Read and add image
            const reader = new FileReader();
            reader.onload = function(e) {
                addAttachmentPreview(e.target.result, false);
            };
            reader.readAsDataURL(file);
        }
    });
    
    fileInput.value = '';
}

function addAttachmentPreview(dataUrl, isVideo) {
    const container = document.getElementById('note-photos-preview-container');
    if (!container) return;
    
    notePhotosData.push(dataUrl);
    
    const div = document.createElement('div');
    div.style.position = 'relative';
    div.style.display = 'inline-block';
    
    let previewEl;
    if (isVideo) {
        previewEl = document.createElement('video');
        previewEl.src = dataUrl;
        previewEl.style.width = '80px';
        previewEl.style.height = '80px';
        previewEl.style.objectFit = 'cover';
        previewEl.style.borderRadius = '4px';
        previewEl.style.border = '1px solid #ddd';
    } else {
        previewEl = document.createElement('img');
        previewEl.src = dataUrl;
        previewEl.style.width = '80px';
        previewEl.style.height = '80px';
        previewEl.style.objectFit = 'cover';
        previewEl.style.borderRadius = '4px';
        previewEl.style.border = '1px solid #ddd';
    }
    
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
    
    div.appendChild(previewEl);
    div.appendChild(removeBtn);
    container.appendChild(div);
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

    if (status === 'Signed') {
        if (!currentFolder || !currentFolder.contracts || currentFolder.contracts.length === 0) {
            alert("No contracts found in this project. Please add a contract first.");
            select.value = currentFolder.status || 'Draft';
            return;
        }
        // Open Signature Modal
        document.getElementById('status-signature-modal').classList.remove('hidden');
        document.getElementById('status-sig-date').valueAsDate = new Date();
        initStatusSignatureCanvases();
        if (statusSigHandler) statusSigHandler.clear();
        return; // wait for user confirmation inside modal
    }

    if (status === 'Terminated') {
        // Open Termination Modal
        document.getElementById('status-termination-modal').classList.remove('hidden');
        document.getElementById('status-term-text').value = '';
        document.getElementById('status-term-date').valueAsDate = new Date();
        initStatusSignatureCanvases();
        if (statusTermHandler) statusTermHandler.clear();
        return; // wait for user confirmation inside modal
    }

    await sendStatusUpdate(status);
}

async function sendStatusUpdate(status, payload = {}) {
    const res = await fetch('/api/project/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: currentFolderId, status: status, ...payload })
    });

    if (res.ok) {
        alert("Project status updated successfully!");
        loadWorkData();
    } else {
        alert("Failed to update project status");
        const select = document.getElementById('project-status-select');
        if (select) select.value = currentFolder.status || 'Draft';
    }
}

let existingCompanies = [];

async function loadExistingCompanies() {
    try {
        const res = await fetch('/api/companies');
        if (res.ok) {
            existingCompanies = await res.json();
        }
    } catch (err) {
        console.error("Failed to load existing companies", err);
    }
}

function getSimilarity(s1, s2) {
    s1 = s1.toLowerCase().trim();
    s2 = s2.toLowerCase().trim();
    if (!s1 || !s2) return 0;
    
    // Levenshtein distance
    const track = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
    for (let i = 0; i <= s1.length; i += 1) {
        track[0][i] = i;
    }
    for (let j = 0; j <= s2.length; j += 1) {
        track[j][0] = j;
    }
    for (let j = 1; j <= s2.length; j += 1) {
        for (let i = 1; i <= s1.length; i += 1) {
            const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
            track[j][i] = Math.min(
                track[j][i - 1] + 1, // deletion
                track[j - 1][i] + 1, // insertion
                track[j - 1][i - 1] + indicator // substitution
            );
        }
    }
    const distance = track[s2.length][s1.length];
    const maxLength = Math.max(s1.length, s2.length);
    return (maxLength - distance) / maxLength;
}

function onCompanyInput() {
    const input = document.getElementById('signup-company');
    const suggestionsDiv = document.getElementById('company-suggestions');
    if (!input || !suggestionsDiv) return;

    const val = input.value.trim();
    if (!val) {
        suggestionsDiv.innerHTML = '';
        suggestionsDiv.style.display = 'none';
        return;
    }

    // Filter companies matching >= 70% similarity
    const matches = existingCompanies.filter(compName => {
        const similarity = getSimilarity(val, compName);
        return similarity >= 0.7;
    });

    if (matches.length === 0) {
        suggestionsDiv.innerHTML = '';
        suggestionsDiv.style.display = 'none';
        return;
    }

    suggestionsDiv.innerHTML = matches.map(compName => `
        <div class="company-suggestion-item" 
             style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #f1f5f9; font-size: 13.5px; color: var(--text-dark); transition: background 0.2s;" 
             onclick="selectCompanySuggestion('${compName.replace(/'/g, "\\'")}')"
             onmouseover="this.style.background='#f1f5f9'"
             onmouseout="this.style.background='white'">
            ${compName}
        </div>
    `).join('');
    suggestionsDiv.style.display = 'block';
}

function selectCompanySuggestion(name) {
    const input = document.getElementById('signup-company');
    if (input) {
        input.value = name;
    }
    const suggestionsDiv = document.getElementById('company-suggestions');
    if (suggestionsDiv) {
        suggestionsDiv.innerHTML = '';
        suggestionsDiv.style.display = 'none';
    }
}

document.addEventListener('click', (e) => {
    const suggestionsDiv = document.getElementById('company-suggestions');
    const input = document.getElementById('signup-company');
    if (suggestionsDiv && input && !input.contains(e.target) && !suggestionsDiv.contains(e.target)) {
        suggestionsDiv.style.display = 'none';
    }
});

async function approveUser(username) {
    const res = await fetch('/api/admin/approve-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
    });
    if (res.ok) {
        alert(`User ${username} approved successfully!`);
        loadAdminConsole();
    } else {
        alert("Failed to approve user");
    }
}

async function denyUser(username) {
    if (!confirm(`Are you sure you want to deny registration for ${username}?`)) return;
    const res = await fetch('/api/admin/deny-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
    });
    if (res.ok) {
        alert(`User ${username} denied successfully!`);
        loadAdminConsole();
    } else {
        alert("Failed to deny user");
    }
}
async function updateProjectCrews(folderId) {
    const checkboxes = document.querySelectorAll(`.crew-checkbox-${folderId}`);
    const selectedCrews = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);

    const res = await fetch('/api/admin/reassign-project-crews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId, crews: selectedCrews })
    });

    if (res.ok) {
        alert("Project crews updated successfully!");
        loadAdminConsole();
    } else {
        alert("Failed to update project crews");
    }
}

function editProject() {
    if (!currentFolder) return alert("No active project to edit");

    // Populate the form fields
    document.getElementById('edit-project-name').value = currentFolder.projectName || '';
    document.getElementById('edit-working-address').value = currentFolder.workingAddress || '';
    document.getElementById('edit-customer-name').value = currentFolder.customerName || '';
    document.getElementById('edit-customer-phone').value = currentFolder.customerPhone || '';
    document.getElementById('edit-customer-billing').value = currentFolder.customerBillingAddress || '';
    document.getElementById('edit-customer-email').value = currentFolder.customerEmail || '';
    const crewsViewEl = document.getElementById('edit-crews-view-contract-payment');
    if (crewsViewEl) crewsViewEl.checked = !!currentFolder.crewsViewContractPayment;

    navigate('edit-project');
}

async function saveEditProject() {
    const projectName = document.getElementById('edit-project-name').value.trim();
    const workingAddress = document.getElementById('edit-working-address').value.trim();
    const customerName = document.getElementById('edit-customer-name').value.trim();
    const customerPhone = document.getElementById('edit-customer-phone').value.trim();
    const customerBillingAddress = document.getElementById('edit-customer-billing').value.trim();
    const customerEmail = document.getElementById('edit-customer-email').value.trim();
    const crewsViewContractPayment = document.getElementById('edit-crews-view-contract-payment').checked;

    if (!projectName || !workingAddress || !customerName || !customerPhone || !customerBillingAddress) {
        return alert("Please fill in all mandatory fields (*)");
    }

    const res = await fetch('/api/edit-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            folderId: currentFolderId,
            projectName,
            workingAddress,
            customerName,
            customerPhone,
            customerBillingAddress,
            customerEmail,
            crewsViewContractPayment
        })
    });

    if (res.ok) {
        alert("Project information updated successfully!");
        navigate('work');
        loadWorkData();
    } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Failed to update project information");
    }
}

function cancelEditProject() {
    navigate('work');
}

function copyWorkingAddress(mode) {
    if (mode === 'add') {
        const working = document.getElementById('working-address').value;
        document.getElementById('customer-billing').value = working;
    } else if (mode === 'edit') {
        const working = document.getElementById('edit-working-address').value;
        document.getElementById('edit-customer-billing').value = working;
    }
}

async function loadManagerConsole() {
    const username = sessionStorage.getItem('username');
    const company = sessionStorage.getItem('company');
    document.getElementById('manager-company-title').innerText = `My Projects (${company})`;

    const res = await fetch(`/api/admin/company-data?company=${encodeURIComponent(company)}`);
    if (!res.ok) {
        alert("Failed to load project console data");
        return;
    }
    const { crews, projects } = await res.json();

    // Filter projects to only show ones owned by the current manager
    const myProjects = projects.filter(proj => proj.managerUsername.toLowerCase() === username.toLowerCase());

    const container = document.getElementById('manager-projects-list');
    if (!myProjects || myProjects.length === 0) {
        container.innerHTML = '<p>No projects found under your ownership.</p>';
        return;
    }

    container.innerHTML = myProjects.map(proj => {
        // Generate checkboxes for crews
        const crewCheckboxesHtml = crews.map(c => {
            const isAssigned = proj.crewUsernames && proj.crewUsernames.some(u => u.toLowerCase() === c.username.toLowerCase());
            return `
                <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: normal; color: var(--text-dark); cursor: pointer; margin: 2px 0;">
                    <input type="checkbox" class="manager-crew-checkbox-${proj.id}" value="${c.username}" ${isAssigned ? 'checked' : ''} style="cursor: pointer;">
                    ${c.fullname} (${c.username})
                </label>
            `;
        }).join('');

        return `
            <div class="project-admin-card" style="border: 1px solid var(--border-blue); padding: 18px; margin-bottom: 15px; border-radius: 8px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <a href="#" onclick="openFolder(${proj.id}, '${proj.name.replace(/'/g, "\\'")}'); return false;" style="font-size: 16px; font-weight: bold; color: var(--brand-blue); text-decoration: underline;">📁 ${proj.name}</a>
                    <span style="font-size: 11px; padding: 2px 6px; border-radius: 4px; background: #e2e8f0; font-weight: bold; color: #475569;">${proj.status || 'Draft'}</span>
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-start; border-top: 1px solid #f1f5f9; padding-top: 10px;">
                    <!-- Crew Assignment only -->
                    <div style="display: flex; flex-direction: column; gap: 6px;">
                        <span style="font-size: 13px; font-weight: 600;">Assigned Crews:</span>
                        <div id="manager-crew-checkboxes-container-${proj.id}" style="display: flex; flex-direction: column; gap: 4px; max-height: 100px; overflow-y: auto; border: 1px solid var(--border-blue); padding: 8px; border-radius: 6px; background: #fafafa; min-width: 200px; box-sizing: border-box;">
                            ${crewCheckboxesHtml || '<span style="font-size: 12.5px; color: #94a3b8; font-style: italic;">No crews registered</span>'}
                        </div>
                        <button onclick="updateManagerProjectCrews(${proj.id})" class="btn-primary" style="padding: 4px 10px; font-size: 12px; border-radius: 6px; margin-top: 4px;">
                            Assign Crews
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function updateManagerProjectCrews(folderId) {
    const checkboxes = document.querySelectorAll(`.manager-crew-checkbox-${folderId}`);
    const selectedCrews = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);

    const username = sessionStorage.getItem('username');

    const res = await fetch('/api/manager/reassign-project-crews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId, crews: selectedCrews, username })
    });

    if (res.ok) {
        alert("Project crews updated successfully!");
        loadManagerConsole();
    } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Failed to update project crews");
    }
}

function previewContractItems() {
    const container = document.getElementById('preview-items-container');
    if (!container) return;

    if (!contractItems || contractItems.length === 0) {
        container.innerHTML = '<p style="color: #94a3b8; font-style: italic;">No items found from notes. Add notes with item prices first.</p>';
        document.getElementById('preview-total-price').value = '0.00';
        navigate('contract-preview');
        return;
    }

    container.innerHTML = contractItems.map((item, index) => `
        <div style="display: flex; gap: 15px; align-items: flex-start;">
            <textarea class="preview-item-desc" data-index="${index}" rows="2" style="flex: 1; padding: 8px 12px; font-size: 13.5px; border-radius: 6px; border: 1px solid var(--border-blue); box-sizing: border-box; resize: vertical;" oninput="onPreviewItemDescInput(${index})">${item.description}</textarea>
            <input type="number" class="preview-item-price" data-index="${index}" step="0.01" value="${item.price.toFixed(2)}" style="width: 200px; flex-shrink: 0; padding: 8px 12px; font-size: 13.5px; border-radius: 6px; border: 1px solid var(--border-blue); box-sizing: border-box; text-align: right;" oninput="onPreviewItemPriceInput(${index})">
        </div>
    `).join('');

    recalculatePreviewTotal();
    navigate('contract-preview');
}

function onPreviewItemDescInput(index) {
    const textareas = document.querySelectorAll('.preview-item-desc');
    const ta = Array.from(textareas).find(t => parseInt(t.getAttribute('data-index')) === index);
    if (ta) {
        contractItems[index].description = ta.value;
    }
}

function onPreviewItemPriceInput(index) {
    const inputs = document.querySelectorAll('.preview-item-price');
    const input = Array.from(inputs).find(inp => parseInt(inp.getAttribute('data-index')) === index);
    if (input) {
        contractItems[index].price = parseFloat(input.value) || 0;
    }
    recalculatePreviewTotal();
}

function recalculatePreviewTotal() {
    let sum = 0;
    contractItems.forEach(item => {
        sum += item.price;
    });
    document.getElementById('preview-total-price').value = sum.toFixed(2);
}

function onPreviewTotalInput() {
    // Allows direct manual edit of the total field as per "All of them are editable" requirement
}

function confirmPreviewItems() {
    const finalTotal = document.getElementById('preview-total-price').value;
    document.getElementById('price').value = finalTotal;
    
    const textareas = document.querySelectorAll('.preview-item-desc');
    textareas.forEach(ta => {
        const idx = parseInt(ta.getAttribute('data-index'));
        if (contractItems[idx]) contractItems[idx].description = ta.value;
    });
    
    const inputs = document.querySelectorAll('.preview-item-price');
    inputs.forEach(inp => {
        const idx = parseInt(inp.getAttribute('data-index'));
        if (contractItems[idx]) contractItems[idx].price = parseFloat(inp.value) || 0;
    });

    const notesPayload = contractItems.map(item => ({
        id: item.noteId,
        content: item.description,
        price: item.price
    }));

    fetch(API_BASE_URL + '/api/project/update-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: currentFolderId, notes: notesPayload })
    }).then(res => {
        if (res.ok) {
            loadWorkData();
        }
    });

    navigate('add-contract');
}

function cancelPreviewItems() {
    navigate('add-contract');
}

async function lookupCustomer(mode) {
    let url = '/api/customer-lookup?';
    if (mode === 'phone') {
        const val = document.getElementById('customer-phone').value.trim();
        if (!val) return;
        url += `phone=${encodeURIComponent(val)}`;
    } else if (mode === 'email') {
        const val = document.getElementById('customer-email').value.trim();
        if (!val) return;
        url += `email=${encodeURIComponent(val)}`;
    }

    const res = await fetch(url);
    if (res.ok) {
        const data = await res.json();
        if (data.found) {
            document.getElementById('customer-name').value = data.customerName || '';
            document.getElementById('customer-phone').value = data.customerPhone || '';
            document.getElementById('customer-email').value = data.customerEmail || '';
            document.getElementById('customer-billing').value = data.customerBillingAddress || '';
        }
    }
}

// Browser Back/Forward navigation listener
window.onpopstate = function(event) {
    if (event.state && event.state.view) {
        navigate(event.state.view, false);
    } else {
        const username = sessionStorage.getItem('username');
        if (username) {
            navigate('dashboard', false);
        } else {
            navigate('login', false);
        }
    }
};

// Initial page load hash routing setup
window.addEventListener('DOMContentLoaded', () => {
    const username = sessionStorage.getItem('username');
    let hash = window.location.hash.substring(1);
    
    // Load translation pref
    const lang = localStorage.getItem('lang') || 'zh';
    applyTranslations(lang);
    
    // Sub-views requiring project folder context (fall back to dashboard if refreshed)
    const contextViews = ['work', 'add-note', 'add-contract', 'contract-preview', 'final-contract-preview', 'contract-signature', 'edit-project'];
    if (contextViews.includes(hash)) {
        hash = 'dashboard';
    }
    
    const defaultView = username ? (hash || 'dashboard') : 'login';
    
    window.history.replaceState({ view: defaultView }, '', '#' + defaultView);
    navigate(defaultView, false);
});

let paymentReceiptsData = [];

function previewPaymentReceipts() {
    const fileInput = document.getElementById('payment-receipt-input');
    const container = document.getElementById('payment-receipt-preview-container');
    if (!fileInput || !container) return;

    const files = Array.from(fileInput.files);

    if (paymentReceiptsData.length + files.length > 5) {
        alert("You can upload a maximum of 5 receipts per payment.");
        fileInput.value = '';
        return;
    }

    files.forEach(file => {
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit
        if (file.size > MAX_SIZE) {
            alert(`File "${file.name}" exceeds the maximum size limit of 5MB.`);
            return;
        }

        const isPDF = file.type === 'application/pdf';

        const reader = new FileReader();
        reader.onload = function(e) {
            const dataUrl = e.target.result;
            paymentReceiptsData.push(dataUrl);

            const div = document.createElement('div');
            div.style.position = 'relative';
            div.style.display = 'inline-block';

            let previewEl;
            if (isPDF) {
                previewEl = document.createElement('div');
                previewEl.style.width = '80px';
                previewEl.style.height = '80px';
                previewEl.style.display = 'flex';
                previewEl.style.alignItems = 'center';
                previewEl.style.justifyContent = 'center';
                previewEl.style.background = '#fee2e2';
                previewEl.style.border = '1px solid #fca5a5';
                previewEl.style.color = '#b91c1c';
                previewEl.style.borderRadius = '4px';
                previewEl.style.fontSize = '10px';
                previewEl.style.fontWeight = 'bold';
                previewEl.style.padding = '4px';
                previewEl.style.textAlign = 'center';
                previewEl.innerText = 'PDF';
            } else {
                previewEl = document.createElement('img');
                previewEl.src = dataUrl;
                previewEl.style.width = '80px';
                previewEl.style.height = '80px';
                previewEl.style.objectFit = 'cover';
                previewEl.style.borderRadius = '4px';
                previewEl.style.border = '1px solid #ddd';
            }

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
                const idx = paymentReceiptsData.indexOf(dataUrl);
                if (idx > -1) {
                    paymentReceiptsData.splice(idx, 1);
                }
                div.remove();
            };

            div.appendChild(previewEl);
            div.appendChild(removeBtn);
            container.appendChild(div);
        };
        reader.readAsDataURL(file);
    });

    fileInput.value = '';
}

function initSignatureCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    let writing = false;

    // Mouse events
    canvas.onmousedown = (e) => {
        writing = true;
        ctx.beginPath();
        const rect = canvas.getBoundingClientRect();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    };
    canvas.onmouseup = () => {
        writing = false;
        ctx.beginPath();
    };
    canvas.onmousemove = (e) => {
        if (!writing) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000000';
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    // Touch events (for mobile devices)
    canvas.addEventListener('touchstart', (e) => {
        writing = true;
        ctx.beginPath();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
        e.preventDefault();
    }, { passive: false });

    canvas.addEventListener('touchend', () => {
        writing = false;
        ctx.beginPath();
    });

    canvas.addEventListener('touchmove', (e) => {
        if (!writing) return;
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000000';
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
        e.preventDefault();
    }, { passive: false });

    return {
        canvas,
        ctx,
        clear: () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
        },
        isEmpty: () => {
            const pixelBuffer = new Uint32Array(
                ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer
            );
            return !pixelBuffer.some(color => color !== 0);
        }
    };
}

let statusSigHandler = null;
let statusTermHandler = null;

function initStatusSignatureCanvases() {
    if (!statusSigHandler) {
        statusSigHandler = initSignatureCanvas('status-sig-canvas');
    }
    if (!statusTermHandler) {
        statusTermHandler = initSignatureCanvas('status-term-canvas');
    }
}

function clearStatusSigCanvas() {
    if (statusSigHandler) statusSigHandler.clear();
}

function clearStatusTermCanvas() {
    if (statusTermHandler) statusTermHandler.clear();
}

function closeStatusSignatureModal() {
    document.getElementById('status-signature-modal').classList.add('hidden');
    const select = document.getElementById('project-status-select');
    if (select) select.value = currentFolder.status || 'Draft';
}

function closeStatusTerminationModal() {
    document.getElementById('status-termination-modal').classList.add('hidden');
    const select = document.getElementById('project-status-select');
    if (select) select.value = currentFolder.status || 'Draft';
}

async function saveStatusSignature() {
    if (statusSigHandler && statusSigHandler.isEmpty()) {
        alert("Please sign the signature pad before saving.");
        return;
    }
    const signature = statusSigHandler.canvas.toDataURL('image/png');
    const date = document.getElementById('status-sig-date').value;
    if (!date) {
        alert("Please select a date.");
        return;
    }

    await sendStatusUpdate('Signed', { signature, date });
    document.getElementById('status-signature-modal').classList.add('hidden');
}

async function saveStatusTermination() {
    const text = document.getElementById('status-term-text').value.trim();
    if (!text) {
        alert("Please enter the termination details / reason.");
        return;
    }
    if (statusTermHandler && statusTermHandler.isEmpty()) {
        alert("Please sign the signature pad before terminating.");
        return;
    }
    const signature = statusTermHandler.canvas.toDataURL('image/png');
    const date = document.getElementById('status-term-date').value;
    if (!date) {
        alert("Please select a date.");
        return;
    }

    await sendStatusUpdate('Terminated', {
        terminationDoc: {
            text: text,
            signature: signature,
            date: date
        }
    });
    document.getElementById('status-termination-modal').classList.add('hidden');
}

let shouldVoidExistingContracts = false;

function handleNewContractClick() {
    if (currentFolder && currentFolder.status === 'Signed_Unpaid') {
        shouldVoidExistingContracts = false; // reset
        document.getElementById('void-warning-modal').classList.remove('hidden');
    } else {
        shouldVoidExistingContracts = false;
        navigate('add-contract');
    }
}

function confirmVoidAndCreateContract() {
    shouldVoidExistingContracts = true;
    document.getElementById('void-warning-modal').classList.add('hidden');
    navigate('add-contract');
}

function closeVoidWarningModal() {
    shouldVoidExistingContracts = false;
    document.getElementById('void-warning-modal').classList.add('hidden');
}

let isChangeOrderFlow = false;

function handleAddChangeOrderClick() {
    if (!currentFolder || !currentFolder.contracts || currentFolder.contracts.length === 0) {
        alert("No contracts found in this project. You cannot create a change order without a base contract.");
        return;
    }

    const latestContract = currentFolder.contracts[currentFolder.contracts.length - 1];
    const latestContractId = latestContract ? latestContract.id : 0;

    const changeOrderNotes = (currentFolder.notes || []).filter(note => {
        const noteTime = note.modifiedAt || note.id;
        return noteTime > latestContractId && !note.uncontract;
    });

    if (changeOrderNotes.length === 0) {
        alert("No new or modified notes found since the latest contract was created.");
        return;
    }

    isChangeOrderFlow = true;

    // Prefill contract details from the latest contract
    document.getElementById('cust-name').value = latestContract.customer || '';
    document.getElementById('my-name').value = latestContract.seller || '';
    document.getElementById('phone').value = latestContract.phone || '';
    const emailInput = document.getElementById('cust-email');
    if (emailInput) emailInput.value = latestContract.email || '';
    document.getElementById('contract-date').valueAsDate = new Date();
    document.getElementById('contract-expiration-date').value = '';

    // Populate contractItems with filtered notes
    let totalNotePrice = 0;
    contractItems = [];
    changeOrderNotes.forEach(note => {
        const itemPrice = note.price ? parseFloat(note.price) || 0 : 0;
        totalNotePrice += itemPrice;
        contractItems.push({
            noteId: note.id,
            description: note.content || '',
            price: itemPrice
        });
    });

    document.getElementById('price').value = totalNotePrice > 0 ? totalNotePrice.toFixed(2) : '';

    // Reset signature method and clear canvas
    const methodSelect = document.getElementById('sig-method');
    if (methodSelect) {
        methodSelect.value = 'draw';
        toggleSigMethod();
    }
    clearCanvas();

    // Navigate directly to add-contract view
    navigate('add-contract');
}

