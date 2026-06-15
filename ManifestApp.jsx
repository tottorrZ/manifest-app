import React, { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────
//  Manifest — แอพ Manifesting ส่วนตัว (mobile-first)
//  ฟีเจอร์: 369 Method · Vision Board · Affirmations · สถิติ+Streak
//  เก็บข้อมูลใน localStorage — ข้อมูลไม่หายแม้ปิดแท็บ
// ─────────────────────────────────────────────────────────

// ── localStorage hook — โหลดค่าเริ่มต้นจาก storage, บันทึกทุกครั้งที่เปลี่ยน ──
function usePersist(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const saved = window.localStorage.getItem("manifest_" + key);
      return saved !== null ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem("manifest_" + key, JSON.stringify(state));
    } catch {}
  }, [key, state]);
  return [state, setState];
}

const todayKey = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short" });

// ── Seed data ──────────────────────────────────────────────
const SEED_AFFIRMATIONS = [
  "ฉันสมควรได้รับสิ่งดีๆ ที่กำลังเดินทางมาหาฉัน",
  "ทุกวันฉันเข้าใกล้เป้าหมายมากขึ้น",
  "ฉันมีพลังในการสร้างชีวิตที่ฉันต้องการ",
  "ความอุดมสมบูรณ์ไหลเข้ามาในชีวิตฉันอย่างเป็นธรรมชาติ",
  "ฉันรู้สึกขอบคุณในทุกสิ่งที่ฉันมีอยู่ตอนนี้",
];

const SLOTS = [
  { key: "morning", label: "เช้า", count: 3, icon: "☀️" },
  { key: "afternoon", label: "บ่าย", count: 6, icon: "🌤️" },
  { key: "night", label: "ก่อนนอน", count: 9, icon: "🌙" },
];

