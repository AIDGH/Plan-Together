// اضافه شدن کتابخونه‌های لاگین فایربیس
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAt078tZnmbzkgHPWXd6oG7siMTuEFGSt8",
  authDomain: "planner-eed1e.firebaseapp.com",
  projectId: "planner-eed1e",
  storageBucket: "planner-eed1e.firebasestorage.app",
  messagingSenderId: "301576214173",
  appId: "1:301576214173:web:9ae2de1a45ce69d5536674"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app); // راه‌اندازی سیستم لاگین

// === توابع تاریخ ===
const today = new Date();
const formatDate = (date) => {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1), day = '' + d.getDate(), year = d.getFullYear();
    if (month.length < 2) month = '0' + month; if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-'); 
};

const toFaDigits = (num) => num.toString().replace(/\d/g, x => String.fromCharCode(x.charCodeAt(0) + 1728));
const shamsiFormatter = new Intl.DateTimeFormat('en-US-u-ca-persian', { year: 'numeric', month: 'numeric', day: 'numeric' });
const getShamsiParts = (date) => {
    const p = shamsiFormatter.formatToParts(date);
    let y, m, d;
    p.forEach(part => {
        if (part.type === 'year') y = parseInt(part.value);
        if (part.type === 'month') m = parseInt(part.value);
        if (part.type === 'day') d = parseInt(part.value);
    });
    return { y, m, d };
};
// === کدهای نمایش/مخفی کردن پسورد ===
const togglePassBtn = document.getElementById('toggle-pass-btn');
const passInput = document.getElementById('login-pass');

// کدهای SVG برای چشم باز و چشم خط‌خورده
const eyeOpenSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>`;
const eyeClosedSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>`;

togglePassBtn.addEventListener('click', () => {
    // اگه رمز مخفیه، نشونش بده و آیکون رو خط‌دار کن
    if (passInput.type === 'password') {
        passInput.type = 'text';
        togglePassBtn.innerHTML = eyeClosedSVG;
    } 
    // اگه رمز مشخصه، دوباره مخفیش کن و آیکون رو برگردون
    else {
        passInput.type = 'password';
        togglePassBtn.innerHTML = eyeOpenSVG;
    }
});

const faMonthNames = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const enMonthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const finglishMonthNames = ["Farvardin", "Ordibehesht", "Khordad", "Tir", "Mordad", "Shahrivar", "Mehr", "Aban", "Azar", "Dey", "Bahman", "Esfand"];

const todayStr = formatDate(today);
const currentShamsi = getShamsiParts(today);

let startOfShamsiMonth = new Date(today);
while (getShamsiParts(startOfShamsiMonth).m === currentShamsi.m) { startOfShamsiMonth.setDate(startOfShamsiMonth.getDate() - 1); }
startOfShamsiMonth.setDate(startOfShamsiMonth.getDate() + 1); 

const shamsiDaysArr = [];
let currentDay = new Date(startOfShamsiMonth);
while (getShamsiParts(currentDay).m === currentShamsi.m) { shamsiDaysArr.push(new Date(currentDay)); currentDay.setDate(currentDay.getDate() + 1); }

const getStartOfWeek = (d) => {
    const date = new Date(d); const day = date.getDay() || 7; 
    if(day !== 1) date.setHours(-24 * (day - 1)); return date;
};
const startOfWeek = getStartOfWeek(today);
const currentWeekStr = formatDate(startOfWeek); 
const weekDaysArr = Array.from({length: 7}).map((_, i) => { const d = new Date(startOfWeek); d.setDate(d.getDate() + i); return d; });

let allTasks = [];
let activeMonthlyUser = 'arad'; 
let selectedMonthlyDate = todayStr; // پیش‌فرض روی امروزه
let unsubscribeFromDB = null; // متغیری برای قطع کردن اتصال دیتابیس وقتی خارج میشید

