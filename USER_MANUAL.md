# 📘 User Manual: FieldSync / CCC Contracts Management System

Welcome to the **FieldSync / CCC Contracts** User Manual. This guide provides comprehensive, role-by-role instructions for using the platform to manage field projects, generate legal contracts, capture digital signatures, track payments, and coordinate field crews.

---

## 📑 Table of Contents
1. [System Overview & Role Hierarchy](#-system-overview--role-hierarchy)
2. [Role Permission Matrix](#-role-permission-matrix)
3. [Super Admin Guide](#-super-admin-guide)
4. [Company Admin Guide](#-company-admin-guide)
5. [Manager (Project Manager) Guide](#-manager-project-manager-guide)
6. [Crew (Field Worker) Guide](#-crew-field-worker-guide)
7. [Customer / Client Guide](#-customer--client-guide)
8. [Core Workflows & Features](#-core-workflows--features)
9. [Mobile & Tablet Usage Guide](#-mobile--tablet-usage-guide)

---

## 🌐 System Overview & Role Hierarchy

FieldSync / CCC Contracts is a multi-tenant contract and field project management application. Organization accounts are structured hierarchically around **Companies**:

```
                       ┌─────────────────────────┐
                       │       SUPER ADMIN       │
                       └────────────┬────────────┘
                                    │ Manages Platform & Companies
                                    ▼
                       ┌─────────────────────────┐
                       │      COMPANY ADMIN      │
                       └────────────┬────────────┘
                                    │ Manages Company & Approvals
                 ┌──────────────────┴──────────────────┐
                 ▼                                     ▼
      ┌────────────────────┐                ┌────────────────────┐
      │  PROJECT MANAGER   │                │   FIELD CREW USER  │
      └──────────┬─────────┘                └────────────────────┘
                 │ Manages Projects & Contracts        │ Views Assigned Work
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
| **Create New Companies** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Approve / Deny Company Users** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Manage Company Branding & Logo** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Create & Edit Projects** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Update Project & Payment Status**| ✅ | ✅ | ✅ | ❌ | ❌ |
| **Assign Crews to Projects** | ✅ | ✅ | ✅ (Own) | ❌ | ❌ |
| **Generate & Sign Contracts** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Send E-Signature Token Links** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Add Field Notes & Attachments** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **View Assigned Projects Only** | N/A | All Co. | All Co. | Assigned | Single Contract |
| **Sign Contract via Token Link** | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 🛡️ Super Admin Guide

> [!IMPORTANT]
> The **Super Admin** role has platform-wide authority across all companies and registered accounts.

### Key Responsibilities
1. **Company Management**:
   - Navigate to the **Super Admin Console**.
   - Create new company profiles by providing the official company name.
2. **User Account Administration**:
   - Provision users with custom roles (`admin`, `manager`, `crew`) and associate them with any company.
   - Reassign user accounts between companies when personnel change.
3. **Global Customer Directory**:
   - Access the platform-wide **Customer Directory** to inspect customer phone numbers, email addresses, and project histories across all registered companies.

---

## 👑 Company Admin Guide

> [!NOTE]
> The **Company Admin** oversees business setup, team member approvals, and project allocations for their specific company.

### 1. User Approval Queue
When new Managers or Crew members register under your company name, their accounts enter a **Pending Approval** state.
- Navigate to the **Admin Console**.
- Locate the **Pending User Approvals** panel.
- Click **Approve** to activate the account or **Deny** to purge unverified registrations.

### 2. Branding & Company Info
- Click **Company Information** in the Admin Console.
- Set your **Official Business Name** (used on formal PDF contract headers).
- Upload your **Company Logo** image URL and **Business Name Card** details.

### 3. Project & Crew Management
- Inspect all company projects across all project managers.
- **Reassign Project Managers**: Transfer project ownership from one Manager to another.
- **Assign Crews**: Select one or multiple registered Crew members for any project.

### 4. Upgrade to Premium Membership
- Click **Upgrade to Premium** to unlock extended video attachment limits (up to 7 minutes per video note) and increased storage quotas.

---

## 💼 Manager (Project Manager) Guide

> [!TIP]
> **Managers** are the primary field operators responsible for client communications, project execution, and financial tracking.

### 1. Creating & Editing Projects
1. From the **Dashboard**, click **+ Add Project**.
2. Fill in mandatory fields:
   - **Project Name** & **Working Address**
   - **Customer Name**, **Phone Number**, and **Billing Address**
   - **Customer Email** (required for digital signatures)
3. Save the project to generate a dedicated project console folder.

### 2. Creating Contracts & E-Signatures
Within a project folder, click **+ Add Contract**:
- **On-the-Spot Signature**: Input contract items and seller name, then capture the customer's signature directly on screen using the digital signature canvas.
- **Sign Later (Email Token Link)**: Check **Sign Later**. The system generates a secure signature token URL:
  `http://<your-domain>/sign.html?token=token_xyz`
  Send this link to the client for remote signing.

### 3. Updating Project & Payment Status
Managers can update the workflow status from the project header dropdown:
- **Project Statuses**: `Draft`, `In-Progress`, `Sent to Client`, `Signed`, `Signed_Unpaid`, `Remaining Balance`, `Terminated`, `Done`.
- **Payment Statuses**: `N/A`, `Unpaid`, `Deposit Paid`, `Paid in Full`.

### 4. Adding Notes & Field Attachments
- Click **+ Add Note** to record project updates.
- Support for voice-to-text input (microphone button).
- Attach photos (up to 5MB each) or videos (up to 100MB / 1 min standard, 7 mins premium). Max 2 attachments per note, 20 per project.

---

## 👷 Crew (Field Worker) Guide

> [!NOTE]
> **Crew members** focus on field execution and status reporting for assigned projects.

### 1. Accessing Assigned Projects
- Log in with your Crew credentials.
- Your dashboard displays **only the projects assigned to you** by your Manager or Admin.

### 2. Field Documentation
- Open an assigned project folder to review customer working address and instructions.
- Add field progress notes, upload site photos, or record site videos.
- Reply to notes posted by Managers or fellow team members.

---

## ✍️ Customer / Client Guide

> [!INFO]
> Customers do not require an account. They access contract signing links sent by Managers via email or text.

### How to Sign a Contract
1. Open the received signature URL (e.g. `https://your-domain.com/sign.html?token=...`).
2. Review the contract details:
   - Company Logo & Business Name
   - Project Name & Working Address
   - Itemized Scope of Work and Final Price
3. Draw your signature on the digital signature canvas using your mouse, stylus, or touchscreen finger.
4. Click **Submit Signature**.
5. Once submitted, the contract status automatically updates to **Signed** on the manager's console.

---

## ⚡ Core Workflows & Features

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DIGITAL SIGNATURE FLOW                          │
│                                                                        │
│  1. Manager Creates Contract  ──>  2. Select "Sign Later"              │
│                                           │                            │
│  4. Contract Status: Signed   <──  3. Client Opens Link & Signs        │
└────────────────────────────────────────────────────────────────────────┘
```

### PDF Contract Generation & Download
- Managers and Admins can preview or download official contract PDFs by clicking **View PDF** or **Preview PDF**.
- PDFs include company branding, official logos, client address details, itemized price tables, and embedded digital signatures.

---

## 📱 Mobile & Tablet Usage Guide

FieldSync is optimized for mobile responsiveness across **iPhones, Android phones, iPads, and Android tablets**:

- **Vertical Project Stacking**: On mobile and tablet screens (width $\le$ 1024px), the **My Projects** dashboard automatically displays in a clean, vertical single-column stack for touch navigation.
- **Touch-Friendly Signature Canvas**: Signature fields adapt to finger touch and Apple Pencil input.
- **Voice-to-Text Input**: Click the microphone icon next to any input field to dictate notes hands-free in the field.