export default function ManifestApp() {
  const [tab, setTab] = useState("home");

  // ── Global state — บันทึกใน localStorage อัตโนมัติ ──
  const [intention, setIntention] = usePersist(
    "intention",
    "ฉันใช้ชีวิตในแบบที่ฉันออกแบบเอง อย่างมั่งคั่งและมีความสุข"
  );
  const [affirmations, setAffirmations] = usePersist("affirmations", SEED_AFFIRMATIONS);
  const [visionItems, setVisionItems] = usePersist("visionItems", [
    { id: 1, emoji: "🏝️", title: "เที่ยวรอบโลก", note: "พักผ่อนริมทะเล" },
    { id: 2, emoji: "💰", title: "อิสรภาพทางการเงิน", note: "รายได้ passive" },
    { id: 3, emoji: "🏡", title: "บ้านในฝัน", note: "พื้นที่ของตัวเอง" },
  ]);

  // 369 logs: { 'YYYY-MM-DD': { morning: true/false, ... } }
  const [logs369, setLogs369] = usePersist("logs369", {});
  // วันที่ทำครบ (อย่างน้อย 1 ช่วง) สำหรับ streak
  const [completedDays, setCompletedDays] = usePersist("completedDays", []);

  // ── Derived: streak ──
  const streak = computeStreak(completedDays);

  function markSlotDone(dateKey, slotKey) {
    setLogs369((prev) => {
      const day = { ...(prev[dateKey] || {}) };
      day[slotKey] = !day[slotKey];
      const next = { ...prev, [dateKey]: day };
      // อัปเดต completedDays
      const anyDone = Object.values(day).some(Boolean);
      setCompletedDays((cd) => {
        const has = cd.includes(dateKey);
        if (anyDone && !has) return [...cd, dateKey].sort();
        if (!anyDone && has) return cd.filter((x) => x !== dateKey);
        return cd;
      });
      return next;
    });
  }

  return (
    <div style={styles.app}>
      <style>{globalCss}</style>

      {/* ── พื้นหลังบรรยากาศ ── */}
      <div style={styles.auroraWrap} aria-hidden>
        <div style={styles.aurora1} />
        <div style={styles.aurora2} />
      </div>

      <div style={styles.screen}>
        {tab === "home" && (
          <HomeView
            intention={intention}
            setIntention={setIntention}
            streak={streak}
            completedDays={completedDays}
            affirmations={affirmations}
            go={setTab}
          />
        )}
        {tab === "369" && (
          <Method369View
            logs={logs369}
            intention={intention}
            onToggle={markSlotDone}
          />
        )}
        {tab === "vision" && (
          <VisionBoardView items={visionItems} setItems={setVisionItems} />
        )}
        {tab === "affirm" && (
          <AffirmView list={affirmations} setList={setAffirmations} />
        )}
        {tab === "stats" && (
          <StatsView
            streak={streak}
            completedDays={completedDays}
            logs={logs369}
          />
        )}
      </div>

      <NavBar tab={tab} setTab={setTab} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  HOME
// ═══════════════════════════════════════════════════════════
function HomeView({ intention, setIntention, streak, completedDays, affirmations, go }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(intention);
  const affOfDay =
    affirmations[new Date().getDate() % affirmations.length] || "";

  const hour = new Date().getHours();
  const greet =
    hour < 12 ? "อรุณสวัสดิ์" : hour < 18 ? "สวัสดีตอนบ่าย" : "ราตรีสวัสดิ์";

  return (
    <div className="fade-in">
      <p style={styles.eyebrow}>{greet}</p>
      <h1 style={styles.h1}>วันนี้คุณ<br />กำลังสร้างอะไร?</h1>

      {/* Streak pill */}
      <div style={styles.streakRow}>
        <div style={styles.streakPill}>
          <span style={{ fontSize: 18 }}>🔥</span>
          <span style={styles.streakNum}>{streak}</span>
          <span style={styles.streakLbl}>วันต่อเนื่อง</span>
        </div>
        <div style={styles.streakPillGhost}>
          <span style={styles.streakNum}>{completedDays.length}</span>
          <span style={styles.streakLbl}>วันทั้งหมด</span>
        </div>
      </div>

      {/* Intention card */}
      <div style={styles.intentCard}>
        <div style={styles.intentHead}>
          <span style={styles.cardLabel}>เจตนาหลัก · INTENTION</span>
          <button
            style={styles.linkBtn}
            onClick={() => {
              if (editing) setIntention(draft);
              setEditing((e) => !e);
            }}
          >
            {editing ? "บันทึก" : "แก้ไข"}
          </button>
        </div>
        {editing ? (
          <textarea
            style={styles.intentInput}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            autoFocus
          />
        ) : (
          <p style={styles.intentText}>“{intention}”</p>
        )}
      </div>

      {/* Affirmation of the day */}
      <div style={styles.affDayCard} onClick={() => go("affirm")}>
        <span style={styles.cardLabel}>คำยืนยันประจำวัน</span>
        <p style={styles.affDayText}>{affOfDay}</p>
      </div>

      {/* Quick actions */}
      <div style={styles.quickGrid}>
        <QuickCard emoji="✍️" title="369 Method" sub="เขียน 3·6·9" onClick={() => go("369")} accent="#E8B4B8" />
        <QuickCard emoji="🌌" title="Vision Board" sub="ภาพความฝัน" onClick={() => go("vision")} accent="#A8C5C9" />
        <QuickCard emoji="💬" title="Affirmations" sub="คำยืนยัน" onClick={() => go("affirm")} accent="#D4C5A8" />
        <QuickCard emoji="📈" title="สถิติ" sub="ความคืบหน้า" onClick={() => go("stats")} accent="#C5B4D4" />
      </div>
    </div>
  );
}

function QuickCard({ emoji, title, sub, onClick, accent }) {
  return (
    <button style={{ ...styles.quickCard, borderColor: accent + "55" }} onClick={onClick} className="press">
      <span style={{ ...styles.quickGlow, background: accent }} />
      <span style={{ fontSize: 26 }}>{emoji}</span>
      <span style={styles.quickTitle}>{title}</span>
      <span style={styles.quickSub}>{sub}</span>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════
//  369 METHOD
// ═══════════════════════════════════════════════════════════
function Method369View({ logs, intention, onToggle }) {
  const tk = todayKey();
  const today = logs[tk] || {};
  const [active, setActive] = useState(null); // slot being written
  const [lines, setLines] = useState({}); // { slotKey: [..] }

  const doneCount = SLOTS.filter((s) => today[s.key]).length;

  return (
    <div className="fade-in">
      <p style={styles.eyebrow}>{fmtDate(tk)}</p>
      <h1 style={styles.h1}>369 Method</h1>
      <p style={styles.lead}>
        เขียนเจตนาของคุณ <b>3 ครั้ง</b>ตอนเช้า · <b>6 ครั้ง</b>ตอนบ่าย ·{" "}
        <b>9 ครั้ง</b>ก่อนนอน
      </p>

      <div style={styles.progressTrack}>
        <div style={{ ...styles.progressFill, width: `${(doneCount / 3) * 100}%` }} />
      </div>
      <p style={styles.progressTxt}>{doneCount}/3 ช่วงเสร็จแล้ววันนี้</p>

      {SLOTS.map((s) => {
        const done = !!today[s.key];
        const isOpen = active === s.key;
        const written = lines[s.key] || [];
        return (
          <div key={s.key} style={{ ...styles.slotCard, opacity: done ? 0.85 : 1 }}>
            <div style={styles.slotHead}>
              <div>
                <span style={styles.slotIcon}>{s.icon}</span>
                <span style={styles.slotLabel}>{s.label}</span>
                <span style={styles.slotCount}>เขียน {s.count} ครั้ง</span>
              </div>
              <button
                style={done ? styles.slotDoneBtn : styles.slotBtn}
                onClick={() => onToggle(tk, s.key)}
              >
                {done ? "✓ เสร็จ" : "ทำเครื่องหมาย"}
              </button>
            </div>

            <button
              style={styles.writeToggle}
              onClick={() => setActive(isOpen ? null : s.key)}
            >
              {isOpen ? "ซ่อนพื้นที่เขียน" : "เปิดพื้นที่เขียน ✍️"}
            </button>

            {isOpen && (
              <div className="fade-in">
                {Array.from({ length: s.count }).map((_, i) => (
                  <div key={i} style={styles.writeRow}>
                    <span style={styles.writeNum}>{i + 1}</span>
                    <input
                      style={styles.writeInput}
                      placeholder={intention}
                      value={written[i] || ""}
                      onChange={(e) => {
                        const arr = [...written];
                        arr[i] = e.target.value;
                        setLines((p) => ({ ...p, [s.key]: arr }));
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  VISION BOARD
// ═══════════════════════════════════════════════════════════
const EMOJI_BANK = ["🏝️","💰","🏡","🚗","💪","❤️","🎓","✈️","🌟","🧘","👑","🌈","💎","🎯","🌻"];

function VisionBoardView({ items, setItems }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ emoji: "🌟", title: "", note: "" });

  function add() {
    if (!form.title.trim()) return;
    setItems((p) => [...p, { ...form, id: Date.now() }]);
    setForm({ emoji: "🌟", title: "", note: "" });
    setAdding(false);
  }
  function remove(id) {
    setItems((p) => p.filter((x) => x.id !== id));
  }

  return (
    <div className="fade-in">
      <p style={styles.eyebrow}>จินตนาการให้ชัด</p>
      <h1 style={styles.h1}>Vision Board</h1>
      <p style={styles.lead}>รวบรวมภาพชีวิตที่คุณกำลังดึงดูดเข้ามา</p>

      <div style={styles.visionGrid}>
        {items.map((it) => (
          <div key={it.id} style={styles.visionCard} className="press">
            <button style={styles.visionDel} onClick={() => remove(it.id)}>×</button>
            <span style={styles.visionEmoji}>{it.emoji}</span>
            <span style={styles.visionTitle}>{it.title}</span>
            {it.note && <span style={styles.visionNote}>{it.note}</span>}
          </div>
        ))}
        <button style={styles.visionAdd} onClick={() => setAdding(true)}>
          <span style={{ fontSize: 30, opacity: 0.6 }}>＋</span>
          <span style={styles.visionAddTxt}>เพิ่มความฝัน</span>
        </button>
      </div>

      {adding && (
        <div style={styles.modalWrap} onClick={() => setAdding(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()} className="fade-in">
            <h3 style={styles.modalTitle}>ความฝันใหม่</h3>
            <div style={styles.emojiBank}>
              {EMOJI_BANK.map((e) => (
                <button
                  key={e}
                  style={{
                    ...styles.emojiPick,
                    ...(form.emoji === e ? styles.emojiPickOn : {}),
                  }}
                  onClick={() => setForm((f) => ({ ...f, emoji: e }))}
                >
                  {e}
                </button>
              ))}
            </div>
            <input
              style={styles.modalInput}
              placeholder="ฉันต้องการ..."
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              autoFocus
            />
            <input
              style={styles.modalInput}
              placeholder="รายละเอียด (ไม่บังคับ)"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            />
            <div style={styles.modalActions}>
              <button style={styles.modalCancel} onClick={() => setAdding(false)}>ยกเลิก</button>
              <button style={styles.modalSave} onClick={add}>เพิ่มลงบอร์ด</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  AFFIRMATIONS
// ═══════════════════════════════════════════════════════════
function AffirmView({ list, setList }) {
  const [idx, setIdx] = useState(0);
  const [newAff, setNewAff] = useState("");
  const [remindOn, setRemindOn] = useState(false);
  const [remindTime, setRemindTime] = useState("08:00");

  function add() {
    if (!newAff.trim()) return;
    setList((p) => [...p, newAff.trim()]);
    setNewAff("");
  }
  function remove(i) {
    setList((p) => p.filter((_, k) => k !== i));
    setIdx(0);
  }
  const next = () => setIdx((i) => (i + 1) % list.length);
  const prev = () => setIdx((i) => (i - 1 + list.length) % list.length);

  return (
    <div className="fade-in">
      <p style={styles.eyebrow}>พูดกับตัวเองด้วยความรัก</p>
      <h1 style={styles.h1}>Affirmations</h1>

      {/* Spotlight card (swipeable feel) */}
      {list.length > 0 && (
        <div style={styles.spotlight} key={idx}>
          <span style={styles.spotQuote}>“</span>
          <p style={styles.spotText} className="fade-in">{list[idx]}</p>
          <div style={styles.spotNav}>
            <button style={styles.spotArrow} onClick={prev}>‹</button>
            <span style={styles.spotDots}>
              {list.map((_, k) => (
                <span key={k} style={{ ...styles.dot, ...(k === idx ? styles.dotOn : {}) }} />
              ))}
            </span>
            <button style={styles.spotArrow} onClick={next}>›</button>
          </div>
        </div>
      )}

      {/* Reminder setting */}
      <div style={styles.reminderCard}>
        <div style={styles.reminderRow}>
          <div>
            <span style={styles.cardLabel}>การแจ้งเตือนประจำวัน</span>
            <p style={styles.reminderHint}>เตือนให้อ่านคำยืนยันทุกวัน</p>
          </div>
          <button
            style={{ ...styles.toggle, ...(remindOn ? styles.toggleOn : {}) }}
            onClick={() => setRemindOn((v) => !v)}
          >
            <span style={{ ...styles.knob, ...(remindOn ? styles.knobOn : {}) }} />
          </button>
        </div>
        {remindOn && (
          <div style={styles.timeRow} className="fade-in">
            <span style={{ fontSize: 13, color: "#7a6f63" }}>เวลา</span>
            <input
              type="time"
              value={remindTime}
              onChange={(e) => setRemindTime(e.target.value)}
              style={styles.timeInput}
            />
            <span style={styles.reminderNote}>* prototype — เชื่อม Push ใน Phase 2</span>
          </div>
        )}
      </div>

      {/* Add new */}
      <div style={styles.addAffRow}>
        <input
          style={styles.addAffInput}
          placeholder="เขียนคำยืนยันใหม่..."
          value={newAff}
          onChange={(e) => setNewAff(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button style={styles.addAffBtn} onClick={add}>เพิ่ม</button>
      </div>

      {/* List */}
      <div style={{ marginTop: 8 }}>
        {list.map((a, i) => (
          <div key={i} style={styles.affRow}>
            <span style={styles.affText}>{a}</span>
            <button style={styles.affDel} onClick={() => remove(i)}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  STATS
// ═══════════════════════════════════════════════════════════
function StatsView({ streak, completedDays, logs }) {
  // 7 วันล่าสุด
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const k = d.toISOString().slice(0, 10);
    const slots = logs[k] || {};
    const done = SLOTS.filter((s) => slots[s.key]).length;
    return { k, done, label: d.toLocaleDateString("th-TH", { weekday: "narrow" }) };
  });
  const max = 3;
  const best = computeBestStreak(completedDays);

  return (
    <div className="fade-in">
      <p style={styles.eyebrow}>ความสม่ำเสมอคือกุญแจ</p>
      <h1 style={styles.h1}>สถิติ</h1>

      <div style={styles.statRow}>
        <StatBox big={streak} label="ต่อเนื่องตอนนี้" suffix="วัน" hot />
        <StatBox big={best} label="สถิติสูงสุด" suffix="วัน" />
        <StatBox big={completedDays.length} label="รวมทั้งหมด" suffix="วัน" />
      </div>

      <div style={styles.chartCard}>
        <span style={styles.cardLabel}>7 วันล่าสุด · ช่วงที่ทำสำเร็จ</span>
        <div style={styles.chart}>
          {days.map((d) => (
            <div key={d.k} style={styles.barCol}>
              <div style={styles.barTrack}>
                <div
                  style={{
                    ...styles.bar,
                    height: `${(d.done / max) * 100}%`,
                    background: d.done > 0 ? "linear-gradient(180deg,#E8B4B8,#C5849b)" : "transparent",
                  }}
                />
              </div>
              <span style={styles.barLabel}>{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.insightCard}>
        <span style={{ fontSize: 22 }}>🌱</span>
        <p style={styles.insightText}>
          {streak === 0
            ? "เริ่มต้นวันนี้ — เขียน 369 ครั้งแรกของคุณ แล้ว streak จะเริ่มนับ"
            : streak < 3
            ? "เริ่มต้นได้ดีมาก! ความสม่ำเสมอกำลังก่อตัว รักษาโมเมนตัมไว้"
            : streak < 7
            ? "คุณกำลังสร้างนิสัยที่ทรงพลัง สมองเริ่มจดจำเป้าหมายของคุณแล้ว"
            : "น่าทึ่งมาก! ความมุ่งมั่นระดับนี้คือสิ่งที่เปลี่ยนชีวิตได้จริง 🔥"}
        </p>
      </div>
    </div>
  );
}

function StatBox({ big, label, suffix, hot }) {
  return (
    <div style={{ ...styles.statBox, ...(hot ? styles.statBoxHot : {}) }}>
      <span style={styles.statBig}>
        {big}
        <span style={styles.statSuffix}>{suffix}</span>
      </span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  NAV
// ═══════════════════════════════════════════════════════════
function NavBar({ tab, setTab }) {
  const items = [
    { k: "home", icon: "✦", label: "หน้าหลัก" },
    { k: "369", icon: "✍", label: "369" },
    { k: "vision", icon: "✧", label: "Vision" },
    { k: "affirm", icon: "❝", label: "คำยืนยัน" },
    { k: "stats", icon: "▲", label: "สถิติ" },
  ];
  return (
    <nav style={styles.nav}>
      {items.map((it) => (
        <button
          key={it.k}
          style={{ ...styles.navBtn, ...(tab === it.k ? styles.navBtnOn : {}) }}
          onClick={() => setTab(it.k)}
        >
          <span style={styles.navIcon}>{it.icon}</span>
          <span style={styles.navLabel}>{it.label}</span>
        </button>
      ))}
    </nav>
  );
}

// ── helpers ────────────────────────────────────────────────
function computeStreak(days) {
  if (!days.length) return 0;
  const set = new Set(days);
  let streak = 0;
  let d = new Date();
  // ถ้าวันนี้ยังไม่ทำ ให้เริ่มนับจากเมื่อวาน
  if (!set.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
  while (set.has(d.toISOString().slice(0, 10))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
function computeBestStreak(days) {
  if (!days.length) return 0;
  const sorted = [...new Set(days)].sort();
  let best = 1, cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    prev.setDate(prev.getDate() + 1);
    if (prev.toISOString().slice(0, 10) === sorted[i]) cur++;
    else cur = 1;
    best = Math.max(best, cur);
  }
  return best;
}

// ═══════════════════════════════════════════════════════════
//  STYLES — dawn / soft warm palette
// ═══════════════════════════════════════════════════════════
const C = {
  bg: "#FBF6F0",
  ink: "#3A332B",
  sub: "#8A7E70",
  rose: "#E8B4B8",
  roseD: "#C5849b",
  sand: "#D4C5A8",
  mist: "#A8C5C9",
  line: "#EBE1D6",
  card: "#FFFFFF",
};

const globalCss = `
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Sarabun:wght@300;400;500;600&display=swap');
body { margin: 0; }
.fade-in { animation: fadeIn .5s ease both; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.press:active { transform: scale(0.97); }
@keyframes float1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(20px,-30px) scale(1.1); } }
@keyframes float2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-25px,20px) scale(1.05); } }
input:focus, textarea:focus { outline: none; }
@media (prefers-reduced-motion: reduce) { *, .fade-in { animation: none !important; } }
::placeholder { color: #b8ac9d; }
`;

const styles = {
  app: {
    fontFamily: "'Sarabun', sans-serif",
    background: C.bg,
    color: C.ink,
    minHeight: "100vh",
    maxWidth: 440,
    margin: "0 auto",
    position: "relative",
    overflow: "hidden",
  },
  auroraWrap: { position: "fixed", inset: 0, maxWidth: 440, margin: "0 auto", pointerEvents: "none", zIndex: 0 },
  aurora1: { position: "absolute", top: -80, right: -60, width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle,#E8B4B8aa,transparent 70%)", filter: "blur(20px)", animation: "float1 14s ease-in-out infinite" },
  aurora2: { position: "absolute", top: 180, left: -80, width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle,#A8C5C988,transparent 70%)", filter: "blur(20px)", animation: "float2 16s ease-in-out infinite" },

  screen: { position: "relative", zIndex: 1, padding: "54px 22px 110px" },

  eyebrow: { fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: C.roseD, fontWeight: 600, margin: "0 0 6px" },
  h1: { fontFamily: "'Fraunces', serif", fontSize: 34, lineHeight: 1.12, fontWeight: 500, margin: "0 0 18px", letterSpacing: -0.5 },
  lead: { fontSize: 15, color: C.sub, lineHeight: 1.6, margin: "-8px 0 22px" },
  cardLabel: { fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: C.sub, fontWeight: 600 },

  // streak
  streakRow: { display: "flex", gap: 10, marginBottom: 20 },
  streakPill: { flex: 1, display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg,#fff,#FDEEEE)", border: `1px solid ${C.rose}55`, borderRadius: 18, padding: "12px 16px" },
  streakPillGhost: { flex: 1, display: "flex", alignItems: "center", gap: 8, background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: "12px 16px" },
  streakNum: { fontFamily: "'Fraunces',serif", fontSize: 24, fontWeight: 600 },
  streakLbl: { fontSize: 12, color: C.sub, lineHeight: 1.1 },

  // intention
  intentCard: { background: C.card, border: `1px solid ${C.line}`, borderRadius: 22, padding: 18, marginBottom: 14, boxShadow: "0 6px 24px #d9c5b022" },
  intentHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  intentText: { fontFamily: "'Fraunces',serif", fontSize: 19, lineHeight: 1.5, margin: 0, fontWeight: 400 },
  intentInput: { width: "100%", border: `1px solid ${C.rose}`, borderRadius: 12, padding: 12, fontFamily: "'Sarabun',sans-serif", fontSize: 16, resize: "none", color: C.ink, background: "#FFFCFA" },
  linkBtn: { background: "none", border: "none", color: C.roseD, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" },

  affDayCard: { background: "linear-gradient(135deg,#F4ECDF,#FBF3E8)", border: `1px solid ${C.sand}66`, borderRadius: 22, padding: 18, marginBottom: 20, cursor: "pointer" },
  affDayText: { fontFamily: "'Fraunces',serif", fontSize: 18, lineHeight: 1.5, margin: "8px 0 0", fontStyle: "italic" },

  // quick grid
  quickGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  quickCard: { position: "relative", overflow: "hidden", background: C.card, border: "1px solid", borderRadius: 20, padding: "18px 16px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3, cursor: "pointer", textAlign: "left", transition: "transform .15s", fontFamily: "inherit" },
  quickGlow: { position: "absolute", top: -30, right: -30, width: 70, height: 70, borderRadius: "50%", opacity: 0.18, filter: "blur(8px)" },
  quickTitle: { fontWeight: 600, fontSize: 16, marginTop: 6, color: C.ink },
  quickSub: { fontSize: 12.5, color: C.sub },

  // 369
  progressTrack: { height: 8, background: C.line, borderRadius: 99, overflow: "hidden", margin: "4px 0 6px" },
  progressFill: { height: "100%", background: "linear-gradient(90deg,#E8B4B8,#C5849b)", borderRadius: 99, transition: "width .4s ease" },
  progressTxt: { fontSize: 13, color: C.sub, margin: "0 0 18px" },
  slotCard: { background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, padding: 16, marginBottom: 12, boxShadow: "0 4px 16px #d9c5b018" },
  slotHead: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  slotIcon: { fontSize: 18, marginRight: 8 },
  slotLabel: { fontWeight: 600, fontSize: 17, marginRight: 8 },
  slotCount: { fontSize: 13, color: C.sub },
  slotBtn: { background: "#FDEEEE", border: `1px solid ${C.rose}`, color: C.roseD, borderRadius: 99, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  slotDoneBtn: { background: C.roseD, border: `1px solid ${C.roseD}`, color: "#fff", borderRadius: 99, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  writeToggle: { background: "none", border: "none", color: C.mist, fontWeight: 600, fontSize: 13.5, marginTop: 12, cursor: "pointer", fontFamily: "inherit", padding: 0, filter: "brightness(0.7)" },
  writeRow: { display: "flex", alignItems: "center", gap: 10, marginTop: 10 },
  writeNum: { width: 22, height: 22, borderRadius: "50%", background: C.line, color: C.sub, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  writeInput: { flex: 1, border: "none", borderBottom: `1px solid ${C.line}`, padding: "6px 2px", fontSize: 14.5, fontFamily: "inherit", color: C.ink, background: "transparent" },

  // vision
  visionGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  visionCard: { position: "relative", background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, padding: "22px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textAlign: "center", minHeight: 140, justifyContent: "center", boxShadow: "0 4px 16px #d9c5b018" },
  visionEmoji: { fontSize: 40 },
  visionTitle: { fontWeight: 600, fontSize: 15.5, lineHeight: 1.3 },
  visionNote: { fontSize: 12.5, color: C.sub },
  visionDel: { position: "absolute", top: 8, right: 10, background: "none", border: "none", color: "#cbbfb0", fontSize: 20, cursor: "pointer", lineHeight: 1 },
  visionAdd: { background: "transparent", border: `2px dashed ${C.sand}`, borderRadius: 20, minHeight: 140, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer", color: C.sub, fontFamily: "inherit" },
  visionAddTxt: { fontSize: 14, fontWeight: 500 },

  // modal
  modalWrap: { position: "fixed", inset: 0, background: "#3a332b66", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50, maxWidth: 440, margin: "0 auto" },
  modal: { width: "100%", background: C.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: "24px 22px 30px" },
  modalTitle: { fontFamily: "'Fraunces',serif", fontSize: 22, margin: "0 0 16px", fontWeight: 500 },
  emojiBank: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  emojiPick: { fontSize: 22, width: 42, height: 42, borderRadius: 12, border: `1px solid ${C.line}`, background: C.card, cursor: "pointer" },
  emojiPickOn: { border: `2px solid ${C.roseD}`, background: "#FDEEEE", transform: "scale(1.08)" },
  modalInput: { width: "100%", border: `1px solid ${C.line}`, borderRadius: 14, padding: 14, fontSize: 16, fontFamily: "inherit", marginBottom: 12, background: C.card, color: C.ink },
  modalActions: { display: "flex", gap: 10, marginTop: 6 },
  modalCancel: { flex: 1, background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14, fontWeight: 600, color: C.sub, cursor: "pointer", fontFamily: "inherit", fontSize: 15 },
  modalSave: { flex: 2, background: C.roseD, border: "none", borderRadius: 14, padding: 14, fontWeight: 600, color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 15 },

  // affirmations
  spotlight: { position: "relative", background: "linear-gradient(150deg,#fff,#FDEEEE 90%)", border: `1px solid ${C.rose}55`, borderRadius: 26, padding: "30px 22px 18px", marginBottom: 18, boxShadow: "0 8px 30px #e8b4b822", minHeight: 150, display: "flex", flexDirection: "column", justifyContent: "space-between" },
  spotQuote: { position: "absolute", top: 6, left: 16, fontFamily: "'Fraunces',serif", fontSize: 60, color: C.rose, opacity: 0.5, lineHeight: 1 },
  spotText: { fontFamily: "'Fraunces',serif", fontSize: 22, lineHeight: 1.45, fontWeight: 500, margin: "12px 0 18px", position: "relative" },
  spotNav: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  spotArrow: { background: "#fff", border: `1px solid ${C.line}`, borderRadius: "50%", width: 36, height: 36, fontSize: 20, color: C.roseD, cursor: "pointer", lineHeight: 1 },
  spotDots: { display: "flex", gap: 5 },
  dot: { width: 6, height: 6, borderRadius: "50%", background: C.line },
  dotOn: { background: C.roseD, width: 18, borderRadius: 99 },

  reminderCard: { background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, padding: 16, marginBottom: 16 },
  reminderRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  reminderHint: { fontSize: 12.5, color: C.sub, margin: "4px 0 0" },
  toggle: { width: 50, height: 30, borderRadius: 99, background: C.line, border: "none", position: "relative", cursor: "pointer", flexShrink: 0, transition: "background .25s" },
  toggleOn: { background: C.roseD },
  knob: { position: "absolute", top: 3, left: 3, width: 24, height: 24, borderRadius: "50%", background: "#fff", transition: "left .25s", boxShadow: "0 2px 4px #00000022" },
  knobOn: { left: 23 },
  timeRow: { display: "flex", alignItems: "center", gap: 10, marginTop: 14, flexWrap: "wrap" },
  timeInput: { border: `1px solid ${C.line}`, borderRadius: 10, padding: "6px 10px", fontFamily: "inherit", fontSize: 15, color: C.ink },
  reminderNote: { fontSize: 11, color: "#b8ac9d" },

  addAffRow: { display: "flex", gap: 8, marginBottom: 6 },
  addAffInput: { flex: 1, border: `1px solid ${C.line}`, borderRadius: 14, padding: "12px 14px", fontSize: 15, fontFamily: "inherit", background: C.card, color: C.ink },
  addAffBtn: { background: C.ink, color: "#fff", border: "none", borderRadius: 14, padding: "0 20px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: 15 },
  affRow: { display: "flex", justifyContent: "space-between", alignItems: "center", background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "12px 14px", marginTop: 8 },
  affText: { fontSize: 14.5, lineHeight: 1.4, paddingRight: 10 },
  affDel: { background: "none", border: "none", color: "#cbbfb0", fontSize: 20, cursor: "pointer", flexShrink: 0, lineHeight: 1 },

  // stats
  statRow: { display: "flex", gap: 10, marginBottom: 16 },
  statBox: { flex: 1, background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: "16px 10px", textAlign: "center" },
  statBoxHot: { background: "linear-gradient(150deg,#fff,#FDEEEE)", border: `1px solid ${C.rose}66` },
  statBig: { fontFamily: "'Fraunces',serif", fontSize: 30, fontWeight: 600, display: "block", lineHeight: 1 },
  statSuffix: { fontSize: 12, fontWeight: 400, color: C.sub, marginLeft: 2 },
  statLabel: { fontSize: 11.5, color: C.sub, marginTop: 6, display: "block" },

  chartCard: { background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, padding: 18, marginBottom: 16 },
  chart: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", height: 120, marginTop: 16, gap: 6 },
  barCol: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, height: "100%" },
  barTrack: { flex: 1, width: 22, background: C.bg, borderRadius: 8, display: "flex", alignItems: "flex-end", overflow: "hidden" },
  bar: { width: "100%", borderRadius: 8, transition: "height .5s ease", minHeight: 0 },
  barLabel: { fontSize: 11, color: C.sub },

  insightCard: { display: "flex", gap: 12, alignItems: "flex-start", background: "linear-gradient(135deg,#EEF3F0,#F4F0E8)", border: `1px solid ${C.mist}44`, borderRadius: 20, padding: 18 },
  insightText: { fontSize: 14.5, lineHeight: 1.6, margin: 0, color: C.ink },

  // nav
  nav: { position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 440, margin: "0 auto", background: "#FFFFFFf2", backdropFilter: "blur(16px)", borderTop: `1px solid ${C.line}`, display: "flex", justifyContent: "space-around", padding: "10px 6px 16px", zIndex: 40 },
  navBtn: { background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", color: "#b8ac9d", fontFamily: "inherit", flex: 1, padding: "4px 0" },
  navBtnOn: { color: C.roseD },
  navIcon: { fontSize: 18, lineHeight: 1 },
  navLabel: { fontSize: 10.5, fontWeight: 500 },
};