// === سیستم ورود و خروج ===
const loginScreen = document.getElementById('login-screen');
const appNav = document.getElementById('app-nav');
const appMain = document.getElementById('app-main');
const errorMsg = document.getElementById('login-error');

document.getElementById('login-btn').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    try {
        errorMsg.style.display = 'none';
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        errorMsg.style.display = 'block'; // ارور در صورت اشتباه بودن رمز
    }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
        // ۱. پاک کردن توکن و نشست از فایربیس
        await signOut(auth);
        
        // ۲. رفرش کردن اجباری کل صفحه برای پاک شدن کش و برگشتن قطعی به صفحه ورود
        window.location.reload(); 
    } catch (error) {
        console.error("ارور موقع خروج: ", error);
        alert("یه مشکلی تو خروج پیش اومد! 😟");
    }
});

// گوش دادن به وضعیت لاگین
onAuthStateChanged(auth, (user) => {
    if (user) {
        // لاگین شد! مخفی کردن صفحه ورود و نمایش پلنر
        loginScreen.classList.add('hidden-app');
        appNav.classList.remove('hidden-app');
        appMain.classList.remove('hidden-app');

        // وصل شدن به دیتابیس فقط در صورت لاگین بودن
        unsubscribeFromDB = onSnapshot(collection(db, "tasks"), (snapshot) => {
            allTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            allTasks.sort((a, b) => a.createdAt - b.createdAt);
            setupMonthlyUser();
            renderAll();
        });
    } else {
        // خارج شد! نمایش مجدد صفحه ورود
        loginScreen.classList.remove('hidden-app');
        appNav.classList.add('hidden-app');
        appMain.classList.add('hidden-app');
        
        // قطع اتصال از دیتابیس برای امنیت
        if (unsubscribeFromDB) unsubscribeFromDB();
    }
});

// نویگیشن تب‌ها
document.querySelectorAll('.nav-btn:not(#logout-btn)').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn:not(#logout-btn), .view-section').forEach(el => {
            el.classList.remove('active');
            if(el.classList.contains('view-section')) el.classList.add('hidden');
        });
        btn.classList.add('active');
        document.getElementById(btn.getAttribute('data-target')).classList.remove('hidden'); 
        document.getElementById(btn.getAttribute('data-target')).classList.add('active');
    });
});

async function saveTask(text, owner, type, dateString = null) {
    if (!text.trim()) return;
    await addDoc(collection(db, "tasks"), { text, owner, type, date: dateString, weekId: currentWeekStr, monthId: `${currentShamsi.y}-${currentShamsi.m}`, completed: false, createdAt: Date.now() });
}

function createItem(task) {
    const div = document.createElement('div');
    div.className = `task-item owner-${task.owner} ${task.completed ? 'completed' : ''}`;
    const delBtn = document.createElement('button'); delBtn.className = 'delete-btn'; delBtn.innerText = '-';
    const rightContent = document.createElement('div'); rightContent.className = 'task-content';
    rightContent.innerHTML = `<input type="checkbox" ${task.completed ? 'checked' : ''}> <label>${task.text}</label>`;
    
    div.appendChild(delBtn); div.appendChild(rightContent);

    rightContent.querySelector('input').addEventListener('change', async (e) => { await updateDoc(doc(db, "tasks", task.id), { completed: e.target.checked }); });
    delBtn.addEventListener('click', async () => { await deleteDoc(doc(db, "tasks", task.id)); });
    return div;
}

