# Supabase setup

The shared photo and diary space uses Supabase Postgres plus a private Storage
bucket. The normal shared-space flow does not require an email, password, or
account. A high-entropy invite link connects each device; the server stores only
the invite/session token hashes and issues an HTTP-only device cookie.

Supabase credentials are server-only. Never put the database URL, service-role
key, or bootstrap key in a `VITE_` variable or client code.

## 1. Create a Supabase project

Create a project at [supabase.com](https://supabase.com). In **Project
Settings → API**, copy the project URL and the `service_role` secret key. Keep
the service-role key private.

In **Project Settings → Database → Connect**, choose the **Session pooler**
connection string for `DATABASE_URL`. It is used by the deployment migration
script. Do not use a browser-visible key for `DATABASE_URL`.

## 2. Configure Netlify environment variables

In **Site configuration → Environment variables**, add the following
server-side variables to the production context (and branch deploy contexts
only if they should use the same Supabase project):

| Variable                    | Value                                                     |
| --------------------------- | --------------------------------------------------------- |
| `DATABASE_URL`              | Supabase Postgres Session pooler connection string        |
| `SUPABASE_URL`              | Project URL, e.g. `https://<project-ref>.supabase.co`     |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase `service_role` secret key                        |
| `SECRET_SPACE_BOOTSTRAP_KEY`| Random secret of at least 32 characters for first setup   |

Generate the bootstrap key with a password manager. Enter it only on the first
device to initialize the shared space. After that device connects, remove this
environment variable from Netlify and redeploy. Connected devices can create
a new invite link from inside the app; creating a new link revokes previous
unused invite links. Existing device sessions continue to work.

Never prefix these values with `VITE_`. Redeploy after changing variables.

## 3. Create the private Storage bucket

In **SQL Editor**, run [`supabase/storage-setup.sql`](./supabase/storage-setup.sql).
It creates a private `secret-space` bucket with a 15 MB per-image limit and
allows supported image formats. The app server generates short-lived signed
viewing URLs. Do not make the bucket public and do not add `anon` or
`authenticated` Storage policies.

## 4. Database schema and access model

The Netlify build command (`npm run build`) applies the ordered SQL files in
[`migrations/`](./migrations/), including `0003_shared_secret_space.sql`,
through `DATABASE_URL`. The migration creates separate tables for the shared
space; earlier account-scoped records are not rewritten or exposed to the
shared space.

Row-level security is enabled without public policies. Only server routes use
the service-role key, and those routes verify the high-entropy invite/device
token before reading or mutating the shared space. Raw invite tokens are never
stored in the database. Device sessions are kept in `HttpOnly`, `SameSite`
cookies; invite links carry their secret in the URL fragment, which is not sent
to the web server in the initial page request.

To connect another device, open the app's **Thời không khoảnh khắc** experience
using the invite link. The device is connected without signing in. Keep the
invite private: anyone who obtains an unused link can join. Generate a new link
to revoke outstanding invite links.

The existing `/login` account flow remains separate for compatibility; it is
not required to upload, view, or sync shared-space content.

## 5. Existing browser/account data

The prior IndexedDB stores and account-scoped Supabase tables are left intact.
In the connected space, choose **Nhập dữ liệu cũ** to review and explicitly
confirm a copy of available legacy photos and diary entries. Original records
are not deleted. Existing drafts are copied as diary entries so they do not
overwrite the shared draft.

Offline uploads, edits, and deletes are saved in a separate IndexedDB sync
outbox. The app retries when connectivity returns and also provides a manual
refresh/retry action. The outbox is local to each browser until it syncs; keep
the source device data until the queue shows that synchronization is complete.
