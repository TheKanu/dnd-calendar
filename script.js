class DNDCalendar {
    constructor() {
        this.currentDate = new Date();
        this.sessions = this.loadSessions();
        this.selectedDate = null;
        
        this.initializeElements();
        this.bindEvents();
        this.renderCalendar();
        this.renderUpcomingSessions();
    }

    initializeElements() {
        this.prevBtn = document.getElementById('prevMonth');
        this.nextBtn = document.getElementById('nextMonth');
        this.monthTitle = document.getElementById('currentMonth');
        this.calendarDays = document.getElementById('calendarDays');
        this.sessionForm = document.getElementById('sessionForm');
        this.sessionModal = document.getElementById('sessionModal');
        this.closeModal = document.getElementById('closeModal');
        this.modalContent = document.getElementById('modalContent');
        this.upcomingSessions = document.getElementById('upcomingSessions');
    }

    bindEvents() {
        this.prevBtn.addEventListener('click', () => this.previousMonth());
        this.nextBtn.addEventListener('click', () => this.nextMonth());
        this.sessionForm.addEventListener('submit', (e) => this.handleSessionSubmit(e));
        this.closeModal.addEventListener('click', () => this.hideModal());
        this.sessionModal.addEventListener('click', (e) => {
            if (e.target === this.sessionModal) this.hideModal();
        });
    }

    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendar();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendar();
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Update month title
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        this.monthTitle.textContent = `${monthNames[month]} ${year}`;

        // Clear calendar
        this.calendarDays.innerHTML = '';

        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();

        // Add empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'p-2';
            this.calendarDays.appendChild(emptyDay);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            const dateStr = this.formatDate(year, month, day);
            const sessionsForDay = this.getSessionsForDate(dateStr);
            
            dayElement.className = `p-2 min-h-[60px] border border-gray-600 rounded cursor-pointer hover:bg-gray-700 transition relative`;
            
            // Check if it's today
            if (today.getDate() === day && today.getMonth() === month && today.getFullYear() === year) {
                dayElement.classList.add('bg-dnd-gold', 'text-dnd-dark', 'font-bold');
            }

            // Add day number
            const dayNumber = document.createElement('div');
            dayNumber.className = 'font-semibold mb-1';
            dayNumber.textContent = day;
            dayElement.appendChild(dayNumber);

            // Add session indicators
            if (sessionsForDay.length > 0) {
                const sessionIndicator = document.createElement('div');
                sessionIndicator.className = 'absolute top-1 right-1 bg-dnd-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center';
                sessionIndicator.textContent = sessionsForDay.length;
                dayElement.appendChild(sessionIndicator);

                // Add session previews
                sessionsForDay.slice(0, 2).forEach(session => {
                    const sessionPreview = document.createElement('div');
                    sessionPreview.className = 'text-xs bg-dnd-red text-white rounded px-1 py-0.5 mb-1 truncate';
                    sessionPreview.textContent = session.name;
                    dayElement.appendChild(sessionPreview);
                });
            }

            dayElement.addEventListener('click', () => this.selectDate(dateStr, sessionsForDay));
            this.calendarDays.appendChild(dayElement);
        }
    }

    selectDate(dateStr, sessions) {
        this.selectedDate = dateStr;
        document.getElementById('sessionDate').value = dateStr;

        if (sessions.length > 0) {
            this.showSessionDetails(dateStr, sessions);
        }
    }

    showSessionDetails(dateStr, sessions) {
        const date = new Date(dateStr + 'T00:00:00');
        const formattedDate = date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        let content = `<h4 class="font-semibold mb-3 text-dnd-gold">${formattedDate}</h4>`;
        
        sessions.forEach((session, index) => {
            content += `
                <div class="mb-4 p-3 bg-gray-700 rounded">
                    <div class="flex justify-between items-start mb-2">
                        <h5 class="font-semibold text-white">${session.name}</h5>
                        <button onclick="calendar.deleteSession('${dateStr}', ${index})" 
                                class="text-red-400 hover:text-red-300 text-sm">Delete</button>
                    </div>
                    ${session.notes ? `<p class="text-gray-300 text-sm">${session.notes}</p>` : ''}
                </div>
            `;
        });

        this.modalContent.innerHTML = content;
        this.sessionModal.classList.remove('hidden');
        this.sessionModal.classList.add('flex');
    }

    hideModal() {
        this.sessionModal.classList.add('hidden');
        this.sessionModal.classList.remove('flex');
    }

    handleSessionSubmit(e) {
        e.preventDefault();
        
        const date = document.getElementById('sessionDate').value;
        const name = document.getElementById('sessionName').value;
        const notes = document.getElementById('sessionNotes').value;

        if (!date || !name) {
            alert('Please fill in date and session name');
            return;
        }

        this.addSession(date, name, notes);
        this.sessionForm.reset();
        this.renderCalendar();
        this.renderUpcomingSessions();
    }

    addSession(date, name, notes) {
        if (!this.sessions[date]) {
            this.sessions[date] = [];
        }
        
        this.sessions[date].push({
            name: name,
            notes: notes,
            createdAt: new Date().toISOString()
        });

        this.saveSessions();
    }

    deleteSession(date, index) {
        try {
            if (this.sessions[date] && this.sessions[date][index] !== undefined) {
                this.sessions[date].splice(index, 1);
                if (this.sessions[date].length === 0) {
                    delete this.sessions[date];
                }
                this.saveSessions();
                this.renderCalendar();
                this.renderUpcomingSessions();
                this.hideModal();
            }
        } catch (error) {
            console.error('Error deleting session:', error);
            alert('Fehler beim Löschen der Session');
        }
    }

    getSessionsForDate(date) {
        return this.sessions[date] || [];
    }

    renderUpcomingSessions() {
        const today = new Date();
        const upcomingSessions = [];

        // Get all future sessions
        Object.keys(this.sessions).forEach(date => {
            const sessionDate = new Date(date + 'T00:00:00');
            if (sessionDate >= today) {
                this.sessions[date].forEach(session => {
                    upcomingSessions.push({
                        date: date,
                        dateObj: sessionDate,
                        ...session
                    });
                });
            }
        });

        // Sort by date
        upcomingSessions.sort((a, b) => a.dateObj - b.dateObj);

        // Render
        if (upcomingSessions.length === 0) {
            this.upcomingSessions.innerHTML = '<p class="text-gray-400 text-sm">No upcoming sessions</p>';
            return;
        }

        this.upcomingSessions.innerHTML = upcomingSessions.slice(0, 5).map(session => {
            const formattedDate = session.dateObj.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            });
            return `
                <div class="p-3 bg-gray-700 rounded cursor-pointer hover:bg-gray-600 transition"
                     onclick="calendar.selectDate('${session.date}', calendar.getSessionsForDate('${session.date}'))">
                    <div class="flex justify-between items-start">
                        <div>
                            <div class="font-semibold text-white">${session.name}</div>
                            <div class="text-dnd-gold text-sm">${formattedDate}</div>
                        </div>
                    </div>
                    ${session.notes ? `<p class="text-gray-300 text-xs mt-1 truncate">${session.notes}</p>` : ''}
                </div>
            `;
        }).join('');
    }

    formatDate(year, month, day) {
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    loadSessions() {
        try {
            const stored = localStorage.getItem('dnd-calendar-sessions');
            if (!stored) return {};
            
            const parsed = JSON.parse(stored);
            
            // Validate data structure
            if (typeof parsed !== 'object' || parsed === null) {
                console.warn('Invalid sessions data, resetting...');
                localStorage.removeItem('dnd-calendar-sessions');
                return {};
            }
            
            return parsed;
        } catch (error) {
            console.error('Error loading sessions:', error);
            localStorage.removeItem('dnd-calendar-sessions');
            return {};
        }
    }

    saveSessions() {
        try {
            localStorage.setItem('dnd-calendar-sessions', JSON.stringify(this.sessions));
        } catch (error) {
            console.error('Error saving sessions:', error);
            alert('Fehler beim Speichern der Session-Daten');
        }
    }
}

// Initialize calendar when page loads
let calendar;
document.addEventListener('DOMContentLoaded', () => {
    calendar = new DNDCalendar();
});

// Make calendar globally accessible for modal actions
window.calendar = calendar;