document.getElementById('arad-daily-btn').addEventListener('click', () => { saveTask(document.getElementById('arad-daily-input').value, 'arad', 'date', todayStr); document.getElementById('arad-daily-input').value = ''; });
document.getElementById('dorsa-daily-btn').addEventListener('click', () => { saveTask(document.getElementById('dorsa-daily-input').value, 'dorsa', 'date', todayStr); document.getElementById('dorsa-daily-input').value = ''; });
document.getElementById('w-f-arad').addEventListener('click', () => { saveTask(document.getElementById('weekly-float-input').value, 'arad', 'floating'); document.getElementById('weekly-float-input').value = ''; });
document.getElementById('w-f-dorsa').addEventListener('click', () => { saveTask(document.getElementById('weekly-float-input').value, 'dorsa', 'floating'); document.getElementById('weekly-float-input').value = ''; });
document.getElementById('m-b-arad').addEventListener('click', () => { saveTask(document.getElementById('monthly-backlog-input').value, 'arad', 'backlog'); document.getElementById('monthly-backlog-input').value = ''; });
document.getElementById('m-b-dorsa').addEventListener('click', () => { saveTask(document.getElementById('monthly-backlog-input').value, 'dorsa', 'backlog'); document.getElementById('monthly-backlog-input').value = ''; });

const mFilterArad = document.getElementById('filter-arad');
const mFilterDorsa = document.getElementById('filter-dorsa');
// تغییر فیلتر و تغییر رنگ دکمه سایدبار متناسب با آراد یا درسا
mFilterArad.addEventListener('click', () => { 
    activeMonthlyUser = 'arad'; 
    mFilterArad.className = "m-filter-btn active arad"; 
    mFilterDorsa.className = "m-filter-btn inactive"; 
    document.getElementById('m-global-btn').style.backgroundColor = '#38bdf8';
    document.getElementById('m-global-btn').innerText = 'Add to Arad';
    document.getElementById('m-selected-date-label').style.color = '#38bdf8';
    document.getElementById('calendar-grid').setAttribute('data-active', 'arad');
    renderMonthlyGrid(); 
});
mFilterDorsa.addEventListener('click', () => { 
    activeMonthlyUser = 'dorsa'; 
    mFilterDorsa.className = "m-filter-btn active dorsa"; 
    mFilterArad.className = "m-filter-btn inactive"; 
    document.getElementById('m-global-btn').style.backgroundColor = '#f472b6';
    document.getElementById('m-global-btn').innerText = 'Add to Dorsa';
    document.getElementById('m-selected-date-label').style.color = '#f472b6';
    document.getElementById('calendar-grid').setAttribute('data-active', 'dorsa');
    renderMonthlyGrid(); 
});

// عملکرد دکمه جدید تو سایدبار
document.getElementById('m-global-btn').addEventListener('click', () => {
    saveTask(document.getElementById('m-global-input').value, activeMonthlyUser, 'date', selectedMonthlyDate);
    document.getElementById('m-global-input').value = '';
});

function renderAll() { renderDaily(); renderWeekly(); renderMonthlyGrid(); renderMonthlyBacklog(); }

function renderDaily() {
    document.getElementById('daily-arad-title').innerText = `Arad's Day`;
    document.getElementById('daily-dorsa-title').innerText = `Dorsa's Day`;
    const aradList = document.getElementById('arad-daily-tasks'); const dorsaList = document.getElementById('dorsa-daily-tasks');
    aradList.innerHTML = ''; dorsaList.innerHTML = '';
    allTasks.filter(t => t.type === 'date' && t.date === todayStr).forEach(task => {
        if(task.owner === 'arad') aradList.appendChild(createItem(task));
        if(task.owner === 'dorsa') dorsaList.appendChild(createItem(task));
    });
}

