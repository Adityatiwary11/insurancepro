/* Customer Management: list, search, profile view, create, edit, delete */
const $ = IP.$;

const Page = {
  title: "Customers", q: "",
  render(el) {
    el.innerHTML = `<div class="card"><div class="tb"><input id="q" type="search" placeholder="Search by name, email or phone" value="${IP.esc(this.q)}" aria-label="Search customers"><button class="btn" id="new">+ New customer</button></div>
      <div class="tw" id="tbl"></div><p class="m" id="cnt"></p></div>`;
    $("#q").oninput = e => { this.q = e.target.value.toLowerCase(); this.rows(); };
    $("#new").onclick = () => this.edit();
    $("#tbl").onclick = e => { const b = e.target.closest("[data-a]"); if (b) this[b.dataset.a](+b.dataset.id); };
    this.rows();
  },
  rows() {
    const { all, date, esc } = IP;
    const L = all("customers").filter(c => (c.name + c.email + c.phone).toLowerCase().includes(this.q));
    $("#tbl").innerHTML = L.length ? `<table><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Address</th><th>Date of birth</th><th>Policies</th><th>Actions</th></tr></thead><tbody>
      ${L.map(c => `<tr><td><b>${esc(c.name)}</b></td><td>${esc(c.email)}</td><td>${esc(c.phone)}</td><td>${esc(c.address)}</td><td>${date(c.dob)}</td><td>${c.policies_count}</td>
      <td><div class="act"><button class="btn o s" data-a="view" data-id="${c.id}">View</button><button class="btn o s" data-a="edit" data-id="${c.id}">Edit</button><button class="btn s r" data-a="del" data-id="${c.id}">Delete</button></div></td></tr>`).join("")}</tbody></table>` : `<p class="m">No customers match your search.</p>`;
    $("#cnt").textContent = `${L.length} of ${all("customers").length} customers`;
  },
  view(id) {
    const c = IP.find("customers", id), P = IP.all("policies").filter(p => p.customer_id === c.id);
    const claims = IP.all("claims").filter(x => P.some(p => p.id === x.policy_id)).length;
    const d = IP.modal(`<div class="mb"><div class="mh"><h2>${IP.esc(c.name)}</h2><button class="ib" data-x aria-label="Close">✕</button></div>
      <p class="m">${IP.esc(c.email)} · ${IP.esc(c.phone)}<br>${IP.esc(c.address)} · Born ${IP.date(c.dob)}</p>
      <h3 style="margin:14px 0 6px">Policies (${P.length}), claims (${claims})</h3>
      ${P.length ? P.map(p => `<div class="li"><span><b>${p.policy_number}</b> <span class="m">${p.type}</span></span>${IP.badge(p.status)}</div>`).join("") : `<p class="m">This customer has no policies yet.</p>`}</div>`);
    d.querySelector("[data-x]").onclick = () => d.close();
  },
  edit(id) {
    const fields = [{ k: "name", l: "Full name", w: 1 }, { k: "email", l: "Email", t: "email" }, { k: "phone", l: "Phone (10 digits)", t: "tel" }, { k: "dob", l: "Date of birth", t: "date" }, { k: "address", l: "City, state", w: 1 }];
    IP.form(id ? "Edit customer" : "New customer", fields, id ? IP.find("customers", id) : {}, v => {
      if (!/^\d{10}$/.test(v.phone)) return "Phone must be exactly 10 digits.";
      if (v.dob > day(-6570)) return "Customer must be at least 18 years old.";
      if (id) IP.update("customers", id, v); else IP.add("customers", { ...v, policies_count: 0 });
      IP.toast(id ? "Customer updated" : "Customer added"); this.rows(); return "";
    });
  },
  del(id) {
    const c = IP.find("customers", id);
    if (c.policies_count) return IP.toast(`Can’t delete: ${c.name} has ${c.policies_count} polic${c.policies_count > 1 ? "ies" : "y"}.`);
    IP.confirm(`Delete customer <b>${IP.esc(c.name)}</b>? This cannot be undone.`, () => { IP.remove("customers", id); IP.toast("Customer deleted"); this.rows(); }, "Delete");
  }
};
