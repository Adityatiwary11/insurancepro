/* Claims Management: file, review, approve / reject, settle, and track status */
const $ = IP.$;
const FLOW = ["Filed", "Under Review", "Approved", "Settled"];

const Page = {
  title: "Claims", q: "", st: "",
  info(c) {
    const p = IP.find("policies", c.policy_id), cu = p && IP.find("customers", p.customer_id);
    return { p, name: cu ? cu.name : "Unknown", num: p ? p.policy_number : "Deleted policy" };
  },
  render(el) {
    el.innerHTML = `<div class="g stats" id="top"></div><div class="card"><div class="tb"><input id="q" type="search" placeholder="Search claim number, policy or customer" value="${IP.esc(this.q)}" aria-label="Search claims">
      <select id="st" aria-label="Filter by status"><option value="">All statuses</option>${CLAIM_STATUSES.map(s => `<option ${this.st === s ? "selected" : ""}>${s}</option>`).join("")}</select>
      <button class="btn" id="new">+ File claim</button></div><div class="tw" id="tbl"></div><p class="m" id="cnt"></p></div>`;
    $("#q").oninput = e => { this.q = e.target.value.toLowerCase(); this.rows(); };
    $("#st").onchange = e => { this.st = e.target.value; this.rows(); };
    $("#new").onclick = () => this.file();
    $("#tbl").onclick = e => { const b = e.target.closest("[data-a]"); if (b) this[b.dataset.a](+b.dataset.id, b.dataset.to); };
    this.rows();
  },
  rows() {
    const { all, money, date, badge, esc, ic } = IP, C = all("claims");
    const sum = f => C.filter(f).reduce((s, c) => s + c.amount, 0), stat = (i, l, v, s) => `<div class="card stat"><span class="si">${ic(i)}</span><div><small>${l}</small><b>${v}</b><small>${s}</small></div></div>`;
    $("#top").innerHTML = stat("claims", "Total claimed", money(sum(() => 1)), C.length + " claims") + stat("premium", "Settled", money(sum(c => c.status === "Settled")), C.filter(c => c.status === "Settled").length + " claims paid")
      + stat("renewals", "In progress", money(sum(c => ["Filed", "Under Review", "Approved"].includes(c.status))), C.filter(c => ["Filed", "Under Review", "Approved"].includes(c.status)).length + " open") + stat("reports", "Rejected", C.filter(c => c.status === "Rejected").length, money(sum(c => c.status === "Rejected")));
    const L = C.filter(c => (!this.st || c.status === this.st) && (c.claim_number + " " + this.info(c).num + " " + this.info(c).name).toLowerCase().includes(this.q)).sort((a, b) => b.id - a.id);
    const btn = (id, a, label, to, cls = "o") => `<button class="btn ${cls} s" data-a="${a}" data-id="${id}" ${to ? `data-to="${to}"` : ""}>${label}</button>`;
    const acts = c => btn(c.id, "track", "Track") + ({
      "Filed": btn(c.id, "move", "Review", "Under Review") + btn(c.id, "edit", "Edit") + btn(c.id, "del", "Delete", "", "r"),
      "Under Review": btn(c.id, "move", "Approve", "Approved") + btn(c.id, "move", "Reject", "Rejected", "r"),
      "Approved": btn(c.id, "move", "Settle", "Settled")
    }[c.status] || "");
    $("#tbl").innerHTML = L.length ? `<table><thead><tr><th>Claim no.</th><th>Customer</th><th>Policy</th><th>Amount</th><th>Description</th><th>Filed</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      ${L.map(c => { const i = this.info(c); return `<tr><td><b>${c.claim_number}</b></td><td>${esc(i.name)}</td><td>${i.num}</td><td>${money(c.amount)}</td><td style="white-space:normal;min-width:200px">${esc(c.description)}</td><td>${date(c.date_filed)}</td><td>${badge(c.status)}</td><td><div class="act">${acts(c)}</div></td></tr>`; }).join("")}</tbody></table>` : `<p class="m">No claims match your search.</p>`;
    $("#cnt").textContent = `${L.length} of ${C.length} claims`;
  },
  file() {
    const eligible = IP.all("policies").filter(p => p.status === "Active" || p.status === "Renewed");
    if (!eligible.length) return IP.toast("No active policies to claim against");
    const fields = [{ k: "policy_id", l: "Policy", t: "select", w: 1, o: eligible.map(p => [p.id, `${p.policy_number}: ${(IP.find("customers", p.customer_id) || {}).name}, ${p.type}`]) },
      { k: "amount", l: "Claim amount (₹)", t: "number", min: 1 }, { k: "date_filed", l: "Date filed", t: "date" }, { k: "description", l: "What happened?", t: "textarea", w: 1 }];
    IP.form("File a new claim", fields, { date_filed: day(0) }, v => {
      const p = IP.find("policies", v.policy_id);
      if (+v.amount > p.coverage_amount) return `Amount is above the policy coverage of ${IP.money(p.coverage_amount)}.`;
      if (v.date_filed > day(0)) return "Date filed cannot be in the future.";
      const r = IP.add("claims", { policy_id: p.id, claim_number: "", amount: +v.amount, description: v.description.trim(), status: "Filed", date_filed: v.date_filed, date_settled: "" });
      IP.update("claims", r.id, { claim_number: `CLM-${new Date().getFullYear()}-${String(r.id).padStart(3, "0")}` });
      IP.toast("Claim filed"); this.rows(); return "";
    });
  },
  edit(id) {
    const c = IP.find("claims", id), p = IP.find("policies", c.policy_id);
    IP.form("Edit claim " + c.claim_number, [{ k: "amount", l: "Claim amount (₹)", t: "number", min: 1, w: 1 }, { k: "description", l: "Description", t: "textarea", w: 1 }], c, v => {
      if (p && +v.amount > p.coverage_amount) return `Amount is above the policy coverage of ${IP.money(p.coverage_amount)}.`;
      IP.update("claims", id, { amount: +v.amount, description: v.description.trim() }); IP.toast("Claim updated"); this.rows(); return "";
    });
  },
  move(id, to) {
    const c = IP.find("claims", id), go = () => { IP.update("claims", id, { status: to, date_settled: to === "Settled" ? day(0) : c.date_settled }); IP.toast(`${c.claim_number} is now ${to}`); this.rows(); };
    if (to === "Rejected" || to === "Settled") IP.confirm(`${to === "Settled" ? "Settle" : "Reject"} claim <b>${c.claim_number}</b> for ${IP.money(c.amount)}?`, go, to === "Settled" ? "Settle" : "Reject"); else go();
  },
  del(id) {
    const c = IP.find("claims", id);
    IP.confirm(`Delete claim <b>${c.claim_number}</b>? This cannot be undone.`, () => { IP.remove("claims", id); IP.toast("Claim deleted"); this.rows(); }, "Delete");
  },
  track(id) {
    const c = IP.find("claims", id), i = this.info(c), steps = c.status === "Rejected" ? ["Filed", "Under Review", "Rejected"] : FLOW, at = steps.indexOf(c.status);
    const note = s => s === "Filed" ? IP.date(c.date_filed) : s === "Settled" && c.date_settled ? IP.date(c.date_settled) : "";
    const d = IP.modal(`<div class="mb"><div class="mh"><h2>${c.claim_number}</h2><button class="ib" data-x aria-label="Close">✕</button></div>
      <p class="m">${IP.esc(i.name)}, ${i.num}<br>${IP.money(c.amount)}: ${IP.esc(c.description)}</p>
      <ol class="tl">${steps.map((s, n) => `<li class="${n <= at ? "done" : ""} ${n === at ? "cur" : ""} ${s === "Rejected" ? "rej" : ""}">${s} <span class="m">${note(s)}</span></li>`).join("")}</ol></div>`);
    d.querySelector("[data-x]").onclick = () => d.close();
  }
};
