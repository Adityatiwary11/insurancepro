/* Dashboard: statistics, charts, claims overview, recent claims, upcoming renewals */
const Page = {
  title: "Dashboard", charts: [],
  render(el) {
    const { ic, money, date, daysTo, badge, all, find } = IP;
    const P = all("policies"), C = all("claims");
    const live = P.filter(p => p.status === "Active" || p.status === "Renewed");
    const due = live.filter(p => { const d = daysTo(p.end_date); return d >= 0 && d <= 30; }).sort((a, b) => a.end_date.localeCompare(b.end_date));
    const open = C.filter(c => c.status === "Filed" || c.status === "Under Review").length;
    const revenue = live.reduce((s, p) => s + p.premium, 0);
    const who = pid => { const p = find("policies", pid), c = p && find("customers", p.customer_id); return c ? c.name : "—"; };
    const stat = (i, l, v, s) => `<div class="card stat"><span class="si">${ic(i)}</span><div><small>${l}</small><b>${v}</b><small>${s}</small></div></div>`;
    const recent = C.slice().sort((a, b) => b.date_filed.localeCompare(a.date_filed)).slice(0, 5);
    el.innerHTML = `<div class="g stats">
      ${stat("policies", "Total policies", P.length, live.length + " active")}
      ${stat("premium", "Premium revenue", money(revenue), "from active policies")}
      ${stat("claims", "Open claims", open, C.length + " claims in total")}
      ${stat("customers", "Customers", all("customers").length, all("agents").length + " agents")}
      ${stat("renewals", "Renewals due", due.length, "within 30 days")}</div>
    <div class="g two"><div class="card"><h2>Premium collected, last 6 months</h2><div class="ch"><canvas id="c1"></canvas></div></div>
      <div class="card"><h2>Policies by type</h2><div class="ch"><canvas id="c2"></canvas></div></div></div>
    <div class="g two"><div class="card"><h2>Recent claims</h2><div class="tw"><table><thead><tr><th>Claim</th><th>Customer</th><th>Amount</th><th>Filed</th><th>Status</th></tr></thead><tbody>
      ${recent.map(c => `<tr><td>${c.claim_number}</td><td>${IP.esc(who(c.policy_id))}</td><td>${money(c.amount)}</td><td>${date(c.date_filed)}</td><td>${badge(c.status)}</td></tr>`).join("")}</tbody></table></div></div>
      <div class="card"><h2>Claims status</h2>${CLAIM_STATUSES.map(s => { const n = C.filter(c => c.status === s).length; return `<div class="li" style="display:block"><div style="display:flex;justify-content:space-between">${badge(s)}<b>${n}</b></div><div class="bar"><i style="width:${C.length ? n / C.length * 100 : 0}%"></i></div></div>`; }).join("")}</div></div>
    <div class="card"><h2>Upcoming renewals</h2>${due.length ? due.slice(0, 5).map(p => { const d = daysTo(p.end_date); return `<div class="li"><span><b>${p.policy_number}</b> <span class="m">${IP.esc(who(p.id))}, ${p.type}</span></span><span>${date(p.end_date)} <span class="bd ${d <= 15 ? "s-pending" : "s-renewed"}">${d} days left</span></span></div>`; }).join("") : `<p class="m">No policies expire in the next 30 days.</p>`}</div>`;
    this.draw(P);
  },
  draw(P) {
    this.charts.forEach(c => c.destroy()); this.charts = [];
    if (typeof Chart === "undefined") return;
    const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    Chart.defaults.color = css("--mut"); Chart.defaults.font.family = "Inter, sans-serif";
    const ms = [...Array(6)].map((_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 5 + i); return d; });
    const sum = k => P.filter(p => p.status !== "Cancelled" && p.start_date.startsWith(k)).reduce((s, p) => s + p.premium, 0);
    const base = { maintainAspectRatio: false };
    this.charts.push(new Chart(document.getElementById("c1"), { type: "bar", data: { labels: ms.map(d => d.toLocaleDateString("en-IN", { month: "short" })), datasets: [{ label: "Premium (₹)", data: ms.map(d => sum(d.toLocaleDateString("en-CA").slice(0, 7))), backgroundColor: "#1A56DB", borderRadius: 6 }] }, options: { ...base, plugins: { legend: { display: false } }, scales: { y: { grid: { color: css("--ln") } }, x: { grid: { display: false } } } } }));
    this.charts.push(new Chart(document.getElementById("c2"), { type: "doughnut", data: { labels: TYPES.map(t => t.replace(" Insurance", "")), datasets: [{ data: TYPES.map(t => P.filter(p => p.type === t).length), backgroundColor: ["#1A56DB", "#60A5FA", "#0E9F6E", "#F59E0B", "#8B5CF6"], borderColor: css("--card") }] }, options: { ...base, plugins: { legend: { position: "bottom" } } } }));
  }
};
document.addEventListener("themechange", () => Page.render(document.getElementById("view")));
