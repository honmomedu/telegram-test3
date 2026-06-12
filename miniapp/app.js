// Initialize Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand(); // Expand to full height

// Apply Telegram theme classes if running inside Telegram
if (tg.colorScheme) {
    document.body.classList.add('tg-theme');
}

// Mock Data
const mockStudentData = {
    student_id: "KHS11004",
    student_name: "សុខ សុវណ្ណ",
    class_room: "ថ្នាក់ទី ១១-ក",
    attendance: {
        total_days: 90,
        present: 88,
        absent: 2
    },
    result: "ពិន្ទុសរុប: ៨៥.៥% | ចំណាត់ថ្នាក់: ៣",
    announcements: [
        "សេចក្តីជូនដំណឹងស្តីពីការឈប់សម្រាកបុណ្យអុំទូក",
        "កាលវិភាគប្រឡងឆមាសលើកទី១ នឹងចាប់ផ្តើមនៅសប្តាហ៍ក្រោយ",
        "សូមសិស្សានុសិស្សទាំងអស់បង់ថ្លៃសិក្សាសម្រាប់ខែថ្មី"
    ],
    subjects: [
        { name: "គណិតវិទ្យា", score: "៩៥", grade: "A" },
        { name: "រូបវិទ្យា", score: "៨៨", grade: "B" },
        { name: "គីមីវិទ្យា", score: "៨២", grade: "B" },
        { name: "អក្សរសាស្ត្រខ្មែរ", score: "៩០", grade: "A" },
        { name: "ភាសាអង់គ្លេស", score: "៧៥", grade: "C" }
    ]
};

// DOM Elements
const elements = {
    studentName: document.getElementById('studentName'),
    studentClass: document.getElementById('studentClass'),
    studentId: document.getElementById('studentId'),
    examScore: document.getElementById('examScore'),
    examDetail: document.getElementById('examDetail'),
    attendanceBar: document.getElementById('attendanceBar'),
    attendanceTotal: document.getElementById('attendanceTotal'),
    absenceTotal: document.getElementById('absenceTotal'),
    announcementList: document.getElementById('announcementList'),
    subjectList: document.getElementById('subjectList'),
    profileName: document.getElementById('profileName'),
    profileClass: document.getElementById('profileClass'),
    headerTitle: document.getElementById('headerTitle'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    navItems: document.querySelectorAll('.nav-item'),
    views: document.querySelectorAll('.view'),
    fabBtn: document.getElementById('fabBtn')
};

// Render Data
function renderData(data) {
    // Header
    elements.headerTitle.textContent = "វិទ្យាល័យសាលា";

    // Profile (Home View)
    elements.studentName.textContent = data.student_name;
    elements.studentClass.textContent = data.class_room;
    elements.studentId.textContent = data.student_id;

    // Profile (Profile View)
    elements.profileName.textContent = data.student_name;
    elements.profileClass.textContent = data.class_room;

    // Results (Home View)
    const resultParts = data.result.split('|');
    elements.examScore.textContent = resultParts[0] || data.result;
    elements.examDetail.textContent = resultParts[1] || "";

    // Attendance
    const { total_days, present, absent } = data.attendance;
    const attendancePercentage = (present / total_days) * 100;
    
    setTimeout(() => {
        elements.attendanceBar.style.width = `${attendancePercentage}%`;
    }, 300);
    
    elements.attendanceTotal.textContent = `${present} ថ្ងៃ`;
    elements.absenceTotal.textContent = `${absent} ថ្ងៃ`;

    // Announcements
    if (data.announcements && data.announcements.length > 0) {
        elements.announcementList.innerHTML = data.announcements.map(ann => `
            <div class="announcement-item">
                <p>${ann}</p>
            </div>
        `).join('');
    } else {
        elements.announcementList.innerHTML = '<p class="text-muted">មិនមានសេចក្តីជូនដំណឹងថ្មីៗទេ</p>';
    }

    // Subjects (Studies View)
    if (data.subjects && data.subjects.length > 0) {
        elements.subjectList.innerHTML = data.subjects.map(sub => `
            <div class="subject-item">
                <div class="subject-info">
                    <h4>${sub.name}</h4>
                    <p>និទ្ទេស: ${sub.grade}</p>
                </div>
                <div class="subject-score">${sub.score}</div>
            </div>
        `).join('');
    }
}

// Tab Switching Logic
function switchTab(targetViewId) {
    // Provide haptic feedback if running in Telegram
    if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }

    // Update Navigation Icons
    elements.navItems.forEach(item => {
        if (item.dataset.target === targetViewId) {
            item.classList.add('active');
            // Update header title based on active tab
            const tabName = item.querySelector('span').textContent;
            elements.headerTitle.textContent = tabName === 'ទំព័រដើម' ? 'វិទ្យាល័យសាលា' : tabName;
        } else {
            item.classList.remove('active');
        }
    });

    // Update Views
    elements.views.forEach(view => {
        if (view.id === targetViewId) {
            view.classList.add('active');
        } else {
            view.classList.remove('active');
        }
    });
}

// Event Listeners for Bottom Nav
elements.navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetViewId = item.dataset.target;
        if (targetViewId) {
            switchTab(targetViewId);
        }
    });
});

// Event Listener for FAB
if (elements.fabBtn) {
    elements.fabBtn.addEventListener('click', () => {
        if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
        
        tg.showConfirm("តើអ្នកចង់សួរសំណួរទៅកាន់ AI ជំនួយការសាលារៀនឬទេ?", (confirmed) => {
            if (confirmed) {
                // In a real app, this might open a chat modal or send a specific payload to the bot
                tg.sendData(JSON.stringify({ action: "open_ai_chat" }));
                tg.close();
            }
        });
    });
}

// Expose switchTab globally for inline onclick handlers
window.switchTab = switchTab;

// Simulate Loading and Init
setTimeout(() => {
    renderData(mockStudentData);
    elements.loadingOverlay.classList.add('hidden');
    tg.ready(); // Tell Telegram the app is ready
}, 800);
