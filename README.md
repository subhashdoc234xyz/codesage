# CodeSage AI

**AI-Powered GitHub Pull Request Reviewer**

![CodeSage AI Banner](./public/banner.png)

🔗 **Live Demo:** https://codesage-sable.vercel.app/

CodeSage AI is an AI-powered GitHub Pull Request reviewer that gives developers instant, intelligent code feedback. Paste a raw PR diff or a GitHub PR URL, and get a detailed AI review covering bugs, security issues, code quality, and best practices — powered by Gemini 2.5 Flash.

Built for the OSC AI Build 1.0 Hackathon by Team xeno2.

## ✨ Features

- 🤖 AI-powered PR review using Gemini 2.5 Flash
- 🔐 Google & GitHub OAuth authentication via Firebase
- 🔗 Shareable review links for team collaboration
- 📄 Export review reports as Markdown (.md) files
- 📧 Email notifications sent to the logged-in user after each review
- 💻 Clean, responsive UI built with Next.js
- 🔍 Monaco Diff Viewer for side-by-side code comparison

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router) |
| Authentication & Database | Firebase Auth + Firestore |
| AI Model | Gemini 2.5 Flash (Google) |
| Email | Nodemailer + Gmail SMTP |
| Deployment | Vercel |

## 🏗️ Architecture

```
User pastes PR diff/URL on Next.js frontend
        ↓
Firebase handles Google/GitHub authentication
        ↓
PR diff sent to Gemini 2.5 Flash API
        ↓
AI generates detailed review (bugs, security, quality, best practices)
        ↓
Results displayed on dashboard + email notification sent to user
        ↓
User can share review link or export as Markdown
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Firebase project (Auth + Firestore enabled)
- A Gmail account with an App Password for email notifications
- A Gemini API key

### Installation

```bash
git clone https://github.com/subhashdoc234xyz/codesage.git
cd codesage
npm install
```

### Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

GEMINI_API_KEY=

GMAIL_USER=
GMAIL_APP_PASSWORD=
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Deployment

This project is deployed on [Vercel](https://vercel.com). To deploy your own instance, connect this repository to Vercel and add the same environment variables listed above in your Vercel project settings.

## 👥 Team xeno2

- Subhash B
- Sathish E
- Vijayalakshmi R
- Y Sandhya Rani

## 📄 License

This project was built for OSC AI Build 1.0 Hackathon.
