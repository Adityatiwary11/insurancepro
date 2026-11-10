/* Shared UI helpers used by every module: HTML escaping, modal dialogs, form builder, record counts.
   Loaded after app.js on every app page. */
IP.esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* Modal built on the native <dialog> element (focus trap and Esc key come for free) */
IP.modal = html => {
  const d = document.createElement("dialog");
  d.innerHTML = html; document.body.appendChild(d);
  d.addEventListener("close", () => d.remove());
  d.addEventListener("click", e => { if (e.target === d) d.close(); });
  d.showModal(); return d;
};

/* Confirmation dialog: IP.confirm("message (HTML)", onYes, "Button label") */
IP.confirm = (msg, yes, label = "Confirm") => {
  const d = IP.modal(`<div class="mb"><h2>Please confirm</h2><p>${msg}</p><div class="mf"><button class="btn o" data-x>Cancel</button><button class="btn" data-ok>${label}</button></div></div>`);
  d.querySelector("[data-x]").onclick = () => d.close();
  d.querySelector("[data-ok]").onclick = () => { d.close(); yes(); };
};

/* Form dialog. fields: [{k, l, t, o, min, max, step, w}]  (t = text|email|tel|date|number|select|textarea, w = full width)
   save(values) returns "" on success or an error message to show in the form. */
IP.form = (title, fields, vals, save) => {
  const field = x => {
    const v = vals[x.k] ?? "", a = `id="f_${x.k}" name="${x.k}" required ${x.min != null ? `min="${x.min}"` : ""} ${x.max != null ? `max="${x.max}"` : ""} ${x.step ? `step="${x.step}"` : ""}`;
    const inp = x.t === "select" ? `<select ${a}>${x.o.map(o => `<option value="${IP.esc(o[0])}" ${String(o[0]) === String(v) ? "selected" : ""}>${IP.esc(o[1])}</option>`).join("")}</select>`
      : x.t === "textarea" ? `<textarea ${a} rows="2">${IP.esc(v)}</textarea>`
      : `<input ${a} type="${x.t || "text"}" value="${IP.esc(v)}">`;
    return `<div class="${x.w ? "fw" : ""}"><label for="f_${x.k}">${x.l}</label>${inp}</div>`;
  };
  const d = IP.modal(`<form class="mb"><div class="mh"><h2>${title}</h2><button type="button" class="ib" data-x aria-label="Close">✕</button></div>
    <div class="fg">${fields.map(field).join("")}</div><p class="err" role="alert"></p>
    <div class="mf"><button type="button" class="btn o" data-x>Cancel</button><button class="btn">Save</button></div></form>`);
  d.querySelectorAll("[data-x]").forEach(b => b.onclick = () => d.close());
  d.querySelector("form").onsubmit = e => {
    e.preventDefault();
    const m = save(Object.fromEntries(new FormData(e.target)));
    if (m) d.querySelector(".err").textContent = m; else d.close();
  };
};

/* Recompute policies_count (customers) and policies_sold (agents) from the policies array */
IP.sync = () => {
  const P = IP.all("policies");
  IP.all("customers").forEach(c => IP.update("customers", c.id, { policies_count: P.filter(p => p.customer_id === c.id).length }));
  IP.all("agents").forEach(a => IP.update("agents", a.id, { policies_sold: P.filter(p => p.agent_id === a.id).length }));
};

/* ---- Local logs (payments, customer notifications) kept outside the main data arrays ---- */
IP.logs = k => { try { return JSON.parse(localStorage.getItem("ip_" + k)) || []; } catch (e) { return []; } };
IP.log = (k, item) => { const L = IP.logs(k); L.unshift({ ...item, at: new Date().toISOString() }); try { localStorage.setItem("ip_" + k, JSON.stringify(L.slice(0, 100))); } catch (e) {} };
IP.gst = n => Math.round(n * 0.18);
IP.download = (name, text, mime = "text/csv") => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: mime })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 500); };

/* Simulated premium payment: IP.pay({ title, ref, amount }, onPaid). No real payment is made. */
IP.pay = (o, done) => {
  const tax = IP.gst(o.amount), total = o.amount + tax;
  const d = IP.modal(`<form class="mb"><div class="mh"><h2>${o.title}</h2><button type="button" class="ib" data-x aria-label="Close">✕</button></div><p class="m">${IP.esc(o.ref)}</p>
    <div class="li"><span>Premium</span><b>${IP.money(o.amount)}</b></div><div class="li"><span>GST (18%)</span><b>${IP.money(tax)}</b></div><div class="li"><b>Total payable</b><b>${IP.money(total)}</b></div>
    <label for="pm">Payment method</label><select id="pm"><option>UPI</option><option>Credit / debit card</option><option>Net banking</option></select>
    <p class="m" style="font-size:.85rem">Simulation only. No real payment is made.</p>
    <div class="mf"><button type="button" class="btn o" data-x>Cancel</button><button class="btn" id="go">Pay ${IP.money(total)}</button></div></form>`);
  d.querySelectorAll("[data-x]").forEach(b => b.onclick = () => d.close());
  d.querySelector("form").onsubmit = e => {
    e.preventDefault(); const b = d.querySelector("#go"); b.disabled = true; b.textContent = "Processing…";
    setTimeout(() => {
      const ref = "TXN" + Math.random().toString(36).slice(2, 10).toUpperCase();
      IP.log("payments", { ref, policy: o.ref.split(",")[0], amount: total, method: d.querySelector("#pm").value });
      d.close(); IP.toast("Payment successful. Ref " + ref); done(ref);
    }, 900);
  };
};
