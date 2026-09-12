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
