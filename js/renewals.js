/* Policy Renewal tracking: expired and expiring policies, renew with simulated payment, customer reminders */
const $ = IP.$;
const addYear = s => { const d = new Date(s + "T00:00:00"); d.setFullYear(d.getFullYear() + 1); return d.toLocaleDateString("en-CA"); };

const Page = {
  title: "Renewals", f: "all",
  list() {
    return IP.all("policies").filter(p => ["Active", "Renewed", "Expired"].includes(p.status) && IP.daysTo(p.end_date) <= 90)
      .map(p => ({ p, d: IP.daysTo(p.end_date), c: IP.find("customers", p.customer_id) || { name: "Unknown", email: "" } })).sort((a, b) => a.d - b.d);
  },
  match: (x, f) => f === "all" || (f === "expired" ? x.d < 0 : f === "30" ? x.d >= 0 && x.d <= 30 : x.d > 30),
  render(el) {
    const L = this.list(), tab = (k, l) => `<button class="btn o sm s ${this.f === k ? "on" : ""}" data-f="${k}">${l} (${L.filter(x => this.match(x, k)).length})</button>`;
    el.innerHTML = `<div class="g two"><div class="card"><div class="tb">${tab("all", "All")}${tab("expired", "Expired")}${tab("30", "Next 30 days")}${tab("90", "31–90 days")}<span class="sp"></span><button class="btn" id="all">Send reminders (next 30 days)</button></div>
      <div class="tw" id="tbl"></div></div><div class="card"><h2>Customer notifications</h2><div id="notes"></div></div></div>`;
    el.querySelectorAll("[data-f]").forEach(b => b.onclick = () => { this.f = b.dataset.f; this.render(el); });
    $("#all").onclick = () => this.remind(L.filter(x => x.d >= 0 && x.d <= 30));
    $("#tbl").onclick = e => { const b = e.target.closest("[data-a]"); if (b) this[b.dataset.a](+b.dataset.id); };
    const R = L.filter(x => this.match(x, this.f));
    $("#tbl").innerHTML = R.length ? `<table><thead><tr><th>Policy</th><th>Customer</th><th>Premium</th><th>Expiry</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      ${R.map(({ p, d, c }) => `<tr><td><b>${p.policy_number}</b><br><small class="m">${p.type}</small></td><td>${IP.esc(c.name)}</td><td>${IP.money(p.premium)}</td><td>${IP.date(p.end_date)}</td>
      <td><span class="bd ${d < 0 ? "s-expired" : d <= 15 ? "s-pending" : d <= 30 ? "s-renewed" : "s-active"}">${d < 0 ? "Expired " + -d + " d ago" : d + " days left"}</span></td>
      <td><div class="act"><button class="btn s" data-a="renew" data-id="${p.id}">Renew</button><button class="btn o s" data-a="remind1" data-id="${p.id}">Remind</button></div></td></tr>`).join("")}</tbody></table>` : `<p class="m">Nothing to renew in this view.</p>`;
    const N = IP.logs("notes").slice(0, 8);
    $("#notes").innerHTML = N.length ? N.map(n => `<div class="li" style="display:block"><b>${IP.esc(n.name)}</b> <small class="m">${IP.esc(n.to)}</small><br>${IP.esc(n.msg)}<br><small class="m">${new Date(n.at).toLocaleString("en-IN")}</small></div>`).join("") : `<p class="m">No reminders sent yet. Use <b>Remind</b> to notify a customer. This is a simulation and no email is sent.</p>`;
  },
  remind(items) {
    if (!items.length) return IP.toast("No policies are due in the next 30 days");
    items.forEach(({ p, d, c }) => IP.log("notes", { name: c.name, to: c.email, msg: `Policy ${p.policy_number} ${d < 0 ? "expired on" : "expires on"} ${IP.date(p.end_date)}. Renew to stay covered.` }));
    IP.toast(items.length + " reminder" + (items.length > 1 ? "s" : "") + " sent"); this.render(IP.$("#view"));
  },
  remind1(id) { this.remind(this.list().filter(x => x.p.id === id).map(x => ({ ...x, d: x.d }))); },
  renew(id) {
    const p = IP.find("policies", id), c = IP.find("customers", p.customer_id) || { name: "Unknown", email: "" }, start = IP.daysTo(p.end_date) < 0 ? day(0) : p.end_date;
    IP.pay({ title: "Renew policy", ref: `${p.policy_number}, ${c.name}`, amount: p.premium }, () => {
      IP.update("policies", id, { start_date: start, end_date: addYear(start), status: "Renewed" });
      IP.log("notes", { name: c.name, to: c.email, msg: `Policy ${p.policy_number} renewed until ${IP.date(addYear(start))}. Thank you!` });
      this.render(IP.$("#view"));
    });
  }
};