function renderWeekly() {
    const grid = document.getElementById('weekly-grid'); const floatList = document.getElementById('weekly-floating-tasks');
    grid.innerHTML = ''; floatList.innerHTML = '';
    allTasks.filter(t => t.type === 'floating' && t.weekId === currentWeekStr).forEach(task => floatList.appendChild(createItem(task)));

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    weekDaysArr.forEach(d => {
        const dStr = formatDate(d); const isToday = dStr === todayStr; const p = getShamsiParts(d);
        const dayDiv = document.createElement('div'); dayDiv.className = `day-card ${isToday ? 'today-highlight' : ''}`;
        
        dayDiv.innerHTML = `
            <div class="day-card-header">
                <h4 style="margin:0;">${dayNames[d.getDay()]} (${p.d} ${finglishMonthNames[p.m - 1]}) ${isToday ? '🎯' : ''}</h4>
                <div class="small-input-group" style="margin:0; width: 60%;">
                    <input type="text" id="w-input-${dStr}" placeholder="Task..." dir="auto">
                    <button id="w-a-${dStr}" class="btn-a">A</button> <button id="w-d-${dStr}" class="btn-d">D</button>
                </div>
            </div>
            <div id="w-tasks-${dStr}" class="task-list"></div>
        `;
        grid.appendChild(dayDiv);
        dayDiv.querySelector(`#w-a-${dStr}`).addEventListener('click', () => saveTask(dayDiv.querySelector(`#w-input-${dStr}`).value, 'arad', 'date', dStr));
        dayDiv.querySelector(`#w-d-${dStr}`).addEventListener('click', () => saveTask(dayDiv.querySelector(`#w-input-${dStr}`).value, 'dorsa', 'date', dStr));
        allTasks.filter(t => t.type === 'date' && t.date === dStr).forEach(task => dayDiv.querySelector(`#w-tasks-${dStr}`).appendChild(createItem(task)));
    });
}

function renderMonthlyGrid() {
    const grid = document.getElementById('calendar-grid'); grid.innerHTML = '';
    const startM = shamsiDaysArr[0].getMonth(); const endM = shamsiDaysArr[shamsiDaysArr.length - 1].getMonth();
    const gMonthsStr = startM === endM ? enMonthNames[startM] : `${enMonthNames[startM]}-${enMonthNames[endM]}`;
    const startY = shamsiDaysArr[0].getFullYear(); const endY = shamsiDaysArr[shamsiDaysArr.length - 1].getFullYear();
    const gYearsStr = startY === endY ? startY : `${startY}-${endY}`;
    
    document.getElementById('monthly-title-text').innerText = `${currentShamsi.y} - ${gYearsStr}`;
    document.getElementById('monthly-subtitle-text').innerText = `${faMonthNames[currentShamsi.m - 1]} | ${gMonthsStr}`;

    const dayNames = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    dayNames.forEach(day => { const head = document.createElement('div'); head.className = 'weekday-header'; head.innerText = day; grid.appendChild(head); });

    const firstDayOfWeek = shamsiDaysArr[0].getDay(); const emptyDays = (firstDayOfWeek + 1) % 7;
    for (let i = 0; i < emptyDays; i++) { const empty = document.createElement('div'); empty.className = 'day-card empty-day'; grid.appendChild(empty); }

    shamsiDaysArr.forEach(d => {
        const dStr = formatDate(d); const isToday = dStr === todayStr;
        const shamsiNum = toFaDigits(getShamsiParts(d).d); const gregNum = d.getDate();
        const shamsiMonthName = faMonthNames[getShamsiParts(d).m - 1];
        
        const dayDiv = document.createElement('div'); 
        dayDiv.className = `day-card ${isToday ? 'today-highlight' : ''}`;
        
        // دیگه اینپوتی داخل کارت‌ها نیست! 😇
        dayDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; font-size: 1.15rem; font-weight: bold; margin-bottom: 12px; color: #475569;">
                <span>${gregNum}</span> <span style="font-family: 'Vazirmatn', sans-serif;">${shamsiNum}</span>
            </div>
            <div id="m-tasks-${dStr}" class="task-list"></div>
        `;
        grid.appendChild(dayDiv);
        
        // اگر این روز همون روزیه که انتخاب شده، استایلش رو اعمال کن و نوشته سایدبار رو آپدیت کن
        if (dStr === selectedMonthlyDate) {
            dayDiv.classList.add('selected-day-highlight');
            document.getElementById('m-selected-date-label').innerText = `${gregNum} ${enMonthNames[d.getMonth()]} | ${shamsiNum} ${shamsiMonthName}`;
        }

        // منطق کلیک کردن روی روز
        dayDiv.addEventListener('click', (e) => {
            // اگه روی خود تسک یا دکمه حذفش کلیک کرد، روز رو انتخاب نکن
            if (e.target.closest('.task-item')) return;
            
            // پاک کردن هاله از روی بقیه روزها
            document.querySelectorAll('.monthly-grid .day-card').forEach(c => c.classList.remove('selected-day-highlight'));
            // اضافه کردن هاله به روزی که الان کلیک شد
            dayDiv.classList.add('selected-day-highlight');
            selectedMonthlyDate = dStr;
            
            // آپدیت متن سایدبار
            document.getElementById('m-selected-date-label').innerText = `${gregNum} ${enMonthNames[d.getMonth()]} | ${shamsiNum} ${shamsiMonthName}`;
        });

        allTasks.filter(t => t.type === 'date' && t.date === dStr && t.owner === activeMonthlyUser).forEach(task => dayDiv.querySelector(`#m-tasks-${dStr}`).appendChild(createItem(task)));
    });
}

