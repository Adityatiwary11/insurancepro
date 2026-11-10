/* Reports: policy, claims, revenue and payment reports with date filter, CSV export and PDF export */
const $ = IP.$;
const NUM = new Set(["Coverage", "Premium", "Amount", "Claims paid", "Avg. premium"]), DATE = new Set(["Start", "End", "Filed", "Settled", "Date"]);
const TABS = { policies: "Policy report", claims: "Claims report", revenue: "Revenue report", payments: "Payments" };

const Page = {
  title: "Reports", tab: "policies", from: "", to: "",
  build() {
    const { all, find, logs } = IP, f = d => (!this.from || d >= this.from) && (!this.to || d <= this.to);
    const cust = pid => { const p = find("policies", pid); return (p && (find("customers", p.customer_id) || {}).name) || "Unknown"; };
    const P = all("policies").filter(p => f(p.start_date));
    if (this.tab === "policies") return { cols: ["Policy no.", "Customer", "Type", "Agent", "Coverage", "Premium", "Start", "End", "Status"], rows: P.map(p => [p.policy_number, cust(p.id), p.type, (find("agents", p.agent_id) || {}).name || "—", p.coverage_amount, p.premium, p.start_date, p.end_date, p.status]) };
    if (this.tab === "claims") return { cols: ["Claim no.", "Customer", "Policy", "Type", "Amount", "Filed", "Settled", "Status"], rows: all("claims").filter(c => f(c.date_filed)).map(c => { const p = find("policies", c.policy_id) || {}; return [c.claim_number, cust(c.policy_id), p.policy_number || "—", p.type || "—", c.amount, c.date_filed, c.date_settled, c.status]; }) };
    if (this.tab === "revenue") return { cols: ["Policy type", "Policies", "Premium", "Claims paid", "Loss ratio", "Avg. premium"], rows: TYPES.map(t => {
      const pp = P.filter(p => p.type === t && p.status !== "Cancelled"), prem = pp.reduce((s, p) => s + p.premium, 0);
      const paid = all("claims").filter(c => c.status === "Settled" && f(c.date_filed) && (find("policies", c.policy_id) || {}).type === t).reduce((s, c) => s + c.amount, 0);
      return [t, pp.length, prem, paid, prem ? (paid / prem * 100).toFixed(1) + "%" : "—", pp.length ? Math.round(prem / pp.length) : 0];
    }) };
    return { cols: ["Reference", "Policy", "Method", "Amount", "Date"], rows: logs("payments").filter(x => f(x.at.slice(0, 10))).map(x => [x.ref, x.policy, x.method, x.amount, x.at.slice(0, 10)]) };
  },
  render(el) {
    el.innerHTML = `<div class="card"><div class="tb noprint">${Object.entries(TABS).map(([k, l]) => `<button class="btn o s ${this.tab === k ? "on" : ""}" data-t="${k}">${l}</button>`).join("")}</div>
      <div class="tb noprint"><label style="margin:0;align-self:center">From</label><input id="from" type="date" value="${this.from}" style="width:auto"><label style="margin:0;align-self:center">To</label><input id="to" type="date" value="${this.to}" style="width:auto">
      <span class="sp"></span><button class="btn o" id="csv">Export CSV</button><button class="btn" id="pdf">Export PDF</button></div><div id="sum" class="g stats"></div><div class="tw" id="tbl"></div></div>
      <p class="noprint" style="margin-top:14px"><button class="btn o s r" id="reset" style="background:none;color:#C81E1E;border-color:#C81E1E">Reset demo data</button></p>`;
    el.querySelectorAll("[data-t]").forEach(b => b.onclick = () => { this.tab = b.dataset.t; this.render(el); });
    $("#from").onchange = e => { this.from = e.target.value; this.show(); }; $("#to").onchange = e => { this.to = e.target.value; this.show(); };
    $("#csv").onclick = () => this.csv(); $("#pdf").onclick = () => this.pdf();
    $("#reset").onclick = () => IP.confirm("Reset all policies, claims, customers, agents, payments and notifications to the demo data?", () => { IP.reset(); localStorage.removeItem("ip_payments"); localStorage.removeItem("ip_notes"); IP.toast("Demo data restored"); this.render(el); }, "Reset");
    this.show();
  },
  show() {
    const d = this.build(), { money, date, badge, esc } = IP;
    const cards = [["Records", d.rows.length], ...d.cols.map((c, i) => [c, i]).filter(([c]) => NUM.has(c) && c !== "Avg. premium").map(([c, i]) => ["Total " + c.toLowerCase(), money(d.rows.reduce((s, r) => s + r[i], 0))])];
    $("#sum").innerHTML = cards.map(([l, v]) => `<div class="card stat"><div><small>${l}</small><b>${v}</b></div></div>`).join("");
    const cell = (h, v) => NUM.has(h) ? money(v) : DATE.has(h) ? date(v) : h === "Status" ? badge(v) : esc(v);
    $("#tbl").innerHTML = d.rows.length ? `<table><thead><tr>${d.cols.map(c => `<th>${c}</th>`).join("")}</tr></thead><tbody>${d.rows.map(r => `<tr>${r.map((v, i) => `<td>${cell(d.cols[i], v)}</td>`).join("")}</tr>`).join("")}</tbody></table>` : `<p class="m">No records in this date range.</p>`;
  },
  csv() {
    const d = this.build(), q = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
    IP.download(`insurancepro-${this.tab}-report.csv`, "\ufeff" + [d.cols, ...d.rows].map(r => r.map(q).join(",")).join("\n"));
    IP.toast("CSV downloaded");
  },
  pdf() {
    const d = this.build();
    if (!window.jspdf) { IP.toast("PDF library not loaded, opening print dialog"); return window.print(); }
    const doc = new window.jspdf.jsPDF({ orientation: d.cols.length > 6 ? "landscape" : "portrait" });
    doc.setFontSize(16); doc.text("InsurancePro - " + TABS[this.tab], 14, 16);
    doc.setFontSize(9); doc.text("Generated " + new Date().toLocaleString("en-IN") + (this.from || this.to ? `   Range: ${this.from || "start"} to ${this.to || "today"}` : ""), 14, 22);
    doc.autoTable({ head: [d.cols], body: d.rows.map(r => r.map((v, i) => NUM.has(d.cols[i]) ? "Rs. " + Number(v).toLocaleString("en-IN") : DATE.has(d.cols[i]) ? IP.date(v) : String(v))), startY: 27, headStyles: { fillColor: [26, 86, 219] }, styles: { fontSize: 8 } });
    doc.save(`insurancepro-${this.tab}-report.pdf`); IP.toast("PDF downloaded");
  }
};
