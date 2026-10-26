# 📘 User Manual: FieldSync / CCC Contracts Management System

Welcome to the **FieldSync / CCC Contracts** User Manual. This comprehensive guide covers role-by-role instructions, workflows, and administration tools for managing field projects, itemized contracts, change orders, digital signatures, payments, employee rosters, and transactional email notifications.

---

## 📑 Table of Contents
1. [System Overview & Role Hierarchy](#-system-overview--role-hierarchy)
2. [Role Permission Matrix](#-role-permission-matrix)
3. [Registration, Login & Password Management](#-registration-login--password-management)
   - [Company ID Architecture](#company-id-architecture)
   - [Contact Field Requirements](#contact-field-requirements)
   - [Password Reset Workflows](#password-reset-workflows)
4. [Super Admin Guide](#-super-admin-guide)
5. [Company Admin Guide](#-company-admin-guide)
   - [Tab 1: Projects](#tab-1-projects)
   - [Tab 2: Company Info](#tab-2-company-info)
   - [Tab 3: People (Employee Management)](#tab-3-people-employee-management)
   - [User Approval & Denied User Handling](#user-approval--denied-user-handling)
6. [Manager (Project Manager) Guide](#-manager-project-manager-guide)
   - [Creating & Managing Projects](#creating--managing-projects)
   - [Two-Step Contract Creation Wizard](#two-step-contract-creation-wizard)
   - [Change Order Flow](#change-order-flow)
   - [Payment Tracking & Balance Due](#payment-tracking--balance-due)
   - [Project Termination Document](#project-termination-document)
7. [Crew (Field Worker) Guide](#-crew-field-worker-guide)
8. [Customer / Client Guide (E-Signatures)](#-customer--client-guide-e-signatures)
9. [Resend Email Service & MCP Integration](#-resend-email-service--mcp-integration)
10. [Mobile, Tablet & Multi-Language Support](#-mobile-tablet--multi-language-support)

---

## 🌐 System Overview & Role Hierarchy

FieldSync is a multi-tenant platform designed for contractors, trade professionals, and project managers. Data is strictly scoped by **Company**:

```
                       ┌─────────────────────────┐
                       │       SUPER ADMIN       │
                       └────────────┬────────────┘
                                    │ Platform Oversight & Company Setup
                                    ▼
                       ┌─────────────────────────┐
                       │      COMPANY ADMIN      │
                       └────────────┬────────────┘
                                    │ Company Management, People & Approvals
                 ┌──────────────────┴──────────────────┐
                 ▼                                     ▼
      ┌────────────────────┐                ┌────────────────────┐
      │  PROJECT MANAGER   │                │   FIELD CREW USER  │
      └──────────┬─────────┘                └────────────────────┘
                 │ Projects, Contracts & Notes         │ Assigned Field Work & Notes
                 ▼                                     ▼
      ┌────────────────────┐                ┌────────────────────┐
      │ EXTERNAL CUSTOMER  │                │   PROJECT NOTES    │
      └────────────────────┘                └────────────────────┘
```

---

## 📊 Role Permission Matrix

| Feature / Action | Super Admin | Company Admin | Manager | Crew | Customer |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **System Registration & Login** | ✅ | ✅ | ✅ | ✅ | ❌ (Token Link) |
| **Create New Company Profile** | ✅ | ✅ (First Admin) | ❌ | ❌ | ❌ |
| **Join via Company ID** | ❌ | ✅ (2nd Admin) | ✅ | ✅ | ❌ |
| **Approve / Deny Company Registrations** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Activate / Deactivate Employees** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Assign Temporary Password to User** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Manage Company Branding & Logo** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Create & Edit Projects** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Update Project & Payment Status** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Assign Managers & Crews to Projects** | ✅ | ✅ | ✅ (Own) | ❌ | ❌ |
| **Execute Project Termination Doc** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Two-Step Contract Creation Wizard** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Send E-Signature Token Links** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Add Field Notes & Media** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **View Assigned Projects Only** | N/A | All Co. | All Co. | Assigned | Single Contract |
| **Sign Contract via Token Link** | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 🔐 Registration, Login & Password Management

### Company ID Architecture
Every organization registered on FieldSync is assigned a unique, uppercase alphanumeric identifier (e.g. `CID-79ZQP2`).
- **First Admin Sign-up**: When the first Admin creates an account, they provide the company name. Upon registration, the system generates a unique **Company ID** and displays it in a dialog with a copy button.
- **Managers, Crew & Secondary Admins**: Select their role, choose **Join Existing Company**, and enter the **Company ID**. A tooltip (`ℹ️`) reminds users: *"Please ask the admin for company ID."*
- **Retrieving Company ID**: Admins can view and copy their Company ID anytime from the top badge in the Admin Console.

### Contact Field Requirements
When registering an account:
- **Cell Phone**: Available as an optional or required field depending on the role.
- **Admin Role**: **Email is mandatory** (used for self-service password recovery). Cell phone is optional.
- **Manager & Crew Roles**: **Either Email OR Cell Phone is mandatory**. If an employee only has a cell phone, they can register and receive password resets via SMS.

### Password Reset Workflows

#### 1. Admin Self-Service Reset (From Login Page)
1. Click **Forgot Password? / Reset Password** on the login screen.
2. Enter the Admin username.
3. If valid, the system dispatches an email containing a secure 1-hour expiration link via **Resend**.
4. Click the link to open the password reset view, enter a new password, and confirm.

#### 2. Manager & Crew Password Reset Request
1. Click **Forgot Password? / Reset Password** on the login screen.
2. Enter the username.
3. The system displays a dialog instructing the employee to contact their company administrator, providing the **Administrator's email address** directly on screen.

#### 3. Admin Resetting Employee Passwords (People Tab)
1. An Admin navigates to **Admin Console $\to$ People Tab**.
2. Locate the employee and click **Reset Password**.
3. The system generates a secure temporary password (`Temp-XXXXXX`), updates the user account, and dispatches it:
   - Via email (if the user has an email registered).
   - Via SMS (if the user only has a cell phone registered).
4. The employee logs in with the temporary password and updates their credentials.

---

## 🛡️ Super Admin Guide

> [!IMPORTANT]
> The **Super Admin** role has platform-wide authority across all companies, accounts, and projects.

### Key Responsibilities
1. **Company Directory**:
   - Access the **Super Admin Console**.
   - Create new company organizations and assign master branding.
2. **Global User Management**:
   - Inspect and edit accounts across all tenant companies.
   - Reassign staff between companies when organization changes occur.
3. **Customer Database**:
   - Search the global customer directory across all projects and addresses.

---

## 👑 Company Admin Guide

The Company Admin oversees team members, company settings, and project assignments through a dedicated **Three-Tab Admin Console**.

```
┌─────────────────────────────────────────────────────────────┐
│                      ADMIN CONSOLE                          │
│  [ Projects ]          [ Company Info ]         [ People ]  │
└─────────────────────────────────────────────────────────────┘
```

### Tab 1: Projects (Default View)
- Displays all active company projects.
- **Reassign Project Managers**: Transfer project ownership from one Manager to another via the manager dropdown.
- **Assign Multiple Crews**: Select one or multiple crew members for any project using the crew checkboxes.

### Tab 2: Company Info
- **Official Business Name**: Sets the legal entity name displayed on formal PDF contracts.
- **Company Logo**: Upload the company logo (used in contract and termination document headers).
- **Business Name Card**: Custom text or card details for client communications.
- **Upgrade to Premium**: Upgrade to Premium (\$4.99/mo) to extend video attachments from 1 minute to 7 minutes and expand project storage.

### Tab 3: People (Employee Management)
A central directory of all company personnel:
- Lists Full Name, Username, Role, Email, Cell Phone, and Account Status.
- **Activate / Deactivate User**:
  - Click **Deactivate** to revoke system access (`● Deactivated`). Deactivated users cannot log in.
  - Click **Activate** to restore login permissions.
  - Admins cannot deactivate their own account.
- **Reset Password**: Generates and sends a temporary password directly to the employee.

### User Approval & Denied User Handling
- When new Managers or Crews sign up using your Company ID, they appear in the **Pending User Approvals** queue.
- **Approve**: Immediately activates the account (`● Active`).
- **Deny**:
  - The pending prompt disappears from the approval list.
  - The user is automatically moved to the **People** roster with **Inactive** status (`● Inactive`).
  - Denied users are blocked from logging in with a 403 Forbidden message.
  - If a denied user was rejected in error, an Admin can click **Activate** in the People tab to restore their access at any time.

---

## 💼 Manager (Project Manager) Guide

> [!TIP]
> Managers drive daily operations: drafting projects, preparing contracts, executing change orders, and tracking payments.

### Creating & Managing Projects
1. From the Dashboard, click **+ Add Project**.
2. Provide mandatory fields: Project Name, Working Address, Customer Name, Phone, and Billing Address.
3. Optional: Set Customer Email and check **"Crews can view contract and payment"** if field teams need financial visibility.
4. Click **Save Project** to generate the project folder.

### Two-Step Contract Creation Wizard
When clicking **+ Add Contract**, the application opens a guided two-step wizard:

```
┌───────────────────────────────┐         ┌───────────────────────────────┐
│  Step 1: Review & Add Notes   │ ──────> │   Step 2: Contract Details    │
│  • Summary banner with total  │         │  • Customer & Seller Name     │
│  • Inline note & price form   │ <────── │  • Price & Preview Items      │
│  • Live included notes feed   │ (Back)  │  • Contract & Expiry Dates    │
└───────────────────────────────┘         └───────────────────────────────┘
```

#### Step 1: Review & Add Notes
- **Summary Banner**: Displays the number of notes included in the contract and the estimated total price derived from line item notes.
- **Inline Add Note**: Enter note content, optional item price, uncontract toggle (exclude from contract), and attachments.
  - Clicking **+ Add Note** saves the note immediately, updates the feed, and recalculates the contract price without leaving the screen.
- **Reviewed Notes List**: Inspect all project notes with item prices, timestamps, and status badges (`✓ Included in Contract` vs `Uncontracted`).
- Click **Next: Contract Details →** to proceed to Step 2.

#### Step 2: Contract Details
- Customer Name, Your Name, Phone, Contract Date, and Expiration Date.
- **Price Synchronization**: Pre-filled automatically from the reviewed notes in Step 1.
- **Preview Items**: Click to inspect or adjust individual line item descriptions and rates before generating the contract.
- **← Back**: Click to return to Step 1 to review or add notes without losing entered contract details.
- Click **Next: Preview Contract** to review the generated PDF preview.

### Change Order Flow
When changes occur after a base contract is signed:
1. Add new notes with prices for the additional work.
2. In the project view, click **+ Add Change Order**.
3. Step 1 displays only the new notes created since the latest contract.
4. Step 2 pre-fills existing client information and aggregates only the change order items into the change order total.

### Payment Tracking & Balance Due
- In the project view, click **+ Add Payment** to record client deposits or milestone payments.
- Supports Cash, Check, Zelle, and Bank Transfer with receipt photo attachments.
- Check **"Deposit Paid in Full"** when applicable.
- The project header dynamically calculates and displays:
  $$\text{Remaining Balance} = \sum(\text{Contract Notes}) - \sum(\text{Payments})$$

### Project Termination Document
If a project is cancelled or terminated:
1. In the project header, change the status dropdown to **Terminated**.
2. A formal prompt opens requesting:
   - **Reason for Termination** (mandatory text).
   - **Termination Date & Time** (`datetime-local`).
   - **Authorized Signature** (digital signature canvas).
3. Confirming generates an official **Termination Doc** PDF matching company branding.
4. The document is permanently archived in the project's contract column with a dedicated **View** button.

---

## 👷 Crew (Field Worker) Guide

> [!NOTE]
> Crew members focus on jobsite reporting and documentation.

1. **Dashboard Access**:
   - Crew dashboards only display projects to which the crew member has been explicitly assigned.
2. **Field Notes & Media**:
   - Post progress updates with voice-to-text dictation.
   - Upload jobsite photos (max 5MB each) and videos (up to 1 min standard, 7 mins premium). Max 2 attachments per note, 20 per project.
   - Tag notes as **Uncontracted** for internal communication that should not appear on client contracts.
3. **Reply Threads**:
   - Comment directly on notes posted by managers or coworkers to keep communication organized.
4. **Contract & Payment Privacy**:
   - Contracts and payment columns are hidden from crew users unless the Manager checked *"Crews can view contract and payment"* in project settings.

---

## ✍️ Customer / Client Guide (E-Signatures)

Customers do not need to register an account or install any app.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DIGITAL SIGNATURE FLOW                          │
│                                                                        │
│  1. Manager Generates Contract ──>  2. Select "Sign Later"             │
│                                            │                           │
│  4. Project Status: Signed     <──  3. Client Opens Email & Signs      │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Receiving the Contract**: The customer receives an email from **Resend** with the project details and a prominent **"Review & Sign Contract"** button.
2. **Reviewing Terms**: The signing page displays the contractor's official logo, business details, project address, and itemized line items.
3. **Digital Signature**: The customer draws their signature on the touch-friendly canvas using a finger, stylus, or mouse.
4. **Instant Archival**: Once submitted, the contract status automatically updates to **Signed**, and the final countersigned PDF becomes immediately available.

---

## 📧 Resend Email Service & MCP Integration

FieldSync is integrated with **Resend** for reliable, transactional email delivery.

### Configuration
In [`.env`](file:///Users/carolcong/Projects/contractsWebsites/.env):
```env
# Resend Email Configuration
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=FieldSync <onboarding@resend.dev>
```

### Supported Email Triggers
1. **Password Reset Emails**: Dispatches a secure reset link when an Admin requests password recovery.
2. **Contract Signing Emails**: Sends remote signature links to customers when "Sign Later" is selected.
3. **Temporary Password Notifications**: Delivers temporary passwords to staff upon admin reset.

### Checking Email Health
Visit [http://localhost:8080/api/email-status](http://localhost:8080/api/email-status) to confirm active configuration:
```json
{"configured": true, "sender": "FieldSync <onboarding@resend.dev>"}
```

### Model Context Protocol (MCP) Server
The **Resend MCP Server** is installed both globally and within the workspace:
- **Global**: `~/.gemini/config/mcp_config.json`
- **Workspace**: `.agents/mcp_config.json`
- **Endpoint**: `https://mcp.resend.com/mcp` (Streamable HTTP with built-in OAuth support).

---

## 📱 Mobile, Tablet & Multi-Language Support

### Mobile & Tablet Optimizations
- **Responsive Stacking**: On mobile devices and tablets ($\le$ 1024px width), dashboard cards stack in a single column for seamless vertical touch scrolling.
- **Touch Canvases**: Digital signature canvases support touch, Apple Pencil, and stylus input with high-DPI smoothing.
- **Voice-to-Text**: Click the microphone icon next to any note or input field to dictate field notes hands-free.
- **Double-Click Protection**: All action buttons feature `withButtonLock` to prevent accidental double-taps and duplicate submissions.

### Multi-Language Support (i18n)
Use the language selector in the navigation bar to toggle between:
- 🇺🇸 **English** (`en`)
- 🇨🇳 **中文** (`zh`)
- 🇪🇸 **Español** (`es`)

All labels, step wizards, tooltips, validation alerts, and placeholders update instantly across the entire interface.
