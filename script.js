const STORAGE_KEYS = { contacts: "cc_contacts", incidents: "cc_incidents", theme: "cc_theme" };
const defaultContacts = [
  { name: "Jordan Lee", relationship: "Partner", phone: "+1 555 014 2288" },
  { name: "Ravi Kapoor", relationship: "Neighbor", phone: "+1 555 018 4012" },
  { name: "Maya Singh", relationship: "Sister", phone: "+1 555 019 7724" }
];
const defaultIncidents = [
  { title: "Downed power line", category: "hazard", severity: "high", location: "Oak Street & 4th", time: "8 min ago", icon: "⚡" },
  { title: "Water distribution point", category: "weather", severity: "low", location: "Cedar Grove Park", time: "24 min ago", icon: "◒" },
  { title: "Medical assistance needed", category: "medical", severity: "medium", location: "Harbor Point, Block C", time: "41 min ago", icon: "✚" },
  { title: "Unusual activity reported", category: "security", severity: "low", location: "North District", time: "1 hr ago", icon: "◈" }
];
const $ = (selector) => document.querySelector(selector);
const readData = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } };
const readArray = (key, fallback) => {
  const value = readData(key, fallback);
  return Array.isArray(value) ? value : fallback;
};
let contacts = readArray(STORAGE_KEYS.contacts, defaultContacts);
let incidents = readArray(STORAGE_KEYS.incidents, defaultIncidents);
let timerInterval;
let timerSeconds = 1800;
let sosCountdown;

