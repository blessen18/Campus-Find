# CampusFind — Complete College Lost & Found Web Application

A centralized digital platform designed for colleges and universities to connect students, faculty, and authorized staff to report, discover, verify, and recover lost belongings across campus.

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase (Auth, Realtime, Storage, Postgres RLS)**.

---

## 🌟 Key Features

1. **Dual Reporting Workflows**:
   - **Report Lost Item**: Detailed description, category, date, approximate campus location, optional photo uploads, and confidential identifying markers.
   - **Report Found Item**: General public description with private identifying details protected from public view.

2. **Real-Time Synchronization**:
   - Subscribes to database changes via Supabase Realtime. New reports and status changes instantly appear without manual page refreshing.

3. **Privacy & Anti-Theft Guardrails**:
   - Unique serial numbers, laptop passwords, and private marks remain strictly invisible to the general public.
   - Admin verification is mandatory before sensitive claimant/finder contact information is exchanged.

4. **Claim & Verification System**:
   - Claimants must provide substantive proof of ownership (detailed descriptions, purchase receipts, photos).
   - Campus admins review and either approve or reject claims with custom feedback notes.

5. **Role-Based Access Control (RBAC)**:
   - **Student / Faculty / Staff**: Report items, track personal reports, submit ownership claims, receive notification alerts.
   - **Campus Admin**: Access full management dashboard, review pending claims, verify proofs, resolve items, audit users.

6. **Full Responsive Design**:
   - University-grade clean UI following clean academic styling: deep forest green navigation bar, crisp typography, accessible cards, and responsive grid/list views.

---

## 🚀 Quick Setup & Installation

### 1. Prerequisites
- Node.js 18+ (tested on Node.js v20+)
- A free [Supabase](https://supabase.com) account

### 2. Configure Environment Variables
Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```

Fill in your project credentials from your Supabase Dashboard (**Project Settings > API**):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3006
NEXT_PUBLIC_COLLEGE_EMAIL_DOMAIN=ajce.edu.in
```

### 3. Database & Storage Initialization
1. In your Supabase Dashboard, go to **SQL Editor > New Query**.
2. Copy and paste the complete SQL script from `supabase/schema.sql` and run it.
3. In **Storage**, create two buckets:
   - `item-images` (set to **Public**)
   - `claim-proofs` (set to **Private / Authenticated only**)
4. In **Database > Replication**, enable replication for:
   - `items`
   - `claims`
   - `notifications`

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3006](http://localhost:3006) in your browser.

---

## 📁 Project Structure

```
campusfind/
├── app/
│   ├── layout.tsx                # Root layout with Toast & Navbar
│   ├── page.tsx                  # Home page with hero, search, stats & feeds
│   ├── globals.css               # Tailored university theme & components
│   ├── lost-items/               # Active lost items feed with filters
│   ├── found-items/              # Found items feed with privacy shields
│   ├── items/[id]/               # Item details & claim modal
│   ├── report/
│   │   ├── lost/page.tsx         # Report lost item form
│   │   └── found/page.tsx        # Report found item form
│   ├── dashboard/                # User dashboard (reports & claims)
│   │   └── edit/[id]/page.tsx    # Edit item report
│   ├── admin/                    # Admin command center & claim queue
│   │   └── claims/[id]/page.tsx  # Detailed claim review & decision
│   ├── auth/
│   │   ├── login/page.tsx        # Sign in
│   │   ├── register/page.tsx     # Student/faculty registration
│   │   ├── reset-password/       # Password reset request
│   │   └── update-password/      # New password callback
│   └── api/
│       ├── claims/route.ts       # Secure claim submission endpoint
│       └── admin/claims/[id]/    # Admin approve/reject endpoint
├── components/
│   ├── Navbar.tsx                # Header with auth state & notification bell
│   ├── ItemCard.tsx              # Card & List view items
│   ├── ItemFilters.tsx           # Category, location & keyword search
│   ├── ImageUpload.tsx           # Multi-image drag-and-drop uploader
│   ├── ClaimModal.tsx            # Ownership claim modal with proof attachment
│   ├── ReportForm.tsx            # Form for lost/found items
│   └── providers/ToastProvider.tsx # Realtime toast alerts
├── hooks/
│   ├── useItems.ts               # Realtime item subscription hook
│   └── useAuth.ts                # Auth state hook
├── lib/
│   ├── supabase/client.ts        # Browser client
│   ├── supabase/server.ts        # Server & Admin client
│   └── utils.ts                  # Helpers & campus categories/locations
├── supabase/
│   └── schema.sql                # Complete PostgreSQL schema, RLS & triggers
└── types/index.ts                # TypeScript interfaces
```

---

## 🔒 Security Best Practices
- **Row Level Security (RLS)** is strictly enforced across all database tables.
- **Service Role Key** is never exposed to browser bundles (server-side only).
- **Claim Isolation**: Regular users cannot see proof attachments or confidential identifying markers of other users.