function renderMonthlyBacklog() {
    const list = document.getElementById('monthly-backlog-tasks'); list.innerHTML = '';
    allTasks.filter(t => (t.type === 'backlog' || t.type === 'floating') && t.monthId === `${currentShamsi.y}-${currentShamsi.m}`)
            .forEach(task => list.appendChild(createItem(task)));
}

const calendarContainer = document.getElementById('calendar-container');
const calendarGrid = document.getElementById('calendar-grid'); 
const mainGrid = document.querySelector('.main-grid'); 
let currentZoom = 0.8; 

calendarGrid.style.zoom = currentZoom;
mainGrid.style.setProperty('--z', currentZoom);

calendarContainer.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
        e.preventDefault(); 
        
        const zoomSpeed = 0.008;
        currentZoom -= e.deltaY * zoomSpeed;

        if (currentZoom < 0.55) currentZoom = 0.55;
        if (currentZoom > 1.5) currentZoom = 1.5;

        calendarGrid.style.zoom = currentZoom;
        mainGrid.style.setProperty('--z', currentZoom);

        // 🚨 مچ‌گیری از مرورگر: گرفتن ارتفاع نهایی بعد از محاسبه فرمول calc
        const computedMaxHeight = window.getComputedStyle(mainGrid).maxHeight;
        console.log("📏 ارتفاع نهایی کادر (max-height) الان شد:", computedMaxHeight, " | با زوم:", currentZoom.toFixed(2));
    }
}, { passive: false });

async function setupMonthlyUser() {
    try {
        // گرفتن اطلاعات کاربری که همین الان لاگین کرده از سوپابیس
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) throw error;

        // چک می‌کنیم یوزر وجود داشته باشه و ایمیلش دقیقاً همون باشه 😡
        if (user && user.email === 'zabeti.dors@gmail.com') {
            
            // آیدی دکمه درسا تو بخش ماهانه رو اینجا بذار (همون دکمه خاکستری)
            const dorsaBtn = document.getElementById('btn-dorsa'); 
            
            if (dorsaBtn) {
                dorsaBtn.click(); // تقویم با احترام می‌ره رو حالت درسا 🤭
                console.log("😇 خوش اومدی درسا! تقویم ماهانه برات تنظیم شد.");
            }
            activeMonthlyUser = 'dorsa'; 
            mFilterDorsa.className = "m-filter-btn active dorsa"; 
            mFilterArad.className = "m-filter-btn inactive"; 
            document.getElementById('m-global-btn').style.backgroundColor = '#ffa1d2ff';
            document.getElementById('m-global-btn').innerText = 'Add to Dorsa';
            document.getElementById('m-selected-date-label').style.color = '#ffa1d2ff';
            document.getElementById('calendar-grid').setAttribute('data-active', 'dorsa');
        }
    } catch (error) {
        console.error("خطا در خواندن اطلاعات کاربر:", error);
    }
}