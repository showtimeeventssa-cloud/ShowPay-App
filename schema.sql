-- Optional Supabase schema for future cloud/shared sync. The app works locally without Supabase.
create table if not exists shows(id uuid primary key, title text, date date, venue text, fee numeric, owner text);
create table if not exists clients(id uuid primary key, name text, vat text, phone text, email text, address text);
create table if not exists quotes(id uuid primary key, number text, reference text, date date, due date, event_date date, client_id uuid, subtotal numeric, vat numeric, vat_rate numeric, total numeric, status text, data jsonb);
create table if not exists invoices(id uuid primary key, number text, reference text, date date, due date, event_date date, client_id uuid, subtotal numeric, vat numeric, vat_rate numeric, total numeric, status text, paid_date date, data jsonb);
