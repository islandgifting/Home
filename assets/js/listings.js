import { supabase } from "./supabase.js";

async function load() {

  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("active", true);

  const featured = document.getElementById("featured");
  const newBiz = document.getElementById("newBiz");

  if (!data) return;

  // Featured (first 6)
  featured.innerHTML = data.slice(0, 6).map(b => `
    <div class="card">
      <h3>${b.name}</h3>
      <p>${b.category}</p>
    </div>
  `).join("");

  // New businesses (last 6)
  newBiz.innerHTML = data.slice(-6).map(b => `
    <div class="card">
      <h3>${b.name}</h3>
      <p>${b.category}</p>
    </div>
  `).join("");
}

load();