function initials(name) { return name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase(); }
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { toast("Your browser could not save this change.", "error"); }
}
function toast(message, type = "success") {
  const item = document.createElement("div");
  item.className = `toast ${type}`;
  item.textContent = message;
  $("#toast-region").append(item);
  setTimeout(() => item.remove(), 4200);
}
function renderContacts() {
  $("#contact-list").innerHTML = contacts.map((contact) => `
    <div class="contact-row">
      <span class="contact-avatar">${initials(contact.name)}</span>
      <span class="contact-info"><strong>${escapeHtml(contact.name)}</strong><small>${escapeHtml(contact.relationship)} · ${escapeHtml(contact.phone)}</small></span>
      <a class="contact-call" href="tel:${contact.phone.replace(/[^+\d]/g, "")}" aria-label="Call ${escapeHtml(contact.name)}">↗</a>
    </div>`).join("");
}
function renderIncidents() {
  const query = $("#incident-search").value.trim().toLowerCase();
  const category = $("#category-filter").value;
  const severity = $("#severity-filter").value;
  const filtered = incidents.filter((incident) => {
    const searchable = `${incident.title} ${incident.location}`.toLowerCase();
    return searchable.includes(query) && (category === "all" || incident.category === category) && (severity === "all" || incident.severity === severity);
  });
  $("#incident-count").textContent = incidents.length;
  $("#incident-empty").hidden = filtered.length > 0;
  $("#incident-list").innerHTML = filtered.map((incident) => `
    <div class="incident-row">
      <span class="incident-icon ${escapeHtml(incident.category)}">${escapeHtml(incident.icon || "◈")}</span>
      <span class="incident-main"><strong>${escapeHtml(incident.title)}</strong><small>${escapeHtml(incident.location)} · ${escapeHtml(incident.time || "just now")}</small></span>
      <span class="severity ${incident.severity}">${incident.severity}</span>
    </div>`).join("");
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]));
}
const aiRules = [
  { category: "Fire", storageCategory: "hazard", icon: "♨", terms: ["fire", "smoke", "burning", "flames", "flame", "gas leak"], urgency: "Critical", action: "Move away from smoke and flames, leave by the safest exit, and call 911 when safe to do so." },
  { category: "Medical", storageCategory: "medical", icon: "✚", terms: ["injured", "injury", "bleeding", "unconscious", "collapsed", "heart attack", "not breathing", "hurt", "medical"], urgency: "Critical", action: "Call 911, keep the person still if safe, and follow the dispatcher’s instructions." },
  { category: "Accident", storageCategory: "hazard", icon: "⌁", terms: ["accident", "crash", "collision", "vehicle", "car", "crashed", "wreck"], urgency: "High", action: "Move to a safe distance, warn approaching traffic if safe, and call 911 with the exact location." },
  { category: "Crime", storageCategory: "security", icon: "◈", terms: ["following", "attacked", "threat", "weapon", "unsafe", "burglary", "assault", "stalking", "robbery"], urgency: "High", action: "Move toward a busy, well-lit place, avoid confrontation, and call 911 if you are in immediate danger." },
  { category: "Natural Disaster", storageCategory: "weather", icon: "◒", terms: ["flood", "flooding", "earthquake", "tornado", "storm", "hurricane", "wildfire", "evacuation"], urgency: "High", action: "Follow local evacuation guidance, move to higher or safer ground, and keep away from fast-moving water or damaged utilities." }
];
function analyzeSituation(text) {
  const normalized = text.toLowerCase();
  const matched = aiRules.filter((rule) => rule.terms.some((term) => normalized.includes(term)));
  const rule = matched[0] || { category: "Other", storageCategory: "security", icon: "◌", terms: [], urgency: "Low", action: "If anyone is in immediate danger, move to a safer place and contact the appropriate emergency service." };
  const criticalSignals = ["trapped", "not breathing", "unconscious", "seriously", "severe", "immediate", "life-threatening", "danger"];
  const highSignals = ["urgent", "smoke", "fire", "bleeding", "following", "crash", "flood"];
  let urgency = rule.urgency;
  if (criticalSignals.some((term) => normalized.includes(term))) urgency = "Critical";
  else if (urgency === "Low" && highSignals.some((term) => normalized.includes(term))) urgency = "High";
  const signalTerms = [
    ["injuries", ["injured", "injury", "bleeding", "hurt", "unconscious", "not breathing", "seriously"]],
    ["active danger", ["fire", "smoke", "flames", "weapon", "following", "threat", "danger", "flooding", "crash"]],
    ["people affected", ["people", "person", "someone", "children", "family", "trapped", "two ", "three "]],
    ["location mentioned", [" at ", " near ", " in ", " on ", "building", "area", "street", "road"]]
  ];
  const signals = signalTerms.filter(([, terms]) => terms.some((term) => normalized.includes(term))).map(([label]) => label);
  const peopleMatch = normalized.match(/(?:two|three|four|five|\d+)\s+(?:people|persons|victims|children|people may)/);
  const locationMatch = text.match(/\b(?:at|near|in|on)\s+([A-Za-z0-9][^.!?]{2,40})/i);
  const keyDetails = [];
  if (peopleMatch) keyDetails.push(peopleMatch[0]);
  if (locationMatch) keyDetails.push(locationMatch[1].trim().replace(/[.,;]+$/, ""));
  return { text, rule, urgency, signals: signals.length ? signals : ["situation needs more detail"], keyDetails, summary: `${rule.category} situation with ${urgency.toLowerCase()} urgency` };
}
function renderAiResults(result) {
  const urgencyClass = result.urgency.toLowerCase();
  const resources = result.rule.category === "Natural Disaster" ? [["911", "Emergency services", "tel:911"], ["211", "Community support", "tel:211"], ["Weather alerts", "National Weather Service", "https://www.weather.gov/"]] : result.rule.category === "Other" ? [["911", "Emergency services", "tel:911"], ["988", "Crisis support line", "tel:988"]] : [["911", "Emergency services", "tel:911"], ["Contacts", "Your trusted circle", "#contacts"]];
  $("#ai-results").innerHTML = `
    <div class="ai-result-head"><div class="ai-result-title"><span class="ai-result-icon ${urgencyClass}">${result.rule.icon}</span><span><small>AI classification</small><strong>${result.rule.category}</strong></span></div><span class="urgency-badge ${urgencyClass}">${result.urgency} urgency</span></div>
    <div class="ai-signal-row">${result.signals.map((signal) => `<span>✓ ${escapeHtml(signal)}</span>`).join("")}</div>
    <div class="ai-action-card"><span class="action-pulse">!</span><div><small>Recommended immediate action</small><strong>${escapeHtml(result.rule.action)}</strong></div></div>
    <div class="ai-resources"><div class="summary-heading"><span>Relevant resources</span><span>Choose an action yourself</span></div><div class="ai-resource-links">${resources.map(([label, name, href]) => `<a href="${href}"${href.startsWith("http") ? ' target="_blank" rel="noreferrer"' : ""}><strong>${escapeHtml(label)}</strong><span>${escapeHtml(name)}</span><b>↗</b></a>`).join("")}</div></div>
    <div class="ai-summary"><div class="summary-heading"><span>Structured incident summary</span><span>AI-assisted</span></div><dl><div><dt>Category</dt><dd>${result.rule.category}</dd></div><div><dt>Urgency</dt><dd>${result.urgency}</dd></div><div><dt>Key details</dt><dd>${escapeHtml(result.keyDetails.length ? result.keyDetails.join(" · ") : "No specific location or count detected")}</dd></div></dl><p>${escapeHtml(result.summary)}. This guidance is informational and does not contact emergency services or share your location.</p></div>
    <div class="ai-result-actions"><button class="button button-primary button-small" id="save-ai-report" type="button">Save to incidents</button><button class="text-button" id="edit-ai-report" type="button">Edit description</button></div>`;
  $("#save-ai-report").addEventListener("click", () => saveAiReport(result));
  $("#edit-ai-report").addEventListener("click", () => { $("#ai-input").focus(); $("#ai-input").selectionStart = $("#ai-input").value.length; });
}
function saveAiReport(result) {
  const location = result.keyDetails.find((detail) => !/people|person|victims|children|trapped/i.test(detail)) || "Location not specified";
  incidents.unshift({ title: `${result.rule.category}: ${result.text.slice(0, 54)}${result.text.length > 54 ? "…" : ""}`, category: result.rule.storageCategory, severity: result.urgency === "Critical" ? "high" : result.urgency === "High" ? "high" : result.urgency === "Medium" ? "medium" : "low", location, time: "just now", icon: result.rule.icon });
  save(STORAGE_KEYS.incidents, incidents);
  renderIncidents();
  toast("AI-assisted report saved to community activity.");
  $("#save-ai-report").disabled = true;
  $("#save-ai-report").textContent = "Saved to incidents";
}
function updateAiCount() { $("#ai-character-count").textContent = `${$("#ai-input").value.length} / 800`; }
function runAiAnalysis() {
  const text = $("#ai-input").value.trim();
  if (!text) { $("#ai-input").focus(); toast("Describe what is happening before analyzing.", "error"); return; }
  $("#analyze-ai").disabled = true;
  $("#analyze-ai").innerHTML = "<span class=\"ai-spinner\"></span> Reading situation…";
  $("#ai-results").innerHTML = "<div class=\"ai-loading\"><span class=\"ai-spinner large\"></span><strong>Organizing safety signals</strong><small>Everything stays in this browser.</small></div>";
  setTimeout(() => { renderAiResults(analyzeSituation(text)); $("#analyze-ai").disabled = false; $("#analyze-ai").innerHTML = "<span>✦</span> Analyze situation"; }, 420);
}
function openModal(id) { $(id).showModal(); }
function cancelSosCountdown() {
  if (!sosCountdown) return;
  clearInterval(sosCountdown);
  sosCountdown = null;
  $("#confirm-sos").disabled = false;
  $("#confirm-sos").textContent = "Yes, send alert";
}
function closeModals() {
  cancelSosCountdown();
  document.querySelectorAll("dialog[open]").forEach((modal) => modal.close());
}
function resetTimer() {
  clearInterval(timerInterval);
  timerSeconds = 1800;
  $("#timer-value").textContent = "30:00";
  $("#timer-progress").style.width = "0%";
  $("#start-checkin").disabled = false;
  $("#cancel-checkin").disabled = true;
  $("#checkin-status").textContent = "Not active";
  $("#checkin-status").classList.remove("active");
}
function startTimer() {
  clearInterval(timerInterval);
  $("#start-checkin").disabled = true;
  $("#cancel-checkin").disabled = false;
  $("#checkin-status").textContent = "Active";
  $("#checkin-status").classList.add("active");
  toast("Safety check-in started. We’ll remind you before it ends.");
  timerInterval = setInterval(() => {
    timerSeconds -= 1;
    const minutes = String(Math.floor(timerSeconds / 60)).padStart(2, "0");
    const seconds = String(timerSeconds % 60).padStart(2, "0");
    $("#timer-value").textContent = `${minutes}:${seconds}`;
    $("#timer-progress").style.width = `${((1800 - timerSeconds) / 1800) * 100}%`;
    if (timerSeconds <= 0) { resetTimer(); toast("Check-in timer ended. Are you okay?", "error"); }
  }, 1000);
}
function requestLocation() {
  if (!navigator.geolocation) { toast("Geolocation is not supported in this browser.", "error"); return; }
  $("#locate-button").disabled = true;
  $("#locate-button").textContent = "Finding you…";
  navigator.geolocation.getCurrentPosition((position) => {
    const { latitude, longitude } = position.coords;
    $("#location-name").textContent = "Current location ready";
    $("#location-detail").textContent = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    $("#locate-button").disabled = false;
    $("#locate-button").textContent = "Refresh my location";
    toast("Location found. It stays private until you share it.");
  }, () => {
    $("#locate-button").disabled = false;
    $("#locate-button").textContent = "Try again";
    toast("We couldn’t access your location. Check browser permissions.", "error");
  }, { enableHighAccuracy: true, timeout: 8000 });
}
function sendSos() {
  closeModals();
  toast("Emergency alert sent to 3 contacts. Stay where you are if safe.");
  $("#sos-button").classList.add("sent");
  $("#sos-button strong").textContent = "SENT";
  $("#sos-button small").textContent = "Contacts notified";
  setTimeout(() => $("#sos-button").classList.remove("sent"), 1800);
  setTimeout(() => { $("#sos-button strong").textContent = "SOS"; $("#sos-button small").textContent = "Tap to activate"; }, 1800);
}
function confirmSosWithCountdown() {
  const button = $("#confirm-sos");
  if (sosCountdown) return;
  let seconds = 3;
  button.disabled = true;
  button.textContent = `Sending in ${seconds}…`;
  sosCountdown = setInterval(() => {
    seconds -= 1;
    if (seconds <= 0) {
      clearInterval(sosCountdown);
      sosCountdown = null;
      button.disabled = false;
      button.textContent = "Yes, send alert";
      sendSos();
      return;
    }
    button.textContent = `Sending in ${seconds}…`;
  }, 1000);
}
function confirmSafe() {
  closeModals();
  resetTimer();
  $("#safe-button").classList.add("safe-confirmed");
  $("#safe-button").textContent = "✓ Checked in";
  toast("Your circle knows you’re safe.");
  setTimeout(() => {
    $("#safe-button").classList.remove("safe-confirmed");
    $("#safe-button").textContent = "✓ I’m safe";
  }, 2800);
}
function setupTheme() {
  const savedTheme = readData(STORAGE_KEYS.theme, "light");
  if (savedTheme === "dark") document.body.classList.add("dark");
  updateThemeLabel();
  $("#theme-toggle").addEventListener("click", () => {
    const dark = document.body.classList.toggle("dark");
    save(STORAGE_KEYS.theme, dark ? "dark" : "light");
    updateThemeLabel();
  });
}
function updateThemeLabel() {
  const dark = document.body.classList.contains("dark");
  $("#theme-toggle").setAttribute("aria-label", `Switch to ${dark ? "light" : "dark"} mode`);
  $("#theme-toggle").setAttribute("title", `Switch to ${dark ? "light" : "dark"} mode`);
}
document.addEventListener("DOMContentLoaded", () => {
  renderContacts(); renderIncidents(); setupTheme();
  document.querySelectorAll(".nav-link").forEach((link) => link.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach((item) => item.classList.remove("active"));
    link.classList.add("active");
  }));
  ["#incident-search", "#category-filter", "#severity-filter"].forEach((selector) => $(selector).addEventListener("input", renderIncidents));
  $("#hero-sos").addEventListener("click", () => openModal("#sos-modal"));
  $("#sos-button").addEventListener("click", () => openModal("#sos-modal"));
  $("#profile-button").addEventListener("click", () => toast("Alex Morgan · Profile active"));
  $("#confirm-sos").addEventListener("click", confirmSosWithCountdown);
  $("#start-checkin").addEventListener("click", startTimer);
  $("#safe-button").addEventListener("click", () => openModal("#safe-modal"));
  $("#confirm-safe").addEventListener("click", confirmSafe);
  $("#cancel-checkin").addEventListener("click", () => { resetTimer(); toast("Safety check-in cancelled."); });
  $("#locate-button").addEventListener("click", requestLocation);
  $("#quick-location").addEventListener("click", () => { $("#locate-button").click(); $("#incidents").scrollIntoView({ behavior: "smooth", block: "center" }); });
  $("#ai-input").addEventListener("input", updateAiCount);
  $("#analyze-ai").addEventListener("click", runAiAnalysis);
  $("#clear-ai").addEventListener("click", () => { $("#ai-input").value = ""; updateAiCount(); $("#ai-input").focus(); });
  document.querySelectorAll("[data-example]").forEach((button) => button.addEventListener("click", () => { $("#ai-input").value = button.dataset.example; updateAiCount(); runAiAnalysis(); }));
  $("#add-contact").addEventListener("click", () => openModal("#contact-modal"));
  $("#report-incident").addEventListener("click", () => openModal("#incident-modal"));
  document.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", closeModals));
  document.querySelectorAll("dialog").forEach((modal) => modal.addEventListener("click", (event) => { if (event.target === modal) closeModals(); }));
  $("#contact-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    contacts.push({ name: form.get("name"), relationship: form.get("relationship"), phone: form.get("phone") });
    save(STORAGE_KEYS.contacts, contacts); renderContacts(); event.currentTarget.reset(); closeModals(); toast("Emergency contact added.");
  });
  $("#incident-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    incidents.unshift({ title: form.get("title"), category: form.get("category"), severity: form.get("severity"), location: form.get("location"), time: "just now", icon: { medical: "✚", hazard: "⚡", weather: "◒", security: "◈" }[form.get("category")] });
    save(STORAGE_KEYS.incidents, incidents); renderIncidents(); event.currentTarget.reset(); closeModals(); toast("Incident shared with your community.");
  });
  $("#reset-demo").addEventListener("click", () => {
    contacts = [...defaultContacts]; incidents = [...defaultIncidents]; save(STORAGE_KEYS.contacts, contacts); save(STORAGE_KEYS.incidents, incidents); renderContacts(); renderIncidents(); resetTimer(); toast("Demo data restored.");
  });
});
