/* Login / Register (simulated, data kept in localStorage) */
const f = id => document.getElementById(id);
function tab(reg) {
  f("lf").hidden = reg; f("rf").hidden = !reg;
  f("t1").classList.toggle("on", !reg); f("t2").classList.toggle("on", reg);
  f("ttl").textContent = reg ? "Create your account" : "Welcome back";
}
f("t1").onclick = () => tab(false); f("t2").onclick = () => tab(true);
f("demo").onclick = () => { f("le").value = "demo@insurancepro.com"; f("lp").value = "demo123"; };
f("lf").onsubmit = e => {
  e.preventDefault();
  const m = IP.login(f("le").value.trim(), f("lp").value);
  if (m) f("lerr").textContent = m; else location.href = "index.html";
};
f("rf").onsubmit = e => {
  e.preventDefault();
  if (f("rp").value.length < 6) return f("rerr").textContent = "Password must be at least 6 characters.";
  if (f("rp").value !== f("rp2").value) return f("rerr").textContent = "Passwords do not match.";
  const m = IP.register(f("rn").value.trim(), f("re").value.trim(), f("rp").value);
  if (m) f("rerr").textContent = m; else location.href = "index.html";
};
