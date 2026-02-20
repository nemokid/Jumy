# Jumy - Private Messaging

A privacy-first messaging web app where we know nothing about you.

![Jumy Logo](public/icon.png)

## Core Values

- **Anonymity**: No email, no phone number, just a username
- **Full Deniability**: Wrong PIN = fake mode (app works but shows nothing real)
- **Ephemerality**: All messages auto-delete after 24 hours
- **Privacy**: Client-side encryption for everything

## Features

| Feature | Description |
|---------|-------------|
| Anonymous Accounts | Only username + 5-digit PIN required |
| Client-side Encryption | Messages & files encrypted in browser using AES-256-GCM |
| Fake Mode | Wrong PIN shows fake inbox - indistinguishable from real |
| File Attachments | Up to 10MB per message, encrypted |
| Auto-delete | Messages expire after 24 hours |
| No Traces | Sent messages never stored locally |

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Vercel Postgres
- **File Storage**: Vercel Blob
- **Styling**: Tailwind CSS
- **Encryption**: Web Crypto API (AES-256-GCM, PBKDF2)

## Deploy to Vercel

### 1. One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/jumy)

### 2. Add Storage

After deploying, add these from your Vercel dashboard:

1. **Vercel Postgres**: Project Settings → Storage → Create Database → Postgres
2. **Vercel Blob**: Project Settings → Storage → Create Database → Blob

### 3. Initialize Database

The tables are created automatically on first API call, or run manually:

```bash
npx vercel env pull .env.local
node scripts/setup-db.mjs
```

### 4. Configure Cron (optional)

The cleanup cron runs hourly to delete expired messages. It's configured in `vercel.json`.

For security, set `CRON_SECRET` in environment variables and the cron will verify this token.

## Local Development

```bash
# Install dependencies
npm install

# Pull environment variables from Vercel
npx vercel env pull .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
jumy/
├── app/
│   ├── api/              # API routes (serverless functions)
│   │   ├── check-username/
│   │   ├── register/
│   │   ├── login/
│   │   ├── verify-pin/
│   │   ├── inbox/
│   │   ├── send/
│   │   ├── upload/
│   │   ├── delete-message/
│   │   ├── change-pin/
│   │   ├── wipe/
│   │   └── cron/cleanup/
│   ├── layout.js         # Root layout
│   ├── page.js           # Main page (client component)
│   └── globals.css       # Global styles
├── src/
│   ├── components/       # React components
│   └── lib/
│       ├── api.js        # API client
│       ├── crypto.js     # Client-side encryption
│       └── db.js         # Database utilities
├── public/
│   └── icon.png          # App icon
├── vercel.json           # Vercel config (cron)
└── README.md
```

## Security Architecture

### Client-Side Encryption

All encryption happens in the browser before data is sent to the server:

1. **Text Messages**: AES-256-GCM with PBKDF2-derived key (100k iterations)
2. **File Attachments**: Same encryption, applied to raw file bytes
3. **Key Derivation**: Recipient's username hash is used as the password

The server never sees plaintext content.

### Fake Mode

When a user enters the wrong PIN:
- Server returns `fakeMode: true`
- Client shows a fake welcome message
- All actions (send, delete, etc.) are silently ignored
- Indistinguishable from real mode to an observer

### What We Store

| Data | Stored As |
|------|-----------|
| Username | SHA-256 hash |
| PIN | SHA-256 hash |
| Messages | Encrypted (AES-256-GCM) |
| Attachments | Encrypted (AES-256-GCM) |
| Logs | IP, timestamp, hashed usernames only |

We **cannot**:
- Read usernames or PINs
- Read message content
- Read file attachments
- Link accounts to real identities

## Environment Variables

| Variable | Description |
|----------|-------------|
| `POSTGRES_URL` | Vercel Postgres connection string |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob access token |
| `CRON_SECRET` | (Optional) Secret for cron endpoint |

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/check-username` | POST | Check if username exists |
| `/api/register` | POST | Create new account |
| `/api/login` | POST | Verify username exists |
| `/api/verify-pin` | POST | Verify PIN (or enter fake mode) |
| `/api/inbox` | POST | Get encrypted messages |
| `/api/upload` | POST | Upload encrypted file |
| `/api/send` | POST | Send encrypted message |
| `/api/delete-message` | POST | Delete a message |
| `/api/change-pin` | POST | Change PIN |
| `/api/wipe` | POST | Delete account |
| `/api/cron/cleanup` | GET | Delete expired messages |

## License

Private project - Jumy
