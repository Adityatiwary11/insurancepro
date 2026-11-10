/* Policy Management: list, search, filter, create, edit, renew, delete */
const $ = IP.$;
const addYear = s => { const d = new Date(s + "T00:00:00"); d.setFullYear(d.getFullYear() + 1); return d.toLocaleDateString("en-CA"); };

const Page = {
  title: "Policies", q: "", st: "", ty: "",
  cn(id) { const c = IP.find("customers", id); return c ? c.name : "Unknown"; },
  render(el) {
    const sel = (id, list, label) => `<select id="${id}" aria-label="${label}"><option value="">${label}</option>${list.map(x => `<option ${this[id] === x ? "selected" : ""}>${x}</option>`).join("")}</select>`;
    el.innerHTML = `<div class="card"><div class="tb"><input id="q" type="search" placeholder="Search policy number or customer" value="${IP.esc(this.q)}" aria-label="Search policies">
      ${sel("st", STATUSES, "All statuses")}${sel("ty", TYPES, "All types")}<button class="btn" id="new">+ New policy</button></div>
      <div class="tw" id="tbl"></div><p class="m" id="cnt"></p></div>`;
    $("#q").oninput = e => { this.q = e.target.value.toLowerCase(); this.rows(); };
    $("#st").onchange = e => { this.st = e.target.value; this.rows(); };
    $("#ty").onchange = e => { this.ty = e.target.value; this.rows(); };
    $("#new").onclick = () => this.edit();
    $("#tbl").onclick = e => { const b = e.target.closest("[data-a]"); if (b) this[b.dataset.a](+b.dataset.id); };
    this.rows();
  },
  rows() {
    const { all, money, date, badge, esc } = IP;
    const L = all("policies").filter(p => (!this.st || p.status === this.st) && (!this.ty || p.type === this.ty) && (p.policy_number + " " + this.cn(p.customer_id)).toLowerCase().includes(this.q)).sort((a, b) => b.id - a.id);
    $("#tbl").innerHTML = L.length ? `<table><thead><tr><th>Policy no.</th><th>Customer</th><th>Type</th><th>Coverage</th><th>Premium</th><th>Term</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      ${L.map(p => `<tr><td><b>${p.policy_number}</b></td><td>${esc(this.cn(p.customer_id))}</td><td>${p.type}</td><td>${money(p.coverage_amount)}</td><td>${money(p.premium)}</td><td>${date(p.start_date)} to ${date(p.end_date)}</td><td>${badge(p.status)}</td>
      <td><div class="act">${p.status === "Pending" ? `<button class="btn s" data-a="pay" data-id="${p.id}">Pay</button>` : ""}<button class="btn o s" data-a="edit" data-id="${p.id}">Edit</button><button class="btn o s" data-a="renew" data-id="${p.id}">Renew</button><button class="btn s r" data-a="del" data-id="${p.id}">Delete</button></div></td></tr>`).join("")}</tbody></table>` : `<p class="m">No policies match your search.</p>`;
    $("#cnt").textContent = `${L.length} of ${all("policies").length} policies`;
  },
  edit(id) {
    const p = id ? IP.find("policies", id) : { status: "Active", start_date: day(0), end_date: day(365) };
    const fields = [
      { k: "customer_id", l: "Customer", t: "select", o: IP.all("customers").map(c => [c.id, c.name]) },
      { k: "agent_id", l: "Agent", t: "select", o: IP.all("agents").map(a => [a.id, a.name]) },
      { k: "type", l: "Policy type", t: "select", o: TYPES.map(t => [t, t]) },
      { k: "status", l: "Status", t: "select", o: STATUSES.map(s => [s, s]) },
      { k: "coverage_amount", l: "Coverage amount (₹)", t: "number", min: 10000 },
      { k: "premium", l: "Annual premium (₹)", t: "number", min: 100 },
      { k: "start_date", l: "Start date", t: "date" }, { k: "end_date", l: "End date", t: "date" }];
    IP.form(id ? "Edit policy" : "New policy", fields, p, v => {
      ["customer_id", "agent_id", "coverage_amount", "premium"].forEach(k => v[k] = +v[k]);
      if (v.end_date <= v.start_date) return "End date must be after the start date.";
      if (id) IP.update("policies", id, v);
      else { const r = IP.add("policies", { ...v, policy_number: "" }); IP.update("policies", r.id, { policy_number: `POL-${new Date().getFullYear()}-${String(r.id).padStart(4, "0")}` }); }
      IP.sync(); IP.toast(id ? "Policy updated" : "Policy created"); this.rows(); return "";
    });
  },
  pay(id) {
    const p = IP.find("policies", id);
    IP.pay({ title: "Pay premium", ref: `${p.policy_number}, ${this.cn(p.customer_id)}`, amount: p.premium }, () => { IP.update("policies", id, { status: "Active" }); this.rows(); });
  },
  renew(id) {
    const p = IP.find("policies", id);
    if (p.status === "Cancelled") return IP.toast("Cancelled policies can’t be renewed");
    const start = p.status === "Expired" ? day(0) : p.end_date, end = addYear(start);
    IP.confirm(`Renew <b>${p.policy_number}</b> for one more year?<br>New term: ${IP.date(start)} to ${IP.date(end)}.`, () => {
      IP.update("policies", id, { start_date: start, end_date: end, status: "Renewed" }); IP.toast("Policy renewed"); this.rows();
    }, "Renew");
  },
  del(id) {
    const p = IP.find("policies", id), n = IP.all("claims").filter(c => c.policy_id === p.id).length;
    if (n) return IP.toast(`Can’t delete: ${n} claim(s) are linked. Set the status to Cancelled instead.`);
    IP.confirm(`Delete policy <b>${p.policy_number}</b>? This cannot be undone.`, () => { IP.remove("policies", id); IP.sync(); IP.toast("Policy deleted"); this.rows(); }, "Delete");
  }
};
