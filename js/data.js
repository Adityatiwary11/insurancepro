/* InsurancePro - seed data.
   Policies, claims, customers and agents are plain JavaScript arrays of objects.
   Dates are relative to today so renewals and charts always look realistic. */
const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toLocaleDateString("en-CA"); };
const TYPES = ["Life Insurance", "Health Insurance", "Auto Insurance", "Home Insurance", "Travel Insurance"];
const STATUSES = ["Active", "Pending", "Expired", "Renewed", "Cancelled"];
const CLAIM_STATUSES = ["Filed", "Under Review", "Approved", "Settled", "Rejected"];

function SEED() {
  const yr = new Date().getFullYear(), pad = (n, l) => String(n).padStart(l, "0");
  const customers = [["Aarav Sharma","Mumbai, MH"],["Priya Nair","Kochi, KL"],["Rohan Mehta","Pune, MH"],["Ananya Iyer","Chennai, TN"],["Vikram Singh","Jaipur, RJ"],["Sneha Kulkarni","Nagpur, MH"],["Arjun Reddy","Hyderabad, TS"],["Meera Das","Kolkata, WB"],["Karan Malhotra","Delhi, DL"],["Divya Menon","Bengaluru, KA"]]
    .map((c, i) => ({ id: i + 1, name: c[0], email: c[0].split(" ")[0].toLowerCase() + "@mail.com", phone: "98" + String(76543210 + i * 1111111).slice(0, 8), address: c[1], dob: (1980 + i * 2) + "-0" + (i % 9 + 1) + "-1" + i, policies_count: 0 }));
  const agents = [["Neha Kapoor",8],["Rahul Verma",10],["Sana Qureshi",7.5],["Amit Joshi",9],["Pooja Bhatt",6]]
    .map((a, i) => ({ id: i + 1, name: a[0], email: a[0].split(" ")[0].toLowerCase() + "@insurancepro.com", phone: "99" + String(12345670 + i * 2222222).slice(0, 8), commission_rate: a[1], policies_sold: 0 }));
  // customer, type index, coverage, premium, start offset (days), status, agent
  const policies = [[1,0,5000000,24000,-200,"Active",1],[2,1,1000000,15500,-340,"Active",2],[3,2,800000,12800,-355,"Active",3],[4,3,3500000,9200,-100,"Active",1],[5,4,500000,3200,-20,"Active",4],[6,1,750000,11000,-60,"Pending",2],[7,0,2500000,18000,-400,"Expired",5],[8,2,600000,9800,-380,"Expired",3],[9,3,2000000,7600,-30,"Renewed",4],[10,1,1500000,19800,-345,"Active",2],[1,2,900000,13400,-250,"Active",5],[2,4,300000,2100,-5,"Active",1],[3,0,10000000,42000,-120,"Active",2],[4,1,500000,8700,-365,"Cancelled",3],[5,3,1800000,6900,-350,"Active",4],[6,2,700000,11200,-15,"Renewed",5],[7,1,1200000,16900,-10,"Pending",1],[8,0,4000000,21500,-90,"Active",3]]
    .map((p, i) => ({ id: i + 1, policy_number: `POL-${yr}-${pad(i + 1, 4)}`, type: TYPES[p[1]], customer_id: p[0], agent_id: p[6], coverage_amount: p[2], premium: p[3], start_date: day(p[4]), end_date: day(p[4] + 365), status: p[5] }));
  // policy id, amount, description, status, filed offset, settled offset
  const claims = [[3,45000,"Rear bumper damage in a parking collision","Under Review",-6,null],[2,18500,"Hospitalisation for appendicitis surgery","Settled",-45,-20],[4,350000,"Water damage from a burst pipe","Approved",-12,null],[1,500000,"Critical illness benefit claim","Filed",-2,null],[11,6500,"Windscreen replacement after road debris","Settled",-70,-55],[5,18000,"Trip cancellation due to illness","Rejected",-30,-22],[13,250000,"Accident hospitalisation","Under Review",-9,null],[10,85000,"Maternity hospitalisation cover","Approved",-14,null],[15,150000,"Theft of household valuables","Filed",-1,null]]
    .map((c, i) => ({ id: i + 1, policy_id: c[0], claim_number: `CLM-${yr}-${pad(i + 1, 3)}`, amount: c[1], description: c[2], status: c[3], date_filed: day(c[4]), date_settled: c[5] === null ? "" : day(c[5]) }));
  policies.forEach(p => { customers[p.customer_id - 1].policies_count++; agents[p.agent_id - 1].policies_sold++; });
  return { customers, agents, policies, claims };
}
