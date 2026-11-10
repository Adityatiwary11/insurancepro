/* Agent Management: CRUD, commission calculation and performance tracking.
   Commission = premium of the agent's Active, Renewed and Expired policies x commission rate. */
const $ = IP.$;

const Page = {
  title: "Agents", q: "",
  calc(a) {
    const P = IP.all("policies").filter(p => p.agent_id === a.id && ["Active", "Renewed", "Expired"].includes(p.status));
    const prem = P.reduce((s, p) => s + p.premium, 0);
    return { P, prem, com: Math.round(prem * a.commission_rate / 100) };
  },
  render(el) {
    el.innerHTML = `<div class="g stats" id="top"></div><div class="card"><div class="tb"><input id="q" type="search" placeholder="Search by name or email" value="${IP.esc(this.q)}" aria-label="Search agents"><button class="btn" id="new">+ New agent</button></div><div class="tw" id="tbl"></div><p class="m" id="cnt"></p></div>`;
    $("#q").oninput = e => { this.q = e.target.value.toLowerCase(); this.rows(); };
    $("#new").onclick = () => this.edit();
    $("#tbl").onclick = e => { const b = e.target.closest("[data-a]"); if (b) this[b.dataset.a](+b.dataset.id); };
    this.rows();
  },
  rows() {
    const { all, money, esc, ic } = IP, A = all("agents"), S = A.map(a => ({ a, ...this.calc(a) })), max = Math.max(1, ...S.map(s => s.prem));
    const top = S.slice().sort((x, y) => y.prem - x.prem)[0], stat = (i, l, v, s) => `<div class="card stat"><span class="si">${ic(i)}</span><div><small>${l}</small><b>${v}</b><small>${s}</small></div></div>`;
    $("#top").innerHTML = stat("agents", "Agents", A.length, "on the team") + stat("premium", "Premium generated", money(S.reduce((t, s) => t + s.prem, 0)), "by all agents")
      + stat("reports", "Commission payable", money(S.reduce((t, s) => t + s.com, 0)), "total") + stat("customers", "Top performer", top ? esc(top.a.name) : "—", top ? money(top.prem) : "");
    const L = S.filter(s => (s.a.name + s.a.email).toLowerCase().includes(this.q));
    $("#tbl").innerHTML = L.length ? `<table><thead><tr><th>Agent</th><th>Phone</th><th>Rate</th><th>Policies sold</th><th style="min-width:170px">Premium generated</th><th>Commission</th><th>Actions</th></tr></thead><tbody>
      ${L.map(s => `<tr><td><b>${esc(s.a.name)}</b><br><small class="m">${esc(s.a.email)}</small></td><td>${esc(s.a.phone)}</td><td>${s.a.commission_rate}%</td><td>${s.a.policies_sold}</td>
      <td>${money(s.prem)}<div class="bar"><i style="width:${s.prem / max * 100}%"></i></div></td><td><b>${money(s.com)}</b></td>
      <td><div class="act"><button class="btn o s" data-a="view" data-id="${s.a.id}">View</button><button class="btn o s" data-a="edit" data-id="${s.a.id}">Edit</button><button class="btn s r" data-a="del" data-id="${s.a.id}">Delete</button></div></td></tr>`).join("")}</tbody></table>` : `<p class="m">No agents match your search.</p>`;
    $("#cnt").textContent = `${L.length} of ${A.length} agents`;
  },
  view(id) {
    const a = IP.find("agents", id), c = this.calc(a);
    const d = IP.modal(`<div class="mb"><div class="mh"><h2>${IP.esc(a.name)}</h2><button class="ib" data-x aria-label="Close">✕</button></div>
      <p class="m">${IP.esc(a.email)}, ${IP.esc(a.phone)}<br>Commission rate ${a.commission_rate}%, total earned <b>${IP.money(c.com)}</b></p>
      <h3 style="margin:14px 0 6px">Commissionable policies (${c.P.length})</h3>
      ${c.P.length ? c.P.map(p => `<div class="li"><span><b>${p.policy_number}</b> <span class="m">${p.type}</span></span><span>${IP.money(p.premium)} → <b>${IP.money(Math.round(p.premium * a.commission_rate / 100))}</b></span></div>`).join("") : `<p class="m">No commissionable policies yet.</p>`}</div>`);
    d.querySelector("[data-x]").onclick = () => d.close();
  },
  edit(id) {
    const fields = [{ k: "name", l: "Full name", w: 1 }, { k: "email", l: "Email", t: "email" }, { k: "phone", l: "Phone (10 digits)", t: "tel" }, { k: "commission_rate", l: "Commission rate (%)", t: "number", min: 0, max: 25, step: 0.5 }];
    IP.form(id ? "Edit agent" : "New agent", fields, id ? IP.find("agents", id) : { commission_rate: 8 }, v => {
      if (!/^\d{10}$/.test(v.phone)) return "Phone must be exactly 10 digits.";
      v.commission_rate = +v.commission_rate;
      if (id) IP.update("agents", id, v); else IP.add("agents", { ...v, policies_sold: 0 });
      IP.toast(id ? "Agent updated" : "Agent added"); this.rows(); return "";
    });
  },
  del(id) {
    const a = IP.find("agents", id);
    if (a.policies_sold) return IP.toast(`Can’t delete: ${a.name} has ${a.policies_sold} polic${a.policies_sold > 1 ? "ies" : "y"} assigned.`);
    IP.confirm(`Delete agent <b>${IP.esc(a.name)}</b>? This cannot be undone.`, () => { IP.remove("agents", id); IP.toast("Agent deleted"); this.rows(); }, "Delete");
  }
};
