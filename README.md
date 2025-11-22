PROJECT NAME: TalentLink (IECS-IEDIS ATS)
TYPE: Institutional Applicant Tracking System (Bolsa de Trabajo)
STACK: Next.js 14 (App Router), Prisma ORM, MySQL, Tailwind CSS, NextAuth v5.
CORE MISSION:
A robust, end-to-end recruitment platform for a multi-campus educational institution. It allows internal staff (Admins/Directors) to manage vacancies and candidates while providing a seamless, login-free application experience for the public.
CURRENT ARCHITECTURE & SCOPE:
1. Authentication & Security (The "Corporate Wall")
Strategy: Domain Lock. Only Google Accounts from @casitaiedis.edu.mx can log in.
Role System: Database-driven RBAC (Role-Based Access Control).
Roles: Dynamic (Super Admin, Director, Recruiter, etc.).
Permissions: Granular permissions (e.g., MANAGE_JOBS, VIEW_CANDIDATES, MANAGE_CONFIG).
Scope: isGlobal flag determines if a user sees ALL campuses or only their assigned Plantel.
Safety: Automatic bootstrapping of "Super Admin" role for the default environment admin to prevent lockouts.
2. The Candidate Journey (Public Side)
No Login: "Fire and forget". Candidates search, filter by Campus, and Apply.
CV Parsing: Backend analysis of PDF/DOCX to extract text for internal searching.
Logic: Jobs disappear from public view automatically after closingDate, but remain visible as "Expired" in the Dashboard.
3. The Recruiter Dashboard (Internal Side)
Views:
List View: Standard table with search (indexes Name, Email, and CV Content).
Kanban Board: Drag-and-drop workflow (New -> Interview -> Talent Pool -> Hired/Rejected). Includes client-side filtering for high-volume data.
Calendar: Month/Agenda view of scheduled interviews.
Application Details:
Status Manager: Modal to change status + Optional Email Notification + Email Preview.
Interview Scheduler: Sets date/time and auto-generates Google Maps links in emails.
Dynamic Checklist: Admin-defined requirements (e.g., IDs, Docs) tracked per candidate.
Talent Pool (Cartera): "Favorite" toggle to save candidates for later without hiring them.
4. Dynamic Infrastructure (Settings Hub)
Hub: Centralized /dashboard/settings panel.
Planteles: Manage physical campuses (Name, Code, Address, Lat/Lng).
Puestos (Job Titles): Standardized catalog (No free-text job titles). Enforced via Autocomplete in Job Forms.
Checklists: Dynamic builder for candidate requirements (Text, Checkbox, Date fields).
User Manager: Assign Roles and specific Planteles to staff.
5. Automated Communications
Tech: Google API (Gmail) direct integration.
Templates: "State of the Art" HTML designs.
Logic:
Interview: Auto-injects Address, Date, and Google Maps Link.
Rejection: "Soft" rejection templates for Talent Pool vs Hard rejection.
Safety: Emails are OFF by default in the UI actions to prevent accidental spam.