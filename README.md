# 🛡️ InsurancePro – Insurance Management System

A professional, fully responsive insurance management web app built with **HTML5, CSS3 and vanilla JavaScript**. It helps an insurance company manage policies, process claims, handle customers and agents, calculate premiums, track renewals and generate reports. No backend or database is needed: all data lives in JavaScript arrays and is saved in the browser's `localStorage`.

Built for the **Data Alcott Systems Free Web Development Internship** (Task ID: WD-INS-001, Insurance Management System).

| | |
|---|---|
| **Task / blog link** | https://www.freeinternships.in/blog/ |
| **Live website** | https://adityatiwary11.github.io/insurancepro/ |
| **GitHub repository** | https://github.com/Adityatiwary11/insurancepro |
| **YouTube demo** | _add link here_ |

**Demo login:** `demo@insurancepro.com` / `demo123` (or register a new account).

## Screenshots

| Dashboard | Policies |
|---|---|
| ![Dashboard](screenshots/dashboard.png) | ![Policies](screenshots/policies.png) |
| **Claims** | **Customers** |
| ![Claims](screenshots/claims.png) | ![Customers](screenshots/customers.png) |
| **Reports** | **Mobile view** |
| ![Reports](screenshots/reports.png) | ![Mobile](screenshots/mobile.png) |

## Features

**Core modules**

| Module | What it does |
|---|---|
| Dashboard | Statistic cards, premium chart, policies-by-type chart, recent claims, claim status bars, upcoming renewals |
| Policy Management | Create, edit, renew and delete policies. Search, filter by status and type |
| Claims Management | File claims, review, approve, reject and settle. Status timeline per claim |
| Customer Management | Add, edit and delete customers. Profile view with their policies and claims |
| Agent Management | Add, edit and delete agents. Commission and performance tracking |
| Premium Calculator | Live quote from policy type, age, coverage, term and risk factors. Create a policy from the quote |
| Policy Renewal | Tracks expired and expiring policies (30 and 90 days). Renew with payment, send reminders |
| Reports | Policy, claims, revenue and payment reports with date filter, CSV export and PDF export |
| Login / Register | Simulated authentication with protected pages |

**Bonus features:** claim status tracking, premium payment simulation, policy renewal reminders, agent commission calculation, export reports (PDF and CSV), customer notifications, dark mode toggle.

**Policy types:** Life, Health, Auto, Home, Travel.
**Policy statuses:** Active, Pending, Expired, Renewed, Cancelled.
**Claim statuses:** Filed, Under Review, Approved, Settled, Rejected.

## Tech stack

- **HTML5** (semantic structure, one page per module)
- **CSS3** (custom properties, Grid, Flexbox, media queries, dark theme)
- **JavaScript ES6** (no framework)
- **Chart.js** (dashboard charts) and **jsPDF + jsPDF-AutoTable** (PDF export), loaded from CDN
- **localStorage** for persistence
- **Git and GitHub Pages** for version control and hosting

## Design

| Token | Value |
|---|---|
| Primary blue | `#1A56DB` |
| White | `#FFFFFF` |
| Light blue | `#DBEAFE` |
| Font | Inter |
| Layout | Sidebar with icons, top navigation bar, hamburger menu on mobile |

## Project structure

```
insurancepro/
├── index.html          # Dashboard
├── auth.html           # Login / Register
├── policies.html       # Policy management
├── claims.html         # Claims management
├── customers.html      # Customer management
├── agents.html         # Agent management
├── premium.html        # Premium calculator
├── renewals.html       # Renewal tracking
├── reports.html        # Reports and exports
├── assets/
│   ├── logo.svg
│   └── hero.svg
├── css/
│   └── style.css       # Design tokens, layout, components, responsive rules
├── js/
│   ├── data.js         # Seed data: policies, claims, customers, agents
│   ├── app.js          # Storage (CRUD), auth, theme, sidebar and top bar
│   ├── ui.js           # Modal, form builder, confirm, payment simulation, logs
│   ├── auth.js         # Login / register page
│   ├── dashboard.js    # One script per module below
│   ├── policies.js
│   ├── claims.js
│   ├── customers.js
│   ├── agents.js
│   ├── premium.js
│   ├── renewals.js
│   └── reports.js
└── README.md
```

## Data model

| Collection | Fields |
|---|---|
| policies | id, policy_number, type, customer_id, agent_id, coverage_amount, premium, start_date, end_date, status |
| claims | id, policy_id, claim_number, amount, description, status, date_filed, date_settled |
| customers | id, name, email, phone, address, dob, policies_count |
| agents | id, name, email, phone, commission_rate, policies_sold |
| user | Simulated login stored in `localStorage` |

## How it works

1. Every page loads `data.js` (seed data) and `app.js`. On first visit the seed data is copied into `localStorage`.
2. `app.js` checks the simulated login, then draws the sidebar and top bar into `<div id="root">`.
3. Each page script defines a `Page` object with `title` and `render()`. `app.js` calls it to fill the main area.
4. All create, update and delete operations go through the `IP` helper (`IP.add`, `IP.update`, `IP.remove`) so data is saved automatically.
5. Linked counts (policies per customer, policies sold per agent) are recalculated after every policy change.

## Business rules

- **Premium** = coverage / 1000 × base rate × age factor × risk factors, minus a 5% (2 years) or 8% (3 years) term discount, plus 18% GST.
- **Agent commission** = premium of Active, Renewed and Expired policies × the agent's commission rate.
- A claim cannot exceed the policy's coverage, and only Active or Renewed policies can receive claims.
- A policy with claims, a customer with policies, and an agent with policies cannot be deleted.

## Run locally

```bash
git clone https://github.com/Adityatiwary11/insurancepro.git
cd insurancepro
```

Open `auth.html` in a browser, or right-click it in VS Code and choose **Open with Live Server**. No build step is needed. An internet connection is needed for the fonts, charts and PDF export libraries.

## Deploy on GitHub Pages

1. Push the project to a public GitHub repository.
2. Go to **Settings → Pages**.
3. Set **Source** to **Deploy from a branch**, choose `main` and `/ (root)`, then **Save**.
4. The site goes live at `https://adityatiwary11.github.io/insurancepro/`.

## Notes

- Login, payments and notifications are **simulations**. Nothing leaves your browser.
- Use **Reports → Reset demo data** to restore the original sample data.
- Seed dates are relative to today, so renewals and charts always look current.

## Author

Aditya Tiwary, Data Alcott Systems Web Development Internship (Student ID DAS012839).
