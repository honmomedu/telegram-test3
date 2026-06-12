// Initialize Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand(); // Expand to full height

// Apply Telegram theme classes if running inside Telegram
if (tg.colorScheme) {
    document.body.classList.add('tg-theme');
}

// Mock Data (In a real app, this would be fetched from Supabase via an API)
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
        "កាលវិភាគប្រឡងឆមាសលើកទី១ នឹងចាប់ផ្តើមនៅសប្តាហ៍ក្រោយ"
    ]
};

// DOM Elements
const elStudentName = document.getElementById('studentName');
const elStudentClass = document.getElementById('studentClass');
const elStudentId = document.getElementById('studentId');
const elExamScore = document.getElementById('examScore');
const elExamDetail = document.getElementById('examDetail');
const elAttendanceBar = document.getElementById('attendanceBar');
const elAttendanceTotal = document.getElementById('attendanceTotal');
const elAbsenceTotal = document.getElementById('absenceTotal');
const elAnnouncementList = document.getElementById('announcementList');
const loadingOverlay = document.getElementById('loadingOverlay');

// Render Data
function renderData(data) {
    // Profile
    elStudentName.textContent = data.student_name;
    elStudentClass.textContent = data.class_room;
    elStudentId.textContent = data.student_id;

    // Results
    const resultParts = data.result.split('|');
    elExamScore.textContent = resultParts[0] || data.result;
    elExamDetail.textContent = resultParts[1] || "";

    // Attendance
    const { total_days, present, absent } = data.attendance;
    const attendancePercentage = (present / total_days) * 100;
    
    setTimeout(() => {
        elAttendanceBar.style.width = `${attendancePercentage}%`;
    }, 300); // Small delay for animation effect
    
    elAttendanceTotal.textContent = `${present} ថ្ងៃ`;
    elAbsenceTotal.textContent = `${absent} ថ្ងៃ`;

    // Announcements
    if (data.announcements && data.announcements.length > 0) {
        elAnnouncementList.innerHTML = data.announcements.map(ann => `
            <div class="announcement-item">
                <p>${ann}</p>
            </div>
        `).join('');
    } else {
        elAnnouncementList.innerHTML = '<p class="text-muted">មិនមានសេចក្តីជូនដំណឹងថ្មីៗទេ</p>';
    }
}

// Button Action
window.viewDetailedResults = function() {
    tg.HapticFeedback.impactOccurred('light');
    tg.showAlert("មុខងារនេះនឹងអនុញ្ញាតឱ្យមើលពិន្ទុលម្អិតតាមមុខវិជ្ជា។ (កំពុងអភិវឌ្ឍន៍)");
};

// Simulate Loading
setTimeout(() => {
    renderData(mockStudentData);
    loadingOverlay.classList.add('hidden');
    tg.ready(); // Tell Telegram the app is ready
}, 1000);
