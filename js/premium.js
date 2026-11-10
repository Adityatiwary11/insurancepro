/* Premium Calculator.
   annual premium = coverage/1000 x base rate x age factor x risk factors, minus a multi-year discount; GST 18% on top. */
const $ = IP.$;
const addYears = (s, n) => { const d = new Date(s + "T00:00:00"); d.setFullYear(d.getFullYear() + n); return d.toLocaleDateString("en-CA"); };
const RATE = [2.4, 12, 22, 1.8, 6];                       // base rate per ₹1,000 cover, same order as TYPES
const DISC = [0, 0, 0.05, 0.08];                          // term discount by number of years
const EXTRA = [                                           // risk factors per policy type: [id, label, [[option, factor], ...]]
  [["smoke", "Smoker?", [["No", 1], ["Yes", 1.5]]]],
  [["cond", "Pre-existing conditions", [["None", 1], ["Mild", 1.25], ["Serious", 1.6]]], ["fam", "Cover for", [["Self", 1], ["Family floater", 1.8]]]],
  [["vage", "Vehicle age", [["0–3 years", 1], ["4–7 years", 1.15], ["8+ years", 1.35]]], ["use", "Usage", [["Private", 1], ["Commercial", 1.4]]], ["ncb", "No-claim bonus", [["None", 1], ["1–2 years", 0.95], ["3+ years", 0.85]]]],
  [["cons", "Construction", [["Concrete", 1], ["Mixed", 1.2]]], ["loc", "Area risk", [["Low", 1], ["Flood / earthquake zone", 1.5]]]],
  [["dest", "Destination", [["Asia", 1], ["Europe / USA", 1.6]]], ["days", "Trip length", [["Up to 7 days", 1], ["8–30 days", 1.8], ["31–90 days", 3]]]]
];
const ageFactor = (t, a) => t < 2 ? (a < 25 ? .9 : a < 35 ? 1 : a < 45 ? 1.25 : a < 55 ? 1.6 : a < 65 ? 2.1 : 2.8) : t === 2 ? (a < 25 ? 1.25 : a < 60 ? 1 : 1.15) : t === 4 && a > 60 ? 1.4 : 1;

const Page = {
  title: "Premium Calculator", last: null,
  render(el) {
    el.innerHTML = `<div class="g two"><div class="card"><h2>Policy details</h2>
      <label for="t">Policy type</label><select id="t">${TYPES.map((t, i) => `<option value="${i}">${t}</option>`).join("")}</select>
      <div class="fg"><div><label for="age">Customer age</label><input id="age" type="number" min="18" max="80" value="35"></div><div><label for="cov">Coverage amount (₹)</label><input id="cov" type="number" min="10000" step="10000" value="1000000"></div></div>
      <label for="yrs">Policy term</label><select id="yrs"><option value="1">1 year</option><option value="2">2 years (5% discount)</option><option value="3">3 years (8% discount)</option></select>
      <h3 style="margin-top:18px">Risk factors</h3><div class="fg" id="ex"></div></div>
      <div class="card"><h2>Premium quote</h2><div id="out"></div><button class="btn w" id="mk">Create policy from this quote</button></div></div>`;
    $("#t").onchange = () => { this.factors(); this.quote(); };
    el.addEventListener("input", e => { if (e.target.closest("#age,#cov,#yrs,#ex")) this.quote(); });
    $("#mk").onclick = () => this.make();
    this.factors(); this.quote();
  },
  factors() {
    $("#ex").innerHTML = EXTRA[+$("#t").value].map(([k, l, o]) => `<div><label for="x_${k}">${l}</label><select id="x_${k}">${o.map(([n, f]) => `<option value="${f}">${n}</option>`).join("")}</select></div>`).join("");
  },
  quote() {
    const t = +$("#t").value, age = +$("#age").value, cov = +$("#cov").value, yrs = +$("#yrs").value, out = $("#out");
    if (!(age >= 18 && age <= 80) || !(cov >= 10000)) { this.last = null; out.innerHTML = `<p class="err">Enter an age from 18 to 80 and a coverage of at least ₹10,000.</p>`; return; }
    const R = Math.round, base = cov / 1000 * RATE[t], aged = base * ageFactor(t, age);
    const risked = aged * [...document.querySelectorAll("#ex select")].reduce((p, s) => p * +s.value, 1);
    const disc = R(risked * DISC[yrs]), net = R(risked) - disc, gst = IP.gst(net);
    this.last = { t, cov, yrs, net };
    const row = (l, v, b) => `<div class="li">${b ? `<b>${l}</b><b>${v}</b>` : `<span>${l}</span><span>${v}</span>`}</div>`, sg = v => (v < 0 ? "−" : "+") + IP.money(Math.abs(v));
    out.innerHTML = row("Base premium", IP.money(R(base))) + row("Age adjustment", sg(R(aged) - R(base))) + row("Risk adjustment", sg(R(risked) - R(aged))) + row("Term discount", disc ? "−" + IP.money(disc) : "None")
      + row("Annual premium", IP.money(net), 1) + row("GST (18%)", IP.money(gst)) + `<div class="li"><b style="font-size:1.15rem">Total per year</b><b style="font-size:1.4rem;color:var(--blue)">${IP.money(net + gst)}</b></div>
      <p class="m">${IP.money(Math.round((net + gst) / 12))} per month, for ${yrs} year${yrs > 1 ? "s" : ""}.</p>`;
  },
  make() {
    if (!this.last) return IP.toast("Fix the quote details first");
    const q = this.last, fields = [{ k: "customer_id", l: "Customer", t: "select", o: IP.all("customers").map(c => [c.id, c.name]) }, { k: "agent_id", l: "Agent", t: "select", o: IP.all("agents").map(a => [a.id, a.name]) }, { k: "start_date", l: "Start date", t: "date", w: 1 }];
    IP.form("Create " + TYPES[q.t], fields, { start_date: day(0) }, v => {
      const r = IP.add("policies", { policy_number: "", type: TYPES[q.t], customer_id: +v.customer_id, agent_id: +v.agent_id, coverage_amount: q.cov, premium: q.net, start_date: v.start_date, end_date: addYears(v.start_date, q.yrs), status: "Pending" });
      IP.update("policies", r.id, { policy_number: `POL-${new Date().getFullYear()}-${String(r.id).padStart(4, "0")}` });
      IP.sync(); IP.toast("Policy created as Pending. Pay the premium to activate it."); setTimeout(() => location.href = "policies.html", 1200); return "";
    });
  }
};
