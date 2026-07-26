(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };

  /* ============================================================
     IN-MEMORY DATABASE (mirrors the PostgreSQL schema)
     ============================================================ */
  var first = ["Aarav", "Diya", "Vihaan", "Ananya", "Rohan", "Meera", "Karthik", "Sneha", "Aditya", "Priya", "Nikhil", "Lakshmi", "Varun", "Kavya", "Rahul", "Divya", "Arjun", "Nithya", "Suresh", "Pooja", "Manoj", "Riya", "Deepak", "Shruti", "Vikram", "Anjali", "Hari", "Gayatri"];
  var last = ["Nair", "Reddy", "Menon", "Iyer", "Pillai", "Sharma", "Krishnan", "Das", "Varma", "Raju", "Nambiar", "Kurup"];

  var DB = { students: [], rooms: [], complaints: [], leaves: [], attendance: {}, activity: [] };
  var ME = { roll: "AM.SC.U4CSE25258", name: "Gowtham Adithya", dept: "CSE", room: "B-302", block: "Block B" };

  DB.students = [
    { roll: "AM.SC.U4CSE25209", name: "Siddharth Sai", dept: "CSE", room: "A-101", block: "Block A", leaves: 2 },
    { roll: "AM.SC.U4CSE25258", name: "Gowtham Adithya", dept: "CSE", room: "B-302", block: "Block B", leaves: 3 },
    { roll: "AM.SC.U4CSE25263", name: "Rama Sri Surya", dept: "CSE", room: "B-303", block: "Block B", leaves: 1 },
    { roll: "AM.SC.U4CSE25264", name: "Sai Santhosh", dept: "CSE", room: "A-108", block: "Block A", leaves: 2 },
    { roll: "AM.SC.U4EEE25112", name: "Ananya Nair", dept: "EEE", room: "C-204", block: "Block C", leaves: 0 },
    { roll: "AM.SC.U4ECE25147", name: "Vishnu Prasad", dept: "ECE", room: "A-105", block: "Block A", leaves: 4 },
    { roll: "AM.SC.U4CSE25291", name: "Karthik Reddy", dept: "CSE", room: "C-210", block: "Block C", leaves: 1 },
    { roll: "AM.SC.U4MEE25078", name: "Arjun Menon", dept: "MEE", room: "B-305", block: "Block B", leaves: 2 },
    { roll: "AM.SC.U4CSE25302", name: "Aditya Varma", dept: "CSE", room: null, block: null, leaves: 0 },
    { roll: "AM.SC.U4ECE25166", name: "Rahul Das", dept: "ECE", room: null, block: null, leaves: 1 }
  ];

  // rooms: 3 blocks x 10 rooms; every 5th Single (1 bed) else Double (2 beds); every 3rd AC
  var fillerIdx = 0;
  function fillerStudent(room, block) {
    var n = first[fillerIdx % first.length] + " " + last[fillerIdx % last.length];
    var roll = "AM.SC.U4CSE25" + String(310 + fillerIdx);
    fillerIdx++;
    var s = { roll: roll, name: n, dept: "CSE", room: room, block: block, leaves: fillerIdx % 4 };
    DB.students.push(s);
    return roll;
  }
  [["Block A", "A", 101], ["Block B", "B", 301], ["Block C", "C", 201]].forEach(function (bk) {
    for (var i = 0; i < 10; i++) {
      var no = bk[1] + "-" + (bk[2] + i);
      var single = (i + 1) % 5 === 0;
      var room = { no: no, block: bk[0], type: single ? "Single" : "Double", ac: (i % 3 === 0), beds: [] };
      var bedCount = single ? 1 : 2;
      for (var b = 0; b < bedCount; b++) {
        var named = DB.students.filter(function (s) { return s.room === no; })[b];
        if (named) room.beds.push(named.roll);
        else if ((i * 2 + b) % 4 !== 3) room.beds.push(fillerStudent(no, bk[0]));
        else room.beds.push(null);
      }
      DB.rooms.push(room);
    }
  });

  var CATS = ["Plumbing", "Electrical", "Internet", "Carpentry", "Housekeeping", "Other"];
  var CAT_LABEL = { Plumbing: "Plumbing", Electrical: "Electrical & Lighting", Internet: "Internet Connectivity", Carpentry: "Carpentry / Furniture", Housekeeping: "Housekeeping", Other: "Other" };
  var URG = ["Low", "Medium", "High"];
  var cTitles = {
    Plumbing: ["Washroom tap leaking continuously", "Shower head broken", "Water cooler not chilling"],
    Electrical: ["Fan speed regulator not working", "Corridor tube light flickering", "Power socket sparking"],
    Internet: ["Wi-Fi drops every evening", "LAN port dead in study room", "Very low bandwidth on floor 2"],
    Carpentry: ["Cupboard hinge broken", "Study table wobbling", "Cot plank cracked"],
    Housekeeping: ["Corridor not cleaned since Monday", "Garbage not collected", "Washroom needs deep cleaning"],
    Other: ["Mosquito menace near D wing", "Notice board glass broken", "Water dispenser area flooded"]
  };
  var seedRolls = DB.students.filter(function (s) { return s.room; }).map(function (s) { return s.roll; });
  for (var c = 0; c < 18; c++) {
    var cat = CATS[c % 6];
    var st = c < 3 ? "OPEN" : (c % 5 === 0 ? "ESCALATED" : (c % 3 === 0 ? "RESOLVED" : (c % 2 === 0 ? "OPEN" : "RESOLVED")));
    var d = new Date(2026, 6, 19 - c, 9 + (c * 3) % 12, (c * 17) % 60);
    DB.complaints.push({
      id: "CM-2026-0" + (230 - c), roll: seedRolls[c % seedRolls.length],
      category: cat, urgency: URG[(c + 1) % 3],
      title: cTitles[cat][c % 3], desc: cTitles[cat][c % 3] + ". Reported via student portal — please assign maintenance staff.",
      filedAt: d, status: st, notes: st === "RESOLVED" ? "Fixed by maintenance team." : "", assignee: st === "RESOLVED" ? "Maintenance A" : ""
    });
  }

  function dt(day, h, m) { var x = new Date(2026, 6, day, h, m || 0); return x; }
  DB.leaves = [
    { id: "LV-2026-0151", roll: "AM.SC.U4CSE25258", type: "Weekend Outing", depart: dt(24, 8, 0), ret: dt(26, 18, 0), dest: "Vijayawada, Andhra Pradesh", reason: "Attending my cousin's engagement ceremony with family.", phone: "9876543210", status: "PENDING" },
    { id: "LV-2026-0152", roll: "AM.SC.U4EEE25112", type: "Emergency Leave", depart: dt(21, 6, 0), ret: dt(23, 20, 0), dest: "Kochi, Kerala", reason: "Grandmother hospitalised; travelling with parents immediately.", phone: "9123456780", status: "PENDING" },
    { id: "LV-2026-0153", roll: "AM.SC.U4CSE25291", type: "Weekend Outing", depart: dt(25, 9, 0), ret: dt(26, 21, 0), dest: "Alappuzha boat race", reason: "Weekend trip with classmates to attend the boat race event.", phone: "9988776655", status: "PENDING" },
    { id: "LV-2026-0154", roll: "AM.SC.U4MEE25078", type: "Vacation / Holidays", depart: dt(28, 7, 0), ret: dt(31, 19, 0), dest: "Palakkad home town", reason: "Onam preparation at home; extended family gathering.", phone: "9445566778", status: "PENDING" },
    { id: "LV-2026-0148", roll: "AM.SC.U4CSE25209", type: "Weekend Outing", depart: dt(20, 9, 0), ret: dt(21, 20, 0), dest: "Kollam", reason: "Family visit.", phone: "9012345678", status: "APPROVED", token: "GP-2026-4417", decidedBy: "Dean of Students" },
    { id: "LV-2026-0149", roll: "AM.SC.U4ECE25147", type: "Emergency Leave", depart: dt(19, 14, 0), ret: dt(22, 10, 0), dest: "Thrissur", reason: "Medical emergency at home.", phone: "9111223344", status: "APPROVED", token: "GP-2026-4418", decidedBy: "Dean of Students" },
    { id: "LV-2026-0139", roll: "AM.SC.U4CSE25264", type: "Weekend Outing", depart: dt(4, 8, 0), ret: dt(6, 20, 0), dest: "Home", reason: "Home visit.", phone: "9556677889", status: "RETURNED", actual: dt(6, 19, 10) },
    { id: "LV-2026-0131", roll: "AM.SC.U4CSE25263", type: "Weekend Outing", depart: dt(11, 8, 0), ret: dt(12, 20, 0), dest: "Kottayam", reason: "Cousin's wedding.", phone: "9667788990", status: "RETURNED", actual: dt(13, 7, 45) },
    { id: "LV-2026-0127", roll: "AM.SC.U4CSE25302", type: "Vacation / Holidays", depart: dt(1, 7, 0), ret: dt(5, 18, 0), dest: "Bengaluru", reason: "Family function.", phone: "9778899001", status: "RETURNED", actual: dt(5, 17, 30) }
  ];

  DB.activity = [
    { when: "Today, 9:14 am", text: "Complaint CM-2026-0230 (fan regulator) assigned to Maintenance A.", kind: "info" },
    { when: "Yesterday", text: "Leave LV-2026-0148 approved by College — gate pass GP-2026-4417 issued.", kind: "ok" },
    { when: "12 Jul", text: "Leave LV-2026-0131 flagged: returned 11h 45m after expected time.", kind: "bad" }
  ];

  var today = new Date();
  var todayKey = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, '0') + "-" + String(today.getDate()).padStart(2, '0');
  DB.attendance[todayKey] = {};
  DB.students.forEach(function (s, i) {
    if (!s.room) return;
    DB.attendance[todayKey][s.roll] = { status: i % 11 === 5 ? "A" : (i % 13 === 7 ? "L" : "P"), note: i % 13 === 7 ? "Lab session till 8 pm" : "" };
  });

  /* ============================================================
     HELPERS
     ============================================================ */
  function student(roll) { return DB.students.find(function (s) { return s.roll === roll; }); }
  function initials(name) { return name.split(" ").map(function (w) { return w[0]; }).slice(0, 2).join("").toUpperCase(); }
  function fmtD(d) { return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }); }
  function fmtDT(d) { return ("0" + d.getDate()).slice(-2) + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + d.getFullYear() + " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); }
  function toast(kind, title, msg) {
    var t = document.createElement("div");
    t.className = "toast " + kind;
    var icon = kind === "ok" ? '<polyline points="20 6 9 17 4 12"></polyline>' : kind === "bad" ? '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>' : '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>';
    t.innerHTML = '<span class="tic"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px">' + icon + '</svg></span><div><b>' + esc(title) + '</b><span>' + esc(msg) + '</span></div>';
    $("toasts").appendChild(t);
    setTimeout(function () { t.style.opacity = "0"; t.style.transition = "opacity 300ms"; setTimeout(function () { t.remove(); }, 320); }, 4200);
  }
  function loadingThen(btn, fn) {
    btn.classList.add("loading"); btn.disabled = true;
    setTimeout(function () { btn.classList.remove("loading"); btn.disabled = false; fn(); }, 750);
  }
  function setInvalid(el, bad) {
    var f = el.closest(".field"); if (f) f.classList.toggle("invalid", bad);
    return !bad;
  }
  function bindCount(inputId, outId) {
    var i = $(inputId), o = $(outId);
    i.addEventListener("input", function () { o.textContent = i.value.length; });
  }
  function feed(kind, text) {
    DB.activity.unshift({ when: "Just now", text: text, kind: kind });
    renderFeed();
  }

  /* drawer */
  var onDrawerClose = null;
  function openDrawer(title, bodyHTML, footHTML) {
    $("drawer-title").textContent = title;
    $("drawer-body").innerHTML = bodyHTML;
    $("drawer-foot").innerHTML = footHTML || "";
    $("overlay").classList.add("on"); $("drawer").classList.add("on");
  }
  function closeDrawer() {
    $("overlay").classList.remove("on"); $("drawer").classList.remove("on");
    hidePopover();
    if (onDrawerClose) { onDrawerClose(); onDrawerClose = null; }
  }
  $("drawer-x").addEventListener("click", closeDrawer);
  $("overlay").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeDrawer(); hidePopover(); } });

  /* popover */
  var popAnchor = null;
  function showPopover(anchor, html) {
    var p = $("popover");
    p.innerHTML = html; p.classList.add("on"); popAnchor = anchor;
    var r = anchor.getBoundingClientRect();
    var x = Math.min(r.left, window.innerWidth - 264);
    var y = r.bottom + 8;
    if (y + p.offsetHeight > window.innerHeight - 10) y = r.top - p.offsetHeight - 8;
    p.style.left = Math.max(8, x) + "px"; p.style.top = Math.max(8, y) + "px";
  }
  function hidePopover() { $("popover").classList.remove("on"); popAnchor = null; }
  document.addEventListener("click", function (e) {
    if (popAnchor && !$("popover").contains(e.target) && e.target !== popAnchor && !popAnchor.contains(e.target)) hidePopover();
  }, true);

  /* ============================================================
     NAVIGATION / SHELL
     ============================================================ */
  var NAV = {
    admin: [
      ["overview", "Overview", '<rect x="3" y="3" width="7" height="9" rx="1.5"></rect><rect x="14" y="3" width="7" height="5" rx="1.5"></rect><rect x="14" y="12" width="7" height="9" rx="1.5"></rect><rect x="3" y="16" width="7" height="5" rx="1.5"></rect>'],
      ["rooms", "Room allocation", '<path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"></path><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"></path><line x1="2" y1="17" x2="22" y2="17"></line>'],
      ["complaints", "Complaints", '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>'],
      ["attendance", "Attendance", '<rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><path d="m9 16 2 2 4-4"></path>'],
      ["leaves", "Leave tracking", '<path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>'],
      ["design", "Design system", '<circle cx="13.5" cy="6.5" r="2.5"></circle><path d="M12 22a10 10 0 1 1 10-10c0 2-1.5 3.5-3.5 3.5H16a2 2 0 0 0-2 2c0 1 .5 1.5.5 2.5A2 2 0 0 1 12 22z"></path>']
    ],
    student: [
      ["home", "My hostel", '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>'],
      ["complaint", "New complaint", '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>'],
      ["leave", "Apply leave", '<line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>']
    ],
    college: [
      ["authorize", "Authorizations", '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path>']
    ]
  };
  var ROLE_META = {
    admin: { label: "Hostel Admin", avatar: "HA", crumb: "Hostel Admin" },
    student: { label: "Student", avatar: "GA", crumb: "Student Portal" },
    college: { label: "College Authority", avatar: "CA", crumb: "College Authority" }
  };
  var state = { role: "admin", view: "overview", cmpFilter: "all", cmpSort: { key: "filedAt", dir: -1 }, cmpPage: 1, colSel: null, skeletonShown: {} };

  function navTo(role, view) {
    state.role = role; state.view = view;
    document.querySelectorAll(".view").forEach(function (v) { v.classList.toggle("on", v.dataset.view === role + "/" + view); });
    document.querySelectorAll("#role-switch button").forEach(function (b) { b.classList.toggle("on", b.dataset.role === role); });
    $("side-role-label").textContent = ROLE_META[role].label;
    $("top-avatar").textContent = ROLE_META[role].avatar;
    renderSideNav(); renderBottomNav(); renderCrumbs();
    var renderers = {
      "admin/overview": renderOverview, "admin/rooms": renderRooms, "admin/complaints": renderComplaints,
      "admin/attendance": renderAttendance, "admin/leaves": renderLeavesAdmin,
      "student/home": renderStudentHome, "college/authorize": renderCollege
    };
    var r = renderers[role + "/" + view];
    if (r) r();
    window.scrollTo({ top: 0 });
  }
  function renderSideNav() {
    $("side-nav").innerHTML = NAV[state.role].map(function (n) {
      var cnt = "";
      if (n[0] === "complaints") { var open = DB.complaints.filter(function (x) { return x.status !== "RESOLVED"; }).length; cnt = '<span class="cnt">' + open + "</span>"; }
      if (n[0] === "authorize") { var p = DB.leaves.filter(function (x) { return x.status === "PENDING"; }).length; cnt = p ? '<span class="cnt">' + p + "</span>" : ""; }
      return '<button class="nav-btn' + (state.view === n[0] ? " on" : "") + '" data-v="' + n[0] + '"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + n[2] + "</svg>" + n[1] + cnt + "</button>";
    }).join("");
    $("side-nav").querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () { navTo(state.role, b.dataset.v); });
    });
  }
  function renderBottomNav() {
    $("bottomnav").innerHTML = NAV[state.role].slice(0, 5).map(function (n) {
      return '<button class="' + (state.view === n[0] ? "on" : "") + '" data-v="' + n[0] + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + n[2] + "</svg>" + n[1] + "</button>";
    }).join("");
    $("bottomnav").querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () { navTo(state.role, b.dataset.v); });
    });
  }
  function renderCrumbs() {
    var vn = NAV[state.role].find(function (n) { return n[0] === state.view; });
    $("crumbs").innerHTML = '<span>HostelOS</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg><span>' + ROLE_META[state.role].crumb + '</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg><b>' + (vn ? vn[1] : "") + "</b>";
  }
  document.querySelectorAll("#role-switch button").forEach(function (b) {
    b.addEventListener("click", function () { navTo(b.dataset.role, NAV[b.dataset.role][0][0]); });
  });

  /* ============================================================
     ADMIN: OVERVIEW
     ============================================================ */
  function stats() {
    var beds = 0, occ = 0;
    DB.rooms.forEach(function (r) { r.beds.forEach(function (b) { beds++; if (b) occ++; }); });
    var open = DB.complaints.filter(function (x) { return x.status !== "RESOLVED"; }).length;
    var pend = DB.leaves.filter(function (x) { return x.status === "PENDING"; }).length;
    var att = DB.attendance[todayKey] || {};
    var tot = 0, pres = 0;
    Object.keys(att).forEach(function (k) { tot++; if (att[k].status !== "A") pres++; });
    return { beds: beds, occ: occ, open: open, pend: pend, att: tot ? Math.round(pres / tot * 100) : 0 };
  }
  function renderOverview() {
    $("ov-date").textContent = today.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
    var g = $("stat-grid");
    if (!state.skeletonShown.overview) {
      g.innerHTML = [1, 2, 3, 4].map(function () { return '<div class="card pad"><div class="sk" style="height:14px;width:60%"></div><div class="sk" style="height:26px;width:40%;margin-top:10px"></div><div class="sk" style="height:12px;width:80%;margin-top:8px"></div></div>'; }).join("");
      state.skeletonShown.overview = true;
      setTimeout(paintStats, 550);
    } else paintStats();
  }
  function paintStats() {
    if (state.role !== "admin" || state.view !== "overview") return;
    var s = stats();
    var pct = Math.round(s.occ / s.beds * 100);
    var C = 2 * Math.PI * 26;
    var sparkPts = [72, 78, 74, 81, 85, 79, 88, 84, 90, s.att];
    var pts = sparkPts.map(function (v, i) { return (i * (100 / (sparkPts.length - 1))).toFixed(1) + "," + (30 - (v - 65) * 0.9).toFixed(1); }).join(" ");
    $("stat-grid").innerHTML =
      '<div class="card pad stat">' +
        '<svg class="radial" viewBox="0 0 62 62"><circle class="track" cx="31" cy="31" r="26" fill="none" stroke-width="7"></circle><circle class="arc" cx="31" cy="31" r="26" fill="none" stroke-width="7" stroke-dasharray="' + C + '" stroke-dashoffset="' + (C * (1 - pct / 100)) + '" transform="rotate(-90 31 31)"></circle><text x="31" y="35" text-anchor="middle">' + pct + '%</text></svg>' +
        '<div><p class="t-12">Total occupancy</p><p class="num">' + s.occ + "/" + s.beds + '</p><p class="t-12">beds filled across 3 blocks</p></div></div>' +
      '<a href="#" class="statlink" id="stat-cmp"><div class="card pad stat"><div style="flex:1"><p class="t-12">Active complaints</p><p class="num">' + s.open + '</p><span class="badge warn">needs triage</span></div><span class="qico" style="width:40px;height:40px;border-radius:12px;background:var(--amber-100);color:var(--amber-600);display:grid;place-items:center"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></span></div></a>' +
      '<div class="card pad stat"><div style="flex:1"><p class="t-12">Pending leaves</p><p class="num">' + s.pend + '</p><p class="t-12">awaiting college authorization</p></div><span style="width:40px;height:40px;border-radius:12px;background:var(--indigo-100);color:var(--indigo-600);display:grid;place-items:center"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></span></div>' +
      '<div class="card pad"><p class="t-12" style="text-transform:uppercase;letter-spacing:.08em;font-weight:700">Attendance today</p><p class="num" style="font-size:24px;font-weight:700">' + s.att + '%</p><svg class="spark" viewBox="0 0 100 32" preserveAspectRatio="none"><polygon class="fill" points="0,32 ' + pts + ' 100,32"></polygon><polyline points="' + pts + '"></polyline></svg></div>';
    var link = $("stat-cmp");
    if (link) link.addEventListener("click", function (e) { e.preventDefault(); navTo("admin", "complaints"); });

    $("ov-recent-complaints").innerHTML = DB.complaints.filter(function (x) { return x.status !== "RESOLVED"; }).slice(0, 4).map(function (x) {
      var st = student(x.roll);
      return '<div style="display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--slate-100)"><span class="pill cat-' + x.category + '">' + CAT_LABEL[x.category].split(" ")[0] + '</span><div class="stack" style="flex:1;min-width:0"><b>' + esc(x.title) + "</b><span>" + esc(st.name) + " · " + st.room + '</span></div><span class="pill u-' + x.urgency + '">' + x.urgency + "</span></div>";
    }).join("") || '<p class="t-13">No open complaints. 🎉</p>';

    $("ov-active-passes").innerHTML = DB.leaves.filter(function (l) { return l.status === "APPROVED"; }).map(function (l) {
      var st = student(l.roll);
      return '<div style="display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--slate-100)"><span class="avatar">' + initials(st.name) + '</span><div class="stack" style="flex:1"><b>' + esc(st.name) + '</b><span class="mono">' + l.token + " · returns " + fmtD(l.ret) + '</span></div><span class="badge ok">Validated</span></div>';
    }).join("") || '<p class="t-13">No active gate passes right now.</p>';
  }
  $("ov-refresh").addEventListener("click", function () { paintStats(); toast("info", "Metrics refreshed", "Aggregates re-queried from the database."); });

  /* ============================================================
     ADMIN: ROOMS
     ============================================================ */
  var rfTimer = null;
  function renderRooms() {
    var block = $("rf-block").value;
    var types = Array.prototype.slice.call(document.querySelectorAll(".rf-type:checked")).map(function (c) { return c.value; });
    var q = $("rf-search").value.trim().toLowerCase();
    var shown = 0;
    $("roomgrid").innerHTML = DB.rooms.filter(function (r) {
      if (block && r.block !== block) return false;
      if (types.indexOf(r.type) === -1) return false;
      if (types.indexOf(r.ac ? "AC" : "Non-AC") === -1) return false;
      return true;
    }).map(function (r) {
      var match = !q;
      if (q) match = r.beds.some(function (b) {
        if (!b) return false; var s = student(b);
        return s.name.toLowerCase().indexOf(q) !== -1 || s.roll.toLowerCase().indexOf(q) !== -1;
      });
      shown++;
      return '<div class="room' + (q && !match ? " dim" : "") + '"><div class="no">' + r.no + '<span class="t-12">' + (r.ac ? "AC" : "") + '</span></div><div class="meta">' + r.type + " · " + r.block + '</div><div class="beds">' +
        r.beds.map(function (b, bi) {
          return '<button class="bed ' + (b ? "busy" : "free") + '" data-room="' + r.no + '" data-bed="' + bi + '" aria-label="' + r.no + " bed " + (bi + 1) + (b ? " occupied" : " vacant") + '"></button>';
        }).join("") + "</div></div>";
    }).join("");
    $("rf-count").textContent = shown + " rooms shown";
    $("roomgrid").querySelectorAll(".bed").forEach(function (bd) {
      bd.addEventListener("click", function (e) {
        e.stopPropagation();
        var room = DB.rooms.find(function (r) { return r.no === bd.dataset.room; });
        var occ = room.beds[+bd.dataset.bed];
        if (occ) {
          var s = student(occ);
          showPopover(bd, '<div style="display:flex;gap:10px;align-items:center"><span class="avatar lg">' + initials(s.name) + '</span><div><b style="font-size:13.5px">' + esc(s.name) + '</b><div class="t-12 mono">' + s.roll + '</div><div class="t-12">' + room.no + " · " + room.block + "</div></div></div>");
        } else {
          openAllocate(room, +bd.dataset.bed);
        }
      });
    });
  }
  ["rf-block"].forEach(function (id) { $(id).addEventListener("change", renderRooms); });
  document.querySelectorAll(".rf-type").forEach(function (c) { c.addEventListener("change", renderRooms); });
  $("rf-search").addEventListener("input", function () {
    clearTimeout(rfTimer); rfTimer = setTimeout(renderRooms, 300);
  });

  function openAllocate(room, bedIdx) {
    var free = DB.students.filter(function (s) { return !s.room; });
    openDrawer("Quick allocate — " + room.no,
      '<p class="t-13">Assigning bed ' + (bedIdx + 1) + " in a " + room.type.toLowerCase() + " room (" + room.block + ").</p>" +
      '<div class="field"><label for="al-roll">Student</label><input class="control" id="al-roll" list="al-list" placeholder="Type roll number or name…"><datalist id="al-list">' +
      free.map(function (s) { return '<option value="' + s.roll + '">' + esc(s.name) + "</option>"; }).join("") +
      '</datalist><p class="err" role="alert">Invalid Student ID — pick an unallocated student from the list.</p></div>' +
      '<div class="field"><label for="al-date">Allocation date</label><input type="date" class="control" id="al-date" value="' + todayKey + '"></div>' +
      '<label class="checkline"><input type="checkbox" id="al-dep" checked>Security deposit of ₹5,000 collected</label>',
      '<button class="btn btn-ghost" id="al-cancel">Cancel</button><button class="btn btn-primary" id="al-go"><span class="spin"></span>Confirm assignment</button>');
    $("al-cancel").addEventListener("click", closeDrawer);
    $("al-go").addEventListener("click", function () {
      var roll = $("al-roll").value.trim();
      var s = DB.students.find(function (x) { return x.roll === roll && !x.room; });
      if (!setInvalid($("al-roll"), !s)) return;
      loadingThen($("al-go"), function () {
        room.beds[bedIdx] = roll; s.room = room.no; s.block = room.block;
        DB.attendance[todayKey][roll] = { status: "P", note: "" };
        closeDrawer(); renderRooms();
        toast("ok", "Room allocated", s.name + " → " + room.no + " (bed " + (bedIdx + 1) + "). allocation row inserted.");
      });
    });
  }

  /* ============================================================
     ADMIN: COMPLAINTS
     ============================================================ */
  var PAGE = 10;
  function cmpFiltered() {
    var rows = DB.complaints.slice();
    if (state.cmpFilter === "open") rows = rows.filter(function (x) { return x.status !== "RESOLVED"; });
    if (state.cmpFilter === "resolved") rows = rows.filter(function (x) { return x.status === "RESOLVED"; });
    var k = state.cmpSort.key, d = state.cmpSort.dir;
    var uw = { Low: 0, Medium: 1, High: 2 };
    rows.sort(function (a, b) {
      var va = k === "urgency" ? uw[a.urgency] : a[k], vb = k === "urgency" ? uw[b.urgency] : b[k];
      return (va > vb ? 1 : va < vb ? -1 : 0) * d;
    });
    return rows;
  }
  function renderComplaints() {
    var rows = cmpFiltered();
    var pages = Math.max(1, Math.ceil(rows.length / PAGE));
    if (state.cmpPage > pages) state.cmpPage = pages;
    var slice = rows.slice((state.cmpPage - 1) * PAGE, state.cmpPage * PAGE);
    var paint = function () {
      if (state.role !== "admin" || state.view !== "complaints") return;
      $("cmp-body").innerHTML = slice.map(function (x) {
        var st = student(x.roll);
        var badge = x.status === "RESOLVED" ? '<span class="badge ok">Resolved</span>' : x.status === "ESCALATED" ? '<span class="badge bad">Escalated</span>' : '<span class="badge warn">Open</span>';
        return '<tr class="rowbtn" data-id="' + x.id + '"><td class="mono">' + x.id + '</td>' +
          '<td><div class="stack"><b>' + esc(st.name) + "</b><span>" + st.room + " · " + st.block + '</span></div></td>' +
          '<td><span class="pill cat-' + x.category + '">' + CAT_LABEL[x.category] + '</span></td>' +
          '<td><span class="pill u-' + x.urgency + '">' + x.urgency + '</span></td>' +
          '<td class="mono" style="font-size:12px">' + fmtDT(x.filedAt) + "</td><td>" + badge + "</td>" +
          '<td>' + (x.status !== "RESOLVED" ? '<button class="btn btn-outline btn-sm cmp-resolve" data-id="' + x.id + '">Resolve</button>' : '<span class="t-12">—</span>') + "</td></tr>";
      }).join("");
      $("cmp-pager").innerHTML = '<span class="info">Showing ' + (rows.length ? (state.cmpPage - 1) * PAGE + 1 : 0) + "–" + Math.min(state.cmpPage * PAGE, rows.length) + " of " + rows.length + " tickets</span>" +
        '<button id="pg-prev" ' + (state.cmpPage === 1 ? "disabled" : "") + ">‹</button>" +
        Array.from({ length: pages }, function (_, i) { return '<button class="pg-n' + (i + 1 === state.cmpPage ? " on" : "") + '" data-p="' + (i + 1) + '">' + (i + 1) + "</button>"; }).join("") +
        '<button id="pg-next" ' + (state.cmpPage === pages ? "disabled" : "") + ">›</button>";
      $("cmp-body").querySelectorAll("tr").forEach(function (tr) {
        tr.addEventListener("click", function (e) {
          if (e.target.closest(".cmp-resolve")) return;
          openComplaint(tr.dataset.id);
        });
      });
      $("cmp-body").querySelectorAll(".cmp-resolve").forEach(function (b) {
        b.addEventListener("click", function () { openComplaint(b.dataset.id); });
      });
      $("cmp-pager").querySelectorAll(".pg-n").forEach(function (b) { b.addEventListener("click", function () { state.cmpPage = +b.dataset.p; renderComplaints(); }); });
      var pv = $("pg-prev"), nx = $("pg-next");
      if (pv) pv.addEventListener("click", function () { state.cmpPage--; renderComplaints(); });
      if (nx) nx.addEventListener("click", function () { state.cmpPage++; renderComplaints(); });
    };
    if (!state.skeletonShown.cmp) {
      $("cmp-body").innerHTML = Array.from({ length: 6 }, function () { return '<tr><td colspan="7"><div class="sk" style="height:34px"></div></td></tr>'; }).join("");
      state.skeletonShown.cmp = true; setTimeout(paint, 500);
    } else paint();
  }
  $("cmp-tabs").querySelectorAll("button").forEach(function (b) {
    b.addEventListener("click", function () {
      $("cmp-tabs").querySelectorAll("button").forEach(function (x) { x.classList.remove("on"); });
      b.classList.add("on"); state.cmpFilter = b.dataset.f; state.cmpPage = 1; renderComplaints();
    });
  });
  document.querySelectorAll('[data-view="admin/complaints"] th.sortable').forEach(function (th) {
    th.addEventListener("click", function () {
      if (state.cmpSort.key === th.dataset.sort) state.cmpSort.dir *= -1;
      else { state.cmpSort.key = th.dataset.sort; state.cmpSort.dir = 1; }
      renderComplaints();
    });
  });
  function openComplaint(id) {
    var x = DB.complaints.find(function (c) { return c.id === id; });
    var st = student(x.roll);
    openDrawer("Ticket " + x.id,
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><span class="pill cat-' + x.category + '">' + CAT_LABEL[x.category] + '</span><span class="pill u-' + x.urgency + '">' + x.urgency + ' urgency</span></div>' +
      '<div class="stack"><b>' + esc(st.name) + '</b><span class="mono">' + st.roll + " · " + st.room + " · " + st.block + "</span></div>" +
      '<div class="field"><label>Filed description</label><p style="font-size:13px;background:var(--slate-50);border:1px solid var(--border);border-radius:10px;padding:11px">' + esc(x.desc) + '</p><span class="helper">Filed ' + fmtDT(x.filedAt) + " · no image proofs attached</span></div>" +
      '<div class="field"><label for="cd-notes">Admin resolution notes</label><textarea class="control" id="cd-notes" placeholder="What was done, parts replaced, follow-ups…">' + esc(x.notes) + "</textarea></div>" +
      '<div class="field"><label for="cd-staff">Assign staff</label><select class="control" id="cd-staff">' +
      ["", "Maintenance A", "Maintenance B", "Electrician on call", "Network vendor", "Housekeeping lead"].map(function (o) { return "<option" + (x.assignee === o ? " selected" : "") + ">" + (o || "Unassigned") + "</option>"; }).join("") +
      "</select></div>",
      (x.status !== "RESOLVED"
        ? '<button class="btn btn-outline" id="cd-esc">Escalate</button><button class="btn btn-emerald" id="cd-done"><span class="spin"></span>Mark as resolved &amp; notify student</button>'
        : '<span class="badge ok" style="margin-right:auto">Resolved</span><button class="btn btn-ghost" id="cd-close">Close</button>'));
    var done = $("cd-done"), escBtn = $("cd-esc"), closeBtn = $("cd-close");
    if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
    if (escBtn) escBtn.addEventListener("click", function () {
      x.status = "ESCALATED"; closeDrawer(); renderComplaints(); renderSideNav();
      toast("bad", "Ticket escalated", x.id + " raised to management review.");
    });
    if (done) done.addEventListener("click", function () {
      loadingThen(done, function () {
        x.status = "RESOLVED"; x.notes = $("cd-notes").value; x.assignee = $("cd-staff").value;
        closeDrawer(); renderComplaints(); renderSideNav();
        toast("ok", "Resolved & student notified", x.id + " — UPDATE complaint SET status='RESOLVED'.");
        if (x.roll === ME.roll) feed("ok", "Complaint " + x.id + " (" + x.title + ") marked Resolved by hostel admin.");
      });
    });
  }

  /* ============================================================
     ADMIN: ATTENDANCE
     ============================================================ */
  function attKey() { return $("att-date").value || todayKey; }
  function ensureDay(k) {
    if (!DB.attendance[k]) {
      DB.attendance[k] = {};
      DB.students.forEach(function (s) { if (s.room) DB.attendance[k][s.roll] = { status: "P", note: "" }; });
    }
    return DB.attendance[k];
  }
  function renderAttendance() {
    if (!$("att-date").value) $("att-date").value = todayKey;
    var k = attKey(), day = ensureDay(k);
    var block = $("att-block").value;
    var rows = DB.students.filter(function (s) { return s.room && (!block || s.block === block); });
    $("att-body").innerHTML = rows.map(function (s) {
      var a = day[s.roll] || (day[s.roll] = { status: "P", note: "" });
      return '<tr><td><div style="display:flex;gap:10px;align-items:center"><span class="avatar">' + initials(s.name) + '</span><div class="stack"><b>' + esc(s.name) + '</b><span class="mono">' + s.roll + '</span></div></div></td>' +
        '<td class="mono">' + s.room + "</td>" +
        '<td><span class="att-pills" data-roll="' + s.roll + '">' +
          '<button class="p' + (a.status === "P" ? " on" : "") + '" data-s="P">Present</button>' +
          '<button class="a' + (a.status === "A" ? " on" : "") + '" data-s="A">Absent</button>' +
          '<button class="l' + (a.status === "L" ? " on" : "") + '" data-s="L">Late / Permitted</button>' +
        "</span></td>" +
        '<td style="min-width:180px"><input class="note-in" data-roll="' + s.roll + '" placeholder="Add note…" value="' + esc(a.note) + '"></td></tr>';
    }).join("");
    $("att-body").querySelectorAll(".att-pills button").forEach(function (b) {
      b.addEventListener("click", function () {
        var roll = b.parentElement.dataset.roll;
        day[roll].status = b.dataset.s;
        b.parentElement.querySelectorAll("button").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on"); attSummary();
      });
    });
    $("att-body").querySelectorAll(".note-in").forEach(function (n) {
      n.addEventListener("input", function () { day[n.dataset.roll].note = n.value; });
    });
    attSummary();
  }
  function attSummary() {
    var day = ensureDay(attKey());
    var p = 0, a = 0, l = 0;
    Object.keys(day).forEach(function (r) { var s = day[r].status; if (s === "P") p++; else if (s === "A") a++; else l++; });
    $("att-summary").innerHTML = '<b style="color:var(--emerald-600)">' + p + " present</b> · " + '<b style="color:var(--rose-600)">' + a + " absent</b> · " + '<b style="color:var(--amber-600)">' + l + " late/permitted</b> — attendance rows upserted per change";
  }
  $("att-date").addEventListener("change", renderAttendance);
  $("att-block").addEventListener("change", renderAttendance);
  $("att-all-p").addEventListener("click", function () { var d = ensureDay(attKey()); Object.keys(d).forEach(function (r) { d[r].status = "P"; }); renderAttendance(); toast("ok", "Marked all present", "Bulk UPDATE applied to " + Object.keys(d).length + " rows."); });
  $("att-all-a").addEventListener("click", function () { var d = ensureDay(attKey()); Object.keys(d).forEach(function (r) { d[r].status = "A"; }); renderAttendance(); toast("bad", "Marked all absent", "Bulk UPDATE applied — adjust individual rows as needed."); });
  $("att-csv").addEventListener("click", function () {
    var k = attKey(), d = ensureDay(k);
    var csv = "roll_no,name,room,date,status,note\n" + Object.keys(d).map(function (r) {
      var s = student(r); return [r, '"' + s.name + '"', s.room, k, d[r].status, '"' + (d[r].note || "") + '"'].join(",");
    }).join("\n");
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "attendance-" + k + ".csv"; a.click(); URL.revokeObjectURL(a.href);
    toast("ok", "CSV exported", "attendance-" + k + ".csv downloaded.");
  });

  /* ============================================================
     ADMIN: LEAVES
     ============================================================ */
  function renderLeavesAdmin() {
    var act = DB.leaves.filter(function (l) { return l.status === "APPROVED"; });
    $("lv-active").innerHTML = act.length ? act.map(function (l) {
      var st = student(l.roll);
      return '<div class="card pad pass-card"><div style="display:flex;gap:10px;align-items:center;margin-bottom:8px"><span class="avatar">' + initials(st.name) + '</span><div class="stack"><b>' + esc(st.name) + '</b><span class="mono">' + l.id + " · " + l.token + '</span></div><span class="badge ok" style="margin-left:auto">Gate pass</span></div>' +
        '<p class="t-13">Departs <b>' + fmtDT(l.depart) + "</b> · expected back <b>" + fmtDT(l.ret) + "</b></p>" +
        '<p class="t-12" style="margin-top:6px">Status: Validated by College — awaiting student checkout at the gate.</p></div>';
    }).join("") : '<div class="card pad"><p class="t-13">No college-validated passes active right now.</p></div>';
    $("lv-history").innerHTML = DB.leaves.filter(function (l) { return l.status === "RETURNED"; }).map(function (l) {
      var st = student(l.roll);
      var lateMs = l.actual - l.ret;
      var late = lateMs > 0;
      var lateTxt = late ? "+" + Math.round(lateMs / 3600000) + "h late" : "On time";
      return "<tr><td class='mono'>" + l.id + '</td><td><div class="stack"><b>' + esc(st.name) + "</b><span>" + (st.room || "—") + '</span></div></td><td class="mono" style="font-size:12px">' + fmtDT(l.depart) + '</td><td class="mono" style="font-size:12px">' + fmtDT(l.ret) + '</td><td class="mono" style="font-size:12px">' + fmtDT(l.actual) + "</td><td>" + (late ? '<span class="badge bad">' + lateTxt + "</span>" : '<span class="badge ok">On time</span>') + "</td></tr>";
    }).join("");
  }

  /* ============================================================
     STUDENT
     ============================================================ */
  function renderStudentHome() { drawQR(); renderFeed(); }
  function drawQR() {
    var svg = $("stu-qr");
    if (svg.childNodes.length) return;
    var n = 29, cells = "";
    var seed = 0; ME.roll.split("").forEach(function (ch) { seed = (seed * 31 + ch.charCodeAt(0)) >>> 0; });
    function rnd() { seed = (seed * 1103515245 + 12345) >>> 0; return seed / 4294967296; }
    function finder(x, y) {
      cells += '<rect x="' + x + '" y="' + y + '" width="7" height="7" fill="#1E293B"></rect><rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="5" height="5" fill="#fff"></rect><rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="3" height="3" fill="#1E293B"></rect>';
    }
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
      var inF = (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
      if (!inF && rnd() > 0.55) cells += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="#1E293B"></rect>';
    }
    finder(0, 0); finder(n - 7, 0); finder(0, n - 7);
    svg.innerHTML = cells;
  }
  function renderFeed() {
    var el = $("stu-feed"); if (!el) return;
    var col = { ok: "var(--emerald-500)", bad: "var(--rose-500)", info: "var(--indigo-500)", warn: "var(--amber-500)" };
    el.innerHTML = DB.activity.slice(0, 6).map(function (a, i, arr) {
      return '<li><span class="frail"><span class="fdot" style="background:' + col[a.kind] + '"></span>' + (i < arr.length - 1 ? '<span class="fline"></span>' : "") + '</span><div class="fbody">' + esc(a.text) + '<div class="t-12">' + esc(a.when) + "</div></div></li>";
    }).join("");
  }
  $("qa-complaint").addEventListener("click", function () { navTo("student", "complaint"); });
  $("qa-leave").addEventListener("click", function () { navTo("student", "leave"); });

  /* ---- complaint form ---- */
  bindCount("cf-title", "cf-title-n"); bindCount("cf-desc", "cf-desc-n");
  var cfFiles = [];
  var drop = $("cf-drop"), fileIn = $("cf-file");
  drop.addEventListener("click", function () { fileIn.click(); });
  drop.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileIn.click(); } });
  ["dragover", "dragenter"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); }); });
  ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("over"); }); });
  drop.addEventListener("drop", function (e) { addFiles(e.dataTransfer.files); });
  fileIn.addEventListener("change", function () { addFiles(fileIn.files); fileIn.value = ""; });
  function addFiles(list) {
    Array.prototype.slice.call(list).forEach(function (f) {
      if (!/^image\/(png|jpeg)$/.test(f.type)) { toast("bad", "Unsupported file", f.name + " — only .png / .jpeg allowed."); return; }
      if (cfFiles.length >= 3) { toast("bad", "Limit reached", "Maximum 3 images per ticket."); return; }
      var rd = new FileReader();
      rd.onload = function () { cfFiles.push({ name: f.name, url: rd.result }); paintThumbs(); };
      rd.readAsDataURL(f);
    });
  }
  function paintThumbs() {
    $("cf-thumbs").innerHTML = cfFiles.map(function (f, i) {
      return '<div class="thumb"><img src="' + f.url + '" alt="' + esc(f.name) + '"><button type="button" data-i="' + i + '" aria-label="Remove image"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div>';
    }).join("");
    $("cf-thumbs").querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () { cfFiles.splice(+b.dataset.i, 1); paintThumbs(); });
    });
  }
  $("cf-cancel").addEventListener("click", function () { $("cform").reset(); cfFiles = []; paintThumbs(); navTo("student", "home"); });
  $("cform").addEventListener("submit", function (e) {
    e.preventDefault();
    var okCat = setInvalid($("cf-cat"), !$("cf-cat").value);
    var okT = setInvalid($("cf-title"), $("cf-title").value.trim().length < 5);
    var okD = setInvalid($("cf-desc"), $("cf-desc").value.trim().length < 15);
    if (!(okCat && okT && okD)) return;
    loadingThen($("cf-submit"), function () {
      var catKey = { "Plumbing": "Plumbing", "Electrical & Lighting": "Electrical", "Carpentry / Furniture": "Carpentry", "Internet Connectivity": "Internet", "Housekeeping": "Housekeeping", "Other": "Other" }[$("cf-cat").value];
      var id = "CM-2026-0" + (231 + DB.complaints.filter(function (x) { return x.id > "CM-2026-0230"; }).length);
      DB.complaints.unshift({ id: id, roll: ME.roll, category: catKey, urgency: "Medium", title: $("cf-title").value.trim(), desc: $("cf-desc").value.trim(), filedAt: new Date(), status: "OPEN", notes: "", assignee: "", images: cfFiles.length });
      feed("warn", "Complaint " + id + " (" + $("cf-title").value.trim() + ") submitted to maintenance queue.");
      $("cform").reset(); $("cf-title-n").textContent = "0"; $("cf-desc-n").textContent = "0"; cfFiles = []; paintThumbs();
      toast("ok", "Ticket " + id + " created", "INSERT INTO complaint … — the hostel admin dashboard has it now.");
      navTo("student", "home");
    });
  });
  ["cf-cat", "cf-title", "cf-desc"].forEach(function (id) {
    $(id).addEventListener("blur", function () {
      if (id === "cf-cat") setInvalid($(id), !$(id).value);
      if (id === "cf-title") setInvalid($(id), $(id).value.trim().length < 5);
      if (id === "cf-desc") setInvalid($(id), $(id).value.trim().length < 15);
    });
  });

  /* ---- leave form ---- */
  bindCount("lf-reason", "lf-reason-n");
  document.querySelectorAll("#lf-types label").forEach(function (lab) {
    lab.querySelector("input").addEventListener("change", function () {
      document.querySelectorAll("#lf-types label").forEach(function (l) { l.classList.remove("on"); });
      lab.classList.add("on");
    });
  });
  $("lform").addEventListener("submit", function (e) {
    e.preventDefault();
    var dep = $("lf-dep").value, ret = $("lf-ret").value;
    var ok1 = setInvalid($("lf-dep"), !dep);
    var ok2 = setInvalid($("lf-ret"), !ret || (dep && new Date(ret) <= new Date(dep)));
    var ok3 = setInvalid($("lf-dest"), $("lf-dest").value.trim().length < 3);
    var ok4 = setInvalid($("lf-reason"), $("lf-reason").value.trim().length < 20);
    var ok5 = setInvalid($("lf-consent"), !$("lf-consent").checked);
    var ok6 = setInvalid($("lf-phone"), !/^[0-9]{10}$/.test($("lf-phone").value.replace(/[\s-]/g, "")));
    if (!(ok1 && ok2 && ok3 && ok4 && ok5 && ok6)) return;
    loadingThen($("lf-submit"), function () {
      var id = "LV-2026-0" + (155 + DB.leaves.filter(function (l) { return l.id >= "LV-2026-0155"; }).length);
      DB.leaves.push({
        id: id, roll: ME.roll,
        type: document.querySelector('input[name="lf-type"]:checked').value,
        depart: new Date(dep), ret: new Date(ret), dest: $("lf-dest").value.trim(),
        reason: $("lf-reason").value.trim(), phone: $("lf-phone").value.trim(), status: "PENDING"
      });
      feed("info", "Leave " + id + " submitted — pending college authorization.");
      $("lform").reset(); $("lf-reason-n").textContent = "0";
      document.querySelectorAll("#lf-types label").forEach(function (l, i) { l.classList.toggle("on", i === 0); });
      toast("ok", "Application " + id + " submitted", "Now visible in the College authorization queue.");
      navTo("student", "home");
    });
  });

  /* ============================================================
     COLLEGE
     ============================================================ */
  function renderCollege() {
    var q = DB.leaves.filter(function (l) { return l.status === "PENDING"; });
    $("col-count").textContent = q.length + " pending review";
    if (!q.length) {
      $("col-queue").innerHTML = '<div class="card pad"><p class="t-13">Queue clear — no applications awaiting authorization.</p></div>';
      $("col-doc").innerHTML = '<p class="t-13" style="padding:30px;text-align:center">Nothing selected.</p>';
      return;
    }
    if (!state.colSel || !q.some(function (l) { return l.id === state.colSel; })) state.colSel = q[0].id;
    $("col-queue").innerHTML = q.map(function (l) {
      var st = student(l.roll);
      return '<div class="card qcard' + (l.id === state.colSel ? " on" : "") + '" data-id="' + l.id + '" role="button" tabindex="0">' +
        '<div style="display:flex;gap:10px;align-items:center"><span class="avatar">' + initials(st.name) + '</span><div class="stack" style="flex:1;min-width:0"><b>' + esc(st.name) + "</b><span>" + st.dept + " · departs " + fmtD(l.depart) + '</span></div><span class="badge warn">Pending</span></div></div>';
    }).join("");
    $("col-queue").querySelectorAll(".qcard").forEach(function (c) {
      var go = function () { state.colSel = c.dataset.id; renderCollege(); };
      c.addEventListener("click", go);
      c.addEventListener("keydown", function (e) { if (e.key === "Enter") go(); });
    });
    var l = q.find(function (x) { return x.id === state.colSel; });
    var st = student(l.roll);
    $("col-doc").innerHTML =
      '<div style="display:flex;gap:12px;align-items:center;border-bottom:1px solid var(--border);padding-bottom:14px;margin-bottom:14px"><span class="avatar lg">' + initials(st.name) + '</span><div><h2 class="h-18">' + esc(st.name) + '</h2><p class="t-13 mono">' + st.roll + '</p></div><span class="mono t-13" style="margin-left:auto">' + l.id + "</span></div>" +
      '<dl class="doc-kv">' +
        "<dt>Department</dt><dd>" + st.dept + " · S3</dd>" +
        "<dt>Hostel room</dt><dd>" + (st.room || "—") + " · " + (st.block || "") + "</dd>" +
        "<dt>Leave type</dt><dd>" + l.type + "</dd>" +
        "<dt>Departure</dt><dd>" + fmtDT(l.depart) + "</dd>" +
        "<dt>Expected return</dt><dd>" + fmtDT(l.ret) + "</dd>" +
        "<dt>Destination</dt><dd>" + esc(l.dest) + "</dd>" +
        "<dt>Stated reason</dt><dd>" + esc(l.reason) + "</dd>" +
        '<dt>Emergency phone</dt><dd class="mono">' + l.phone + "</dd>" +
        "<dt>History</dt><dd>Leaves taken this semester: " + st.leaves + "</dd>" +
      "</dl>" +
      '<div class="verify" style="margin-top:14px"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg><span><b>Hostel status check:</b> room allocation confirmed (' + (st.room || "n/a") + "), attendance regular, no active disciplinary holds.</span></div>" +
      '<div class="tray"><button class="btn btn-rose" id="col-deny">Deny permission</button><button class="btn btn-emerald" id="col-approve"><span class="spin"></span>Approve &amp; issue gate pass</button></div>';
    $("col-approve").addEventListener("click", function () {
      loadingThen($("col-approve"), function () {
        l.status = "APPROVED"; l.token = "GP-2026-" + (4419 + Math.floor(Math.random() * 500));
        l.decidedBy = "Dean of Students";
        st.leaves++;
        toast("ok", "Gate pass " + l.token + " issued", "Authorization token shared with the Hostel Admin dashboard.");
        if (l.roll === ME.roll) feed("ok", "Leave " + l.id + " approved by College — gate pass " + l.token + " issued.");
        renderCollege(); renderSideNav();
      });
    });
    $("col-deny").addEventListener("click", function () {
      showPopover($("col-deny"),
        '<div class="field"><label for="deny-why" style="font-size:12.5px;font-weight:700">Reason for rejection</label><textarea class="control" id="deny-why" style="min-height:64px" placeholder="Required — sent to the student…"></textarea></div>' +
        '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:10px"><button class="btn btn-ghost btn-sm" id="deny-cancel">Cancel</button><button class="btn btn-rose btn-sm" id="deny-go" style="background:var(--rose-500);color:#fff;border-color:var(--rose-500)">Confirm denial</button></div>');
      $("deny-cancel").addEventListener("click", hidePopover);
      $("deny-go").addEventListener("click", function () {
        var why = $("deny-why").value.trim();
        if (why.length < 5) { setInvalid($("deny-why"), true); return; }
        l.status = "DENIED"; l.denyReason = why;
        hidePopover();
        toast("bad", "Permission denied", l.id + " — the student has been notified with your reason.");
        if (l.roll === ME.roll) feed("bad", "Leave " + l.id + " denied by College: “" + why + "”");
        renderCollege(); renderSideNav();
      });
    });
  }

  /* ============================================================
     BOOT
     ============================================================ */
  navTo("admin", "overview");
})();
