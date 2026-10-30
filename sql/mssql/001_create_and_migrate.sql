-- Promax Event Platform — SQL Server schema and seed
-- Database: YorubaDayCanberra
-- Server:   VMI3197632\SQLEXPRESS in SSMS, 127.0.0.1\SQLEXPRESS from the Node app
--
-- Run in SSMS while connected to YorubaDayCanberra, or let the app apply it
-- on startup (instrumentation.ts). The script is idempotent.
--
-- Committee logins are NOT inserted here. The app creates the Super Admin
-- from ADMIN_EMAIL and ADMIN_PASSWORD when it starts, and invitations create
-- the other committee accounts. Passwords are scrypt hashes, which T-SQL
-- cannot produce.
--
-- Existing Supabase rows are copied by:
--   npm run db:migrate
-- That command reapplies this script, then inserts any rows still stored in
-- Supabase when the old Supabase environment variables are present.

-- ── Events ──────────────────────────────────────────────────────────
IF OBJECT_ID(N'dbo.events', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.events (
    id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_events PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    slug NVARCHAR(120) NOT NULL,
    name NVARCHAR(200) NOT NULL,
    tagline NVARCHAR(500) NULL,
    event_date DATE NULL,
    start_time DATETIMEOFFSET NULL,
    end_time DATETIMEOFFSET NULL,
    timezone NVARCHAR(80) NOT NULL CONSTRAINT DF_events_timezone DEFAULT N'Australia/Sydney',
    location NVARCHAR(200) NULL,
    address NVARCHAR(400) NULL,
    description NVARCHAR(MAX) NULL,
    contact_email NVARCHAR(320) NULL,
    contact_phone NVARCHAR(50) NULL,
    website NVARCHAR(400) NULL,
    is_active BIT NOT NULL CONSTRAINT DF_events_is_active DEFAULT 1,
    created_at DATETIMEOFFSET NOT NULL CONSTRAINT DF_events_created DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET NOT NULL CONSTRAINT DF_events_updated DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT UQ_events_slug UNIQUE (slug)
  );
END
GO

-- ── Profiles (committee accounts) ───────────────────────────────────
IF OBJECT_ID(N'dbo.profiles', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.profiles (
    id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_profiles PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    email NVARCHAR(320) NOT NULL,
    password_hash NVARCHAR(500) NULL,
    full_name NVARCHAR(200) NULL,
    role NVARCHAR(32) NOT NULL CONSTRAINT DF_profiles_role DEFAULT N'COMMITTEE',
    is_active BIT NOT NULL CONSTRAINT DF_profiles_is_active DEFAULT 1,
    created_at DATETIMEOFFSET NOT NULL CONSTRAINT DF_profiles_created DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET NOT NULL CONSTRAINT DF_profiles_updated DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT UQ_profiles_email UNIQUE (email),
    CONSTRAINT CK_profiles_role CHECK (role IN (N'SUPER_ADMIN', N'ADMIN', N'COMMITTEE', N'VOLUNTEER'))
  );
END
GO

IF COL_LENGTH(N'dbo.profiles', N'password_hash') IS NULL
  ALTER TABLE dbo.profiles ADD password_hash NVARCHAR(500) NULL;
GO

-- ── Account setup / password reset tokens ───────────────────────────
IF OBJECT_ID(N'dbo.account_tokens', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.account_tokens (
    id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_account_tokens PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    profile_id UNIQUEIDENTIFIER NOT NULL,
    token_hash CHAR(64) NOT NULL,
    purpose NVARCHAR(20) NOT NULL,
    expires_at DATETIMEOFFSET NOT NULL,
    used_at DATETIMEOFFSET NULL,
    created_at DATETIMEOFFSET NOT NULL CONSTRAINT DF_account_tokens_created DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT FK_account_tokens_profile FOREIGN KEY (profile_id) REFERENCES dbo.profiles(id),
    CONSTRAINT UQ_account_tokens_hash UNIQUE (token_hash),
    CONSTRAINT CK_account_tokens_purpose CHECK (purpose IN (N'invite', N'recovery'))
  );
END
GO

-- ── RSVPs ───────────────────────────────────────────────────────────
IF OBJECT_ID(N'dbo.rsvps', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.rsvps (
    id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_rsvps PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    full_name NVARCHAR(200) NOT NULL,
    email NVARCHAR(320) NOT NULL,
    phone NVARCHAR(50) NULL,
    number_of_attendees INT NOT NULL CONSTRAINT DF_rsvps_attendees DEFAULT 1,
    ticket_type NVARCHAR(100) NULL,
    notes NVARCHAR(MAX) NULL,
    created_at DATETIMEOFFSET NOT NULL CONSTRAINT DF_rsvps_created DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET NOT NULL CONSTRAINT DF_rsvps_updated DEFAULT SYSDATETIMEOFFSET(),
    status NVARCHAR(20) NOT NULL CONSTRAINT DF_rsvps_status DEFAULT N'new',
    internal_notes NVARCHAR(MAX) NULL,
    committee_notes NVARCHAR(MAX) NULL,
    contacted_at DATETIMEOFFSET NULL,
    tags NVARCHAR(MAX) NOT NULL CONSTRAINT DF_rsvps_tags DEFAULT N'[]',
    event_slug NVARCHAR(120) NOT NULL CONSTRAINT DF_rsvps_event DEFAULT N'yoruba-day-canberra-2026',
    registration_reference NVARCHAR(40) NULL,
    email_consent BIT NOT NULL CONSTRAINT DF_rsvps_email_consent DEFAULT 1,
    sms_consent BIT NOT NULL CONSTRAINT DF_rsvps_sms_consent DEFAULT 0,
    marketing_consent BIT NOT NULL CONSTRAINT DF_rsvps_marketing_consent DEFAULT 0,
    email_status NVARCHAR(32) NOT NULL CONSTRAINT DF_rsvps_email_status DEFAULT N'pending',
    email_sent_at DATETIMEOFFSET NULL,
    email_provider_id NVARCHAR(200) NULL,
    sms_status NVARCHAR(32) NOT NULL CONSTRAINT DF_rsvps_sms_status DEFAULT N'not_attempted',
    sms_sent_at DATETIMEOFFSET NULL,
    sms_provider_id NVARCHAR(200) NULL,
    CONSTRAINT CK_rsvps_status CHECK (status IN (N'new', N'contacted', N'confirmed', N'cancelled')),
    CONSTRAINT CK_rsvps_email_status CHECK (email_status IN (
      N'not_attempted', N'pending', N'sent', N'failed', N'disabled', N'consent_declined', N'not_configured', N'skipped'
    )),
    CONSTRAINT CK_rsvps_sms_status CHECK (sms_status IN (
      N'not_attempted', N'sent', N'failed', N'disabled', N'not_configured', N'skipped'
    ))
  );
END
GO

-- ── Sponsors ────────────────────────────────────────────────────────
IF OBJECT_ID(N'dbo.sponsors', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.sponsors (
    id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_sponsors PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    event_slug NVARCHAR(120) NOT NULL CONSTRAINT DF_sponsors_event DEFAULT N'yoruba-day-canberra-2026',
    company_name NVARCHAR(200) NOT NULL,
    contact_person NVARCHAR(200) NOT NULL,
    email NVARCHAR(320) NOT NULL,
    phone NVARCHAR(50) NULL,
    website NVARCHAR(400) NULL,
    package NVARCHAR(100) NOT NULL,
    message NVARCHAR(MAX) NULL,
    logo_url NVARCHAR(400) NULL,
    status NVARCHAR(20) NOT NULL CONSTRAINT DF_sponsors_status DEFAULT N'new',
    committee_notes NVARCHAR(MAX) NULL,
    created_at DATETIMEOFFSET NOT NULL CONSTRAINT DF_sponsors_created DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET NOT NULL CONSTRAINT DF_sponsors_updated DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT CK_sponsors_status CHECK (status IN (N'new', N'contacted', N'approved', N'declined', N'active', N'completed'))
  );
END
GO

-- ── Volunteers ──────────────────────────────────────────────────────
IF OBJECT_ID(N'dbo.volunteers', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.volunteers (
    id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_volunteers PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    event_slug NVARCHAR(120) NOT NULL CONSTRAINT DF_volunteers_event DEFAULT N'yoruba-day-canberra-2026',
    full_name NVARCHAR(200) NOT NULL,
    email NVARCHAR(320) NOT NULL,
    phone NVARCHAR(50) NULL,
    skills NVARCHAR(MAX) NOT NULL CONSTRAINT DF_volunteers_skills DEFAULT N'[]',
    availability NVARCHAR(MAX) NULL,
    area_of_interest NVARCHAR(400) NULL,
    assigned_role NVARCHAR(200) NULL,
    notes NVARCHAR(MAX) NULL,
    committee_notes NVARCHAR(MAX) NULL,
    status NVARCHAR(20) NOT NULL CONSTRAINT DF_volunteers_status DEFAULT N'new',
    created_at DATETIMEOFFSET NOT NULL CONSTRAINT DF_volunteers_created DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET NOT NULL CONSTRAINT DF_volunteers_updated DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT CK_volunteers_status CHECK (status IN (N'new', N'contacted', N'approved', N'assigned', N'declined', N'inactive'))
  );
END
GO

-- ── Tasks ───────────────────────────────────────────────────────────
IF OBJECT_ID(N'dbo.tasks', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.tasks (
    id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_tasks PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    event_slug NVARCHAR(120) NOT NULL CONSTRAINT DF_tasks_event DEFAULT N'yoruba-day-canberra-2026',
    title NVARCHAR(200) NOT NULL,
    description NVARCHAR(MAX) NULL,
    status NVARCHAR(20) NOT NULL CONSTRAINT DF_tasks_status DEFAULT N'todo',
    priority NVARCHAR(20) NOT NULL CONSTRAINT DF_tasks_priority DEFAULT N'medium',
    assigned_to UNIQUEIDENTIFIER NULL,
    created_by UNIQUEIDENTIFIER NULL,
    due_date DATE NULL,
    created_at DATETIMEOFFSET NOT NULL CONSTRAINT DF_tasks_created DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET NOT NULL CONSTRAINT DF_tasks_updated DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT FK_tasks_assigned_to FOREIGN KEY (assigned_to) REFERENCES dbo.profiles(id),
    CONSTRAINT FK_tasks_created_by FOREIGN KEY (created_by) REFERENCES dbo.profiles(id),
    CONSTRAINT CK_tasks_status CHECK (status IN (N'todo', N'in_progress', N'blocked', N'completed')),
    CONSTRAINT CK_tasks_priority CHECK (priority IN (N'low', N'medium', N'high', N'urgent'))
  );
END
GO

-- ── Programme ───────────────────────────────────────────────────────
IF OBJECT_ID(N'dbo.programme_items', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.programme_items (
    id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_programme_items PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    event_slug NVARCHAR(120) NOT NULL CONSTRAINT DF_programme_event DEFAULT N'yoruba-day-canberra-2026',
    title NVARCHAR(200) NOT NULL,
    description NVARCHAR(MAX) NULL,
    start_time DATETIMEOFFSET NULL,
    end_time DATETIMEOFFSET NULL,
    location NVARCHAR(200) NULL,
    speaker NVARCHAR(200) NULL,
    category NVARCHAR(100) NULL,
    display_order INT NOT NULL CONSTRAINT DF_programme_order DEFAULT 0,
    published BIT NOT NULL CONSTRAINT DF_programme_published DEFAULT 0,
    created_at DATETIMEOFFSET NOT NULL CONSTRAINT DF_programme_created DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET NOT NULL CONSTRAINT DF_programme_updated DEFAULT SYSDATETIMEOFFSET()
  );
END
GO

-- ── Announcements ───────────────────────────────────────────────────
IF OBJECT_ID(N'dbo.announcements', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.announcements (
    id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_announcements PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    event_slug NVARCHAR(120) NOT NULL CONSTRAINT DF_announcements_event DEFAULT N'yoruba-day-canberra-2026',
    title NVARCHAR(200) NOT NULL,
    body NVARCHAR(MAX) NOT NULL,
    is_published BIT NOT NULL CONSTRAINT DF_announcements_published DEFAULT 0,
    published_at DATETIMEOFFSET NULL,
    scheduled_for DATETIMEOFFSET NULL,
    created_by UNIQUEIDENTIFIER NULL,
    archived_at DATETIMEOFFSET NULL,
    created_at DATETIMEOFFSET NOT NULL CONSTRAINT DF_announcements_created DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET NOT NULL CONSTRAINT DF_announcements_updated DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT FK_announcements_created_by FOREIGN KEY (created_by) REFERENCES dbo.profiles(id)
  );
END
GO

-- ── Activity logs ───────────────────────────────────────────────────
IF OBJECT_ID(N'dbo.activity_logs', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.activity_logs (
    id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_activity_logs PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    event_slug NVARCHAR(120) NOT NULL CONSTRAINT DF_activity_event DEFAULT N'yoruba-day-canberra-2026',
    action NVARCHAR(120) NOT NULL,
    entity_type NVARCHAR(80) NULL,
    entity_id UNIQUEIDENTIFIER NULL,
    actor_id UNIQUEIDENTIFIER NULL,
    metadata NVARCHAR(MAX) NOT NULL CONSTRAINT DF_activity_metadata DEFAULT N'{}',
    created_at DATETIMEOFFSET NOT NULL CONSTRAINT DF_activity_created DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT FK_activity_actor FOREIGN KEY (actor_id) REFERENCES dbo.profiles(id)
  );
END
GO

-- ── Indexes ─────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_rsvps_event_slug' AND object_id = OBJECT_ID(N'dbo.rsvps'))
  CREATE INDEX IX_rsvps_event_slug ON dbo.rsvps(event_slug);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_rsvps_event_status' AND object_id = OBJECT_ID(N'dbo.rsvps'))
  CREATE INDEX IX_rsvps_event_status ON dbo.rsvps(event_slug, status);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_rsvps_email' AND object_id = OBJECT_ID(N'dbo.rsvps'))
  CREATE INDEX IX_rsvps_email ON dbo.rsvps(email);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_rsvps_created' AND object_id = OBJECT_ID(N'dbo.rsvps'))
  CREATE INDEX IX_rsvps_created ON dbo.rsvps(created_at DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_rsvps_registration_reference' AND object_id = OBJECT_ID(N'dbo.rsvps'))
  CREATE UNIQUE INDEX UX_rsvps_registration_reference ON dbo.rsvps(registration_reference) WHERE registration_reference IS NOT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_profiles_role' AND object_id = OBJECT_ID(N'dbo.profiles'))
  CREATE INDEX IX_profiles_role ON dbo.profiles(role);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_sponsors_event' AND object_id = OBJECT_ID(N'dbo.sponsors'))
  CREATE INDEX IX_sponsors_event ON dbo.sponsors(event_slug, created_at DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_volunteers_event' AND object_id = OBJECT_ID(N'dbo.volunteers'))
  CREATE INDEX IX_volunteers_event ON dbo.volunteers(event_slug, created_at DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_tasks_event' AND object_id = OBJECT_ID(N'dbo.tasks'))
  CREATE INDEX IX_tasks_event ON dbo.tasks(event_slug, status);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_programme_order' AND object_id = OBJECT_ID(N'dbo.programme_items'))
  CREATE INDEX IX_programme_order ON dbo.programme_items(event_slug, display_order);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_announcements_event' AND object_id = OBJECT_ID(N'dbo.announcements'))
  CREATE INDEX IX_announcements_event ON dbo.announcements(event_slug, created_at DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_activity_event' AND object_id = OBJECT_ID(N'dbo.activity_logs'))
  CREATE INDEX IX_activity_event ON dbo.activity_logs(event_slug, created_at DESC);
GO

-- ── Seed the Yoruba Day event row (the platform record that must exist) ─
MERGE dbo.events AS target
USING (SELECT N'yoruba-day-canberra-2026' AS slug) AS source
ON target.slug = source.slug
WHEN NOT MATCHED THEN
  INSERT (
    slug, name, tagline, event_date, start_time, end_time, timezone,
    location, address, description, contact_email, website, is_active
  )
  VALUES (
    N'yoruba-day-canberra-2026',
    N'Yoruba Day Canberra 2026',
    N'An elevated celebration of Yoruba culture in Canberra',
    '2026-11-22',
    '2026-11-22T14:00:00+11:00',
    '2026-11-22T22:00:00+11:00',
    N'Australia/Sydney',
    N'Canberra, ACT',
    N'Canberra, ACT, Australia',
    N'Yoruba Day Canberra 2026 — language, music, dress, cuisine, and community unity on Ngunnawal country.',
    N'info@yorubadaycanberra.org',
    N'https://yorubadaycanberra.org',
    1
  );
GO

-- Record copy from Supabase is performed by scripts/migrate-to-mssql.mjs.
-- It inserts into these tables, preserving ids, and skips rows already present:
--   events, profiles, rsvps, sponsors, volunteers, tasks, programme_items,
--   announcements, activity_logs
-- Profiles copied from Supabase have no password until an administrator sends
-- a setup email or the bootstrap admin password is applied.
