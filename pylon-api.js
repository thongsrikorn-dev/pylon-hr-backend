// ===================================================================
// PYLON HR - API CLIENT
// ไฟล์นี้แทนที่ localStorage ด้วย API calls
// วาง <script src="pylon-api.js"></script> ก่อน </body> ใน HTML เดิม
// แล้วเปลี่ยน PYLON_API_URL ให้ตรงกับ URL ของ Backend คุณ
// ===================================================================

const PYLON_API_URL = 'https://YOUR-APP-NAME.railway.app'; // ← เปลี่ยนตรงนี้หลัง deploy

// ─── Token management ───────────────────────────────────────────────
let _apiToken = sessionStorage.getItem('pylonToken') || null;

function setToken(t) { _apiToken = t; sessionStorage.setItem('pylonToken', t); }
function clearToken() { _apiToken = null; sessionStorage.removeItem('pylonToken'); }

function apiHeaders() {
  const h = { 'Content-Type': 'application/json' };
  if (_apiToken) h['Authorization'] = 'Bearer ' + _apiToken;
  return h;
}

async function apiCall(method, path, body) {
  const opts = { method, headers: apiHeaders() };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(PYLON_API_URL + path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ─── Override doLogin ────────────────────────────────────────────────
const _origDoLogin = window.doLogin;
window.doLogin = async function() {
  const u = document.getElementById('loginUser').value.trim();
  const p = document.getElementById('loginPass').value;
  const err = document.getElementById('loginErr');
  const btn = document.querySelector('.login-submit');
  err.style.display = 'none';
  if (!u || !p) { err.style.display='block'; err.textContent='กรุณาใส่ข้อมูล'; return; }
  if (btn) { btn.textContent = '⏳ กำลังเข้าสู่ระบบ...'; btn.disabled = true; }

  try {
    const data = await apiCall('POST', '/api/auth/login', {
      username: u, password: p, role: window.selRoleVal || 'admin'
    });
    setToken(data.token);
    const user = data.user;

    // สร้าง SESSION เหมือนเดิม
    window.SESSION = {
      username: user.username,
      role: user.effectiveRole,
      name: user.name,
      empIds: user.evalEmpIds || '*',
      empId: user.empId || user.username,
      isAdmin: user.isAdmin,
      isDual: user.isDualExec,
      execScope: user.execScope,
      dualEvalIds: user.isDualExec ? (user.evalEmpIds || []) : [],
      readOnly: false,
    };

    // โหลดข้อมูลจาก API แทน localStorage
    await pylonLoadFromAPI();

    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appScreen').style.display = 'flex';
    document.getElementById('topRoleChip').textContent = getRoleLabel(user.effectiveRole);
    buildNav();

    // แสดง dashboard
    if (user.effectiveRole === 'employee') showEmpDropdown && showEmpDropdown();
    else showDashboard && showDashboard();

  } catch (e) {
    err.style.display = 'block';
    err.textContent = e.message || 'เข้าสู่ระบบไม่สำเร็จ';
  } finally {
    if (btn) { btn.textContent = 'เข้าสู่ระบบ'; btn.disabled = false; }
  }
};

// ─── โหลดข้อมูลจาก API ──────────────────────────────────────────────
async function pylonLoadFromAPI() {
  try {
    // โหลดพนักงาน (แทนที่ EMPLOYEES)
    const emps = await apiCall('GET', '/api/employees');
    window.EMPLOYEES = emps.map(e => ({
      id: e.id, prefix: e.prefix, fname: e.fname, lname: e.lname,
      dept: e.dept, pos: e.position, start: e.start_date, grp: e.grp
    }));

    // อัปเดต EMP_BDAYS จาก bday field
    emps.forEach(e => { if (e.bday) EMP_BDAYS[e.id] = e.bday; });

    // โหลดผลประเมินทั้งหมด
    const evals = await apiCall('GET', '/api/evaluations');
    window.HIST = {};
    evals.forEach(ev => {
      if (!HIST[ev.employee_id]) HIST[ev.employee_id] = [];
      const scores = typeof ev.scores === 'string' ? JSON.parse(ev.scores) : (ev.scores || {});
      HIST[ev.employee_id].push({
        _apiId: ev.id,
        type: ev.eval_type,
        period: ev.period,
        scores: scores,
        totalScore: ev.total_score,
        grade: ev.grade ? { g: ev.grade, n: ev.grade } : getGrade(parseFloat(ev.total_score||0)),
        comments: ev.comments,
        savedAt: ev.created_at,
        evaluatorName: ev.evaluator_name,
      });
    });

    console.log(`✅ โหลดข้อมูล: พนักงาน ${window.EMPLOYEES.length} คน, ประเมิน ${evals.length} รายการ`);
  } catch (e) {
    console.error('pylonLoadFromAPI error:', e);
    // Fallback: ใช้ข้อมูลที่มีใน HTML เดิม
    console.warn('⚠️ ใช้ข้อมูล offline แทน');
  }
}

// ─── Override pylonSave → บันทึกลง API ────────────────────────────────
window.pylonSave = function() {
  // ไม่ทำอะไร - บันทึกเมื่อกด save จริงๆ ผ่าน saveProbEval/saveAnnualEval/saveSiteEval
  console.log('pylonSave: ข้ามเพราะใช้ API แทน');
};

window.pylonLoad = function() {
  // ไม่ทำอะไร - โหลดแล้วใน doLogin
  return true;
};

window.saveUsers = function() { /* ไม่ทำอะไร */ };
window.saveHist = function() { /* ไม่ทำอะไร */ };
window.saveBdays = function() { /* ไม่ทำอะไร */ };

// ─── Override ฟังก์ชัน Save Evaluation ──────────────────────────────
// ดักจับการบันทึกทุกประเภท
const _origSetProbScore = window.setProbScore;
const _origSetAnnScore = window.setAnnScore;
const _origSetSiteScore = window.setAnnScore;

// บันทึก evaluation ไปที่ API
async function saveEvalToAPI(empId, evalType, scores, totalScore, grade, comments) {
  try {
    const period = new Date().getFullYear().toString();
    await apiCall('POST', '/api/evaluations', {
      employee_id: empId,
      eval_type: evalType,
      period,
      scores,
      total_score: totalScore,
      grade: grade?.g || grade,
      comments: comments || '',
    });
    console.log(`✅ บันทึก ${evalType} สำหรับ ${empId} สำเร็จ`);
  } catch (e) {
    console.error('saveEvalToAPI error:', e);
    alert('❌ บันทึกไม่สำเร็จ: ' + e.message);
  }
}

// ─── Intercept การบันทึกประเมิน ─────────────────────────────────────
// Override ฟังก์ชัน setProbScore, setAnnScore, setSiteScore
// โดยดักจับหลังจากที่โค้ดเดิมรันแล้ว
(function interceptSaveButtons() {
  // รอให้โค้ดเดิมโหลดเสร็จ
  setTimeout(() => {
    // Intercept ปุ่มบันทึกใน UI
    document.addEventListener('click', async function(e) {
      const btn = e.target;
      const text = btn.textContent || '';
      
      // ตรวจหาปุ่มบันทึกผลประเมิน
      if (btn.matches('button') && (text.includes('บันทึก') || text.includes('Save')) 
          && !btn.matches('.login-submit')) {
        // รอให้ HIST อัปเดตจากโค้ดเดิมก่อน
        setTimeout(async () => {
          if (!window.CUR_EMP || !window.SESSION) return;
          const empId = CUR_EMP.id;
          const hist = HIST[empId];
          if (!hist || hist.length === 0) return;
          
          // เอา record ล่าสุด
          const latest = hist[hist.length - 1];
          if (latest._apiId) return; // บันทึกแล้ว
          
          await saveEvalToAPI(
            empId, latest.type || 'annual',
            latest.scores || SCORES,
            latest.totalScore,
            latest.grade,
            latest.comments
          );
          // ทำ mark ว่าบันทึกแล้ว
          latest._apiSaved = true;
        }, 200);
      }
    });
  }, 1000);
})();

// ─── Override logout ──────────────────────────────────────────────────
const _origLogout = window.logout;
window.logout = function() {
  clearToken();
  window.SESSION = null;
  window.HIST = {};
  if (_origLogout) _origLogout();
  else location.reload();
};

// ─── Auto-load ถ้ามี token อยู่แล้ว (refresh page) ──────────────────
window.addEventListener('DOMContentLoaded', async () => {
  if (_apiToken) {
    try {
      // ตรวจว่า token ยังใช้ได้
      const data = await apiCall('GET', '/api/auth/me');
      // ถ้าใช้ได้ให้โหลดข้อมูล (แต่ยังต้อง login ใหม่เพราะ SESSION ว่าง)
      console.log('Token ยังใช้ได้:', data.user?.name);
    } catch {
      clearToken();
    }
  }
  
  // Override pylonLoad ที่ถูกเรียกใน HTML เดิม
  const origInit = window.pylonLoad;
  window.pylonLoad = function() { return true; };
});

console.log('🔗 Pylon API Client loaded. Backend:', PYLON_API_URL);
