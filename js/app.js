/* InsurancePro - core: storage (localStorage), simulated auth, theme, layout and helpers.
   Every page loads this file. Page scripts define `const Page = { title, render(el) }`. */
const IP = (() => {
  const K = "ip_db_v1", U = "ip_user", USERS = "ip_users";
  const DEMO = { name: "Demo Admin", email: "demo@insurancepro.com", pw: "demo123" };
  const rd = (k, f) => { try { return JSON.parse(localStorage.getItem(k)) ?? f; } catch (e) { return f; } };
  const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  let db = rd(K, null);
  if (!db) { db = SEED(); wr(K, db); }
  const save = () => wr(K, db);
  const ICONS = {
    grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    policies: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
    claims: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    customers: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    agents: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    premium: '<path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    renewals: '<path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15"/>',
    reports: '<path d="M18 20V10M12 20V4M6 20v-6"/>',
    menu: '<path d="M3 12h18M3 6h18M3 18h18"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'
  };
  const api = {
    // ---- Data access (CRUD on arrays, persisted to localStorage) ----
    all: t => db[t].slice(),
    find: (t, id) => db[t].find(x => x.id === +id),
    add(t, r) { r.id = Math.max(0, ...db[t].map(x => x.id)) + 1; db[t].push(r); save(); return r; },
    update(t, id, p) { const r = api.find(t, id); Object.assign(r, p); save(); return r; },
    remove(t, id) { db[t] = db[t].filter(x => x.id !== +id); save(); },
    reset() { db = SEED(); save(); },
    // ---- Simulated authentication ----
    user: () => rd(U, null),
    users: () => [DEMO, ...rd(USERS, [])],
    register(name, email, pw) {
      email = email.toLowerCase();
      if (api.users().some(u => u.email === email)) return "An account with this email already exists.";
      wr(USERS, [...rd(USERS, []), { name, email, pw }]); wr(U, { name, email }); return "";
    },
    login(email, pw) {
      const u = api.users().find(x => x.email === email.toLowerCase() && x.pw === pw);
      if (!u) return "Incorrect email or password.";
      wr(U, { name: u.name, email: u.email }); return "";
    },
    logout() { localStorage.removeItem(U); location.href = "auth.html"; },
    // ---- Helpers ----
    $: s => document.querySelector(s),
    ic: n => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`,
    money: n => "₹" + Number(n).toLocaleString("en-IN"),
    date: s => s ? new Date(s + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—",
    daysTo: s => Math.round((new Date(s + "T00:00:00") - new Date().setHours(0, 0, 0, 0)) / 864e5),
    badge: s => `<span class="bd s-${s.toLowerCase().replace(/\s+/g, "-")}">${s}</span>`,
    toast(m) { const t = api.$("#toast"); t.textContent = m; t.hidden = false; clearTimeout(api._t); api._t = setTimeout(() => t.hidden = true, 3200); }
  };
  return api;
})();

/* ---- Theme (light / dark), saved between visits ---- */
document.documentElement.dataset.theme = localStorage.getItem("ip_theme") || "light";

/* ---- Layout: sidebar + top bar, then hand over to the page script ---- */
const NAV = [["index.html","Dashboard","grid","dashboard"],["policies.html","Policies","policies","policies"],["claims.html","Claims","claims","claims"],["customers.html","Customers","customers","customers"],["agents.html","Agents","agents","agents"],["premium.html","Premium Calculator","premium","premium"],["renewals.html","Renewals","renewals","renewals"],["reports.html","Reports","reports","reports"]];

document.addEventListener("DOMContentLoaded", () => {
  const pg = document.body.dataset.page, u = IP.user();
  if (pg === "auth") { if (u) location.replace("index.html"); return; }
  if (!u) { location.replace("auth.html"); return; }
  const soon = IP.all("policies").filter(p => ["Active", "Renewed"].includes(p.status) && IP.daysTo(p.end_date) >= 0 && IP.daysTo(p.end_date) <= 30).length;
  const ini = u.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  IP.$("#root").innerHTML = `<div class="app"><aside class="sb" id="sb"><a class="brand" href="index.html"><img src="assets/logo.svg" alt="">InsurancePro</a>
    <nav aria-label="Main">${NAV.map(n => `<a href="${n[0]}" class="${n[3] === pg ? "on" : ""}">${IP.ic(n[2])}${n[1]}</a>`).join("")}</nav>
    <button class="lo" id="lo">${IP.ic("logout")}Log out</button></aside><div class="ov" id="ov"></div>
    <div><header class="top"><button class="ib" id="mb" aria-label="Open menu">${IP.ic("menu")}</button><h1 id="pt"></h1><span class="sp"></span>
    <a class="ib" href="renewals.html" title="Renewal reminders" aria-label="Renewal reminders">${IP.ic("bell")}${soon ? `<i class="dot">${soon}</i>` : ""}</a>
    <button class="ib" id="th" aria-label="Toggle dark mode">${IP.ic("moon")}</button><span class="av" title="${IP.esc(u.name)}">${ini}</span></header>
    <main id="view"></main></div></div><div id="toast" hidden role="status"></div>`;
  const sb = IP.$("#sb"), ov = IP.$("#ov"), tog = o => { sb.classList.toggle("open", o); ov.classList.toggle("open", o); };
  IP.$("#mb").onclick = () => tog(true); ov.onclick = () => tog(false);
  IP.$("#lo").onclick = IP.logout;
  IP.$("#th").onclick = () => {
    const t = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = t; localStorage.setItem("ip_theme", t);
    document.dispatchEvent(new Event("themechange"));
  };
  const view = IP.$("#view");
  if (typeof Page !== "undefined") { IP.$("#pt").textContent = Page.title; Page.render(view); }
  else { const n = NAV.find(x => x[3] === pg); IP.$("#pt").textContent = n[1]; view.innerHTML = `<div class="card"><h2>${n[1]}</h2><p class="m">This module is built in the next sprint.</p></div>`; }
});
