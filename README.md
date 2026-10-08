<div align="center">

# Ruhban Abdullah — Backend Engineer 🚀

[![Website](https://img.shields.io/website?label=Live%20Portfolio&style=for-the-badge&url=https%3A%2F%2Fdeveloperruhban.online)](https://developerruhban.online)
[![GitHub followers](https://img.shields.io/github/followers/shahruhban01?logo=github&style=for-the-badge)](https://github.com/shahruhban01)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-1000%2B%20Followers-blue?style=for-the-badge&logo=linkedin)](https://linkedin.com/in/shahruhban)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://developerruhban.online)

<p align="center">
  <img src="https://skillicons.dev/icons?i=nodejs,express,mongodb,mysql,aws,react,vite,tailwind,git" alt="Tech Stack Icons" />
</p>

<h3>Backend Engineer · Node.js Developer · India</h3>

[🌐 View Live](https://developerruhban.online) · [🐛 Report Bug](https://github.com/shahruhban01) · [✨ Request Feature](https://github.com/shahruhban01)

<br/>

<img src="https://developerruhban.online/og-image.png" alt="Ruhban Abdullah Portfolio Preview" width="80%" style="border-radius: 12px;" />

</div>

---

## 🌟 Overview

A modern, fully responsive backend-focused portfolio built with **React 18 + Vite 5** and **Tailwind CSS**, featuring smooth animations, real-time GitHub integration, advanced SEO optimization, and performance-focused architecture.

Designed to showcase backend engineering expertise including scalable APIs, real-time systems, distributed architectures, and cloud infrastructure.

---

## ✨ Features

<div align="center">

| Feature | Description |
|---------|-------------|
| 🎨 Modern UI | Clean dark interface with smooth animations and 3D background |
| 📱 Fully Responsive | Optimized for mobile, tablet, and desktop |
| ⚡ Vite Powered | Fast builds and lightning-fast HMR |
| 🎭 Framer Motion | Smooth page transitions and scroll animations |
| 🐙 GitHub Live Data | Real-time GitHub stats via SWR + GitHub API |
| 🤖 SEO Optimized | Dynamic SEO tags, OG tags, sitemap, JSON-LD |
| 📲 PWA Ready | Installable portfolio with manifest support |
| ☁️ Cloud Ready | Optimized deployment for Vercel and cloud platforms |

</div>

---

## 🚀 Tech Stack

<div align="center">

| Category | Technologies |
|----------|-------------|
| **Frontend** | React 18, Vite 5, Tailwind CSS, Framer Motion |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB, MySQL |
| **Real-Time** | WebSockets |
| **Cloud & DevOps** | AWS, Vercel, Render, CI/CD |
| **Data Fetching** | SWR |
| **Routing** | React Router DOM |
| **Tools** | Git, GitHub, Postman, VS Code |

</div>

---

## 📁 Project Structure

```bash
├── public/
│   ├── favicon.ico
│   ├── og-image.png
│   ├── manifest.json
│   ├── robots.txt
│   └── sitemap.xml
│
└── src/
    ├── assets/
    ├── components/
    │   ├── Background3D.jsx
    │   ├── Footer.jsx
    │   ├── Navbar.jsx
    │   ├── Loading.jsx
    │   ├── ScrollAnimation.jsx
    │   └── TechLogos.jsx
    │
    ├── config/
    │   └── contact.js
    │
    ├── pages/
    │   ├── Home.jsx
    │   ├── About.jsx
    │   ├── Projects.jsx
    │   ├── Skills.jsx
    │   ├── Experience.jsx
    │   ├── Education.jsx
    │   ├── Certificates.jsx
    │   ├── Contact.jsx
    │   └── NotFound.jsx
    │
    ├── App.jsx
    ├── main.jsx
    └── index.css

---

## 🛠️ Quick Start

```bash
# Clone the repository
git clone https://github.com/shahruhban01/portfolio

# Navigate to project directory
cd portfolio

# Install dependencies
npm install

# Start development server
npm run dev

# Build production version
npm run build

# Preview production build
npm run preview
```

## 📤 Upload API

The `/upload` page sends text and an optional file together to the standalone
Express API in [`server/`](./server). Text is stored in MongoDB and files are
uploaded to Cloudflare R2.

```bash
# Frontend (from the repository root)
npm install
npm run dev

# API (in a second terminal)
cd server
npm install
copy .env.example .env
# Fill in MongoDB and Cloudflare R2 values in server/.env
# Set a long random value for ADMIN_TOKEN
npm run dev
```

Set `VITE_API_URL` in the frontend environment when the API is not running at
`http://localhost:4000`. The API exposes `POST /api/uploads` as a multipart
form endpoint with `text` and `file` fields, plus `GET /health`.
`CLIENT_ORIGIN` accepts a comma-separated list, which is useful when Vite
switches between ports such as `5173` and `5174`.

Required R2 values are `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`,
`R2_SECRET_ACCESS_KEY`, and `R2_BUCKET_NAME`. `R2_PUBLIC_BASE_URL` is optional
and is used only to return a public URL for uploaded files.

Open `/admin` in the frontend and enter the value of `ADMIN_TOKEN` to view
stored uploads. The admin list endpoint is protected with a bearer token, and
private R2 files are returned as signed URLs that expire after 15 minutes.
Each upload also has a delete action. Deleting an upload removes its MongoDB
record and its corresponding R2 object.

If MongoDB reports `querySrv ECONNREFUSED`, the machine running the API cannot
currently resolve MongoDB Atlas's SRV DNS record. Check VPN/firewall/DNS
settings, allow your IP in Atlas Network Access, or copy Atlas's non-SRV
connection string from **Connect → Drivers** and use that as `MONGODB_URI`.

---

## 🎯 Portfolio Sections

<div align="center">

| Section         | Description                                 |
| --------------- | ------------------------------------------- |
| 🏠 Home         | Introduction, GitHub stats, social links    |
| 👨‍💻 About     | Background, achievements, interests         |
| 📂 Projects     | Backend projects and scalable systems       |
| 💼 Experience   | Professional backend engineering experience |
| 🎓 Education    | Academic background                         |
| 🛠️ Skills      | Technical stack and engineering skills      |
| 🏆 Certificates | Certifications and achievements             |
| 📞 Contact      | Contact and social links                    |

</div>

---

## 🔍 SEO Optimization

This portfolio includes complete SEO optimization:

* ✅ Dynamic per-page meta tags
* ✅ Open Graph + Twitter Cards
* ✅ JSON-LD structured data
* ✅ XML sitemap
* ✅ robots.txt
* ✅ Canonical URLs
* ✅ PWA manifest
* ✅ Social preview image support
* ✅ Full favicon support

---

## 📞 Connect with Me

<div align="center">

[![Email](https://img.shields.io/badge/Email-shahruhban01%40gmail.com-red?style=for-the-badge\&logo=gmail)](mailto:shahruhban01@gmail.com)

[![LinkedIn](https://img.shields.io/badge/LinkedIn-shahruhban-blue?style=for-the-badge\&logo=linkedin)](https://linkedin.com/in/shahruhban)

[![GitHub](https://img.shields.io/badge/GitHub-shahruhban01-black?style=for-the-badge\&logo=github)](https://github.com/shahruhban01)

</div>

---

## 📄 License

<div align="center">

Licensed under the **MIT License**.

<h3>⭐ Star this repository if you found it useful!</h3>

</div>