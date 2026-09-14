function getToken() {
    return localStorage.getItem('token');
}

function apiHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + getToken()
    };
}

function showAlert(containerId, message, type) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '<div class="alert alert-' + type + '">' + message + '</div>';
    setTimeout(() => { container.innerHTML = ''; }, 3000);
}

function loadAvailableClasses() {
    return fetch('/api/students/classes', { headers: apiHeaders() })
    .then(res => res.json())
    .then(classes => {
        if (!Array.isArray(classes)) return;

        const dl = document.getElementById('classes-datalist');
        if (dl) {
            dl.innerHTML = classes.map(c => '<option value="' + c + '"></option>').join('');
        }

        const updateSelect = (id, defaultLabel, defaultVal) => {
            const el = document.getElementById(id);
            if (!el) return;
            const currentVal = el.value;
            let options = '<option value="' + (defaultVal !== undefined ? defaultVal : '') + '">' + defaultLabel + '</option>';
            classes.forEach(c => {
                options += '<option value="' + c + '">' + c + '</option>';
            });
            el.innerHTML = options;
            if (currentVal && classes.includes(currentVal)) {
                el.value = currentVal;
            }
        };

        updateSelect('manage-class-select', 'All Classes', '');
        updateSelect('upgrade-class-select', 'Select Class', '');
        updateSelect('fees-class-select', 'Select Class', '');
        updateSelect('view-datesheet-class', 'Select Class', '');
        updateSelect('view-result-class', 'Select Class', '');
    })
    .catch(err => console.error('Error loading classes:', err));
}

document.addEventListener('DOMContentLoaded', function() {
    if (getToken()) {
        showDashboard();
    }

    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
        const sw = document.getElementById('theme-switch');
        if (sw) sw.classList.add('active');
    }

    if (localStorage.getItem('sidebar-collapsed') === 'true') {
        document.body.classList.add('sidebar-collapsed');
    }

    // Login form
    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const user = document.getElementById('login-username').value;
        const pass = document.getElementById('login-password').value;

        fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        })
        .then(res => res.json())
        .then(data => {
            if (data.token) {
                localStorage.setItem('token', data.token);
                showDashboard();
            } else {
                document.getElementById('login-error').style.display = 'block';
                document.getElementById('login-error').innerText = data.error || 'Invalid credentials';
            }
        })
        .catch(() => {
            document.getElementById('login-error').style.display = 'block';
            document.getElementById('login-error').innerText = 'Login failed. Please try again.';
        });
    });

    // Add Student form
    document.getElementById('add-student-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const data = {
            name: document.getElementById('student-name').value,
            rollNo: document.getElementById('student-roll').value,
            dob: document.getElementById('student-dob').value,
            registrationDate: document.getElementById('student-regdate').value,
            address: document.getElementById('student-address').value,
            parentContact: document.getElementById('student-parent').value,
            className: document.getElementById('student-class').value,
            isHostler: document.querySelector('input[name="student-hostler"]:checked')?.value === 'yes'
        };
        fetch('/api/students', {
            method: 'POST',
            headers: apiHeaders(),
            body: JSON.stringify(data)
        }).then(res => res.json()).then(res => {
            if (res.error) {
                showAlert('student-alert', res.error, 'error');
            } else {
                showAlert('student-alert', 'Student added successfully!', 'success');
                e.target.reset();
                const defaultHostlerNo = document.getElementById('student-hostler-no');
                if (defaultHostlerNo) defaultHostlerNo.checked = true;
                loadAvailableClasses();
            }
        }).catch(err => showAlert('student-alert', 'Error adding student', 'error'));
    });

    // Edit Student form
    document.getElementById('edit-student-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const id = document.getElementById('edit-student-id').value;
        const data = {
            name: document.getElementById('edit-student-name').value,
            rollNo: document.getElementById('edit-student-roll').value,
            dob: document.getElementById('edit-student-dob').value,
            registrationDate: document.getElementById('edit-student-regdate').value,
            address: document.getElementById('edit-student-address').value,
            parentContact: document.getElementById('edit-student-parent').value,
            className: document.getElementById('edit-student-class').value,
            isHostler: document.querySelector('input[name="edit-student-hostler"]:checked')?.value === 'yes'
        };
        fetch('/api/students/' + id, {
            method: 'PUT',
            headers: apiHeaders(),
            body: JSON.stringify(data)
        }).then(res => res.json()).then(() => {
            closeEditStudentModal();
            showAlert('student-alert', 'Student updated successfully!', 'success');
            loadStudentsByClass();
            loadAvailableClasses();
        }).catch(err => showAlert('student-alert', 'Error updating student', 'error'));
    });

    // Add Teacher form
    document.getElementById('add-teacher-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const data = {
            name: document.getElementById('teacher-name').value,
            gender: document.getElementById('teacher-gender').value,
            dob: document.getElementById('teacher-dob').value,
            registrationDate: document.getElementById('teacher-regdate').value,
            address: document.getElementById('teacher-address').value
        };
        fetch('/api/teachers', {
            method: 'POST',
            headers: apiHeaders(),
            body: JSON.stringify(data)
        }).then(res => res.json()).then(res => {
            if (res.error) {
                showAlert('teacher-alert', res.error, 'error');
            } else {
                showAlert('teacher-alert', 'Teacher added successfully!', 'success');
                e.target.reset();
            }
        }).catch(err => showAlert('teacher-alert', 'Error adding teacher', 'error'));
    });

    // Edit Teacher form
    document.getElementById('edit-teacher-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const id = document.getElementById('edit-teacher-id').value;
        const data = {
            name: document.getElementById('edit-teacher-name').value,
            gender: document.getElementById('edit-teacher-gender').value,
            dob: document.getElementById('edit-teacher-dob').value,
            registrationDate: document.getElementById('edit-teacher-regdate').value,
            address: document.getElementById('edit-teacher-address').value,
            subject: document.getElementById('edit-teacher-subject').value
        };
        fetch('/api/teachers/' + id, {
            method: 'PUT',
            headers: apiHeaders(),
            body: JSON.stringify(data)
        }).then(res => res.json()).then(() => {
            closeEditTeacherModal();
            showAlert('teacher-alert', 'Teacher updated successfully!', 'success');
            loadTeachers();
        }).catch(err => showAlert('teacher-alert', 'Error updating teacher', 'error'));
    });

    // Assign Subject form
    document.getElementById('assign-subject-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const id = document.getElementById('assign-teacher-select').value;
        if (!id) {
            showAlert('teacher-alert', 'Please select a teacher', 'error');
            return;
        }
        const data = {
            subject: document.getElementById('assign-subject').value
        };
        fetch('/api/teachers/' + id, {
            method: 'PUT',
            headers: apiHeaders(),
            body: JSON.stringify(data)
        }).then(res => res.json()).then(() => {
            showAlert('teacher-alert', 'Subject assigned successfully!', 'success');
            e.target.reset();
        }).catch(err => showAlert('teacher-alert', 'Error assigning subject', 'error'));
    });

    // Fee Payment form
    document.getElementById('fee-payment-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const studentId = document.getElementById('fee-student-id').value;
        const monthsCovered = getSelectedFeeMonths();
        const data = {
            studentId,
            studentName: document.getElementById('fee-student-name-hidden').value,
            className: document.getElementById('fee-class-name').value,
            amount: document.getElementById('fee-amount').value,
            paymentDate: document.getElementById('fee-date').value,
            monthsCovered: monthsCovered
        };
        fetch('/api/fees', {
            method: 'POST',
            headers: apiHeaders(),
            body: JSON.stringify(data)
        }).then(res => res.json()).then(res => {
            closeFeePaymentModal();
            closeFeeHistoryModal();
            showAlert('fee-alert', 'Payment recorded successfully (' + monthsCovered + ' ' + (monthsCovered === 1 ? 'Month' : 'Months') + ')!', 'success');
            loadFeesData();
            showReceipt(res);
        }).catch(err => showAlert('fee-alert', 'Error recording payment', 'error'));

    });

    // Date Sheet form
    document.getElementById('datesheet-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const data = {
            className: document.getElementById('datesheet-class').value,
            subject: document.getElementById('datesheet-subject').value,
            date: document.getElementById('datesheet-date').value,
            time: document.getElementById('datesheet-time').value
        };
        fetch('/api/exams/datesheet', {
            method: 'POST',
            headers: apiHeaders(),
            body: JSON.stringify(data)
        }).then(res => res.json()).then(() => {
            showAlert('exam-alert', 'Date sheet entry added!', 'success');
            e.target.reset();
            loadAvailableClasses().then(() => loadDateSheet());
        }).catch(err => showAlert('exam-alert', 'Error adding entry', 'error'));
    });

    // Result Upload form
    document.getElementById('result-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData();
        formData.append('className', document.getElementById('result-class').value);
        formData.append('resultFile', document.getElementById('result-file').files[0]);

        fetch('/api/exams/result', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + getToken() },
            body: formData
        }).then(res => res.json()).then(() => {
            showAlert('exam-alert', 'Result uploaded successfully!', 'success');
            e.target.reset();
            loadAvailableClasses();
        }).catch(err => showAlert('exam-alert', 'Error uploading result', 'error'));
    });

    // Calendar Upload form
    document.getElementById('calendar-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData();
        formData.append('calendarFile', document.getElementById('calendar-file').files[0]);

        fetch('/api/calendar', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + getToken() },
            body: formData
        }).then(res => res.json()).then(() => {
            showAlert('calendar-alert', 'Calendar uploaded successfully!', 'success');
            e.target.reset();
            loadCalendar();
        }).catch(err => showAlert('calendar-alert', 'Error uploading calendar', 'error'));
    });

    // Change Password form
    document.getElementById('change-password-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const curr = document.getElementById('current-password').value;
        const nw = document.getElementById('new-password').value;
        const cfm = document.getElementById('confirm-password').value;
        if (nw !== cfm) {
            showAlert('settings-alert', 'New passwords do not match!', 'error');
            return;
        }
        if (nw.length < 4) {
            showAlert('settings-alert', 'Password must be at least 4 characters!', 'error');
            return;
        }
        fetch('/api/auth/change-password', {
            method: 'POST',
            headers: apiHeaders(),
            body: JSON.stringify({ currentPassword: curr, newPassword: nw })
        }).then(res => res.json()).then(data => {
            if (data.error) {
                showAlert('settings-alert', data.error, 'error');
            } else {
                showAlert('settings-alert', 'Password changed successfully!', 'success');
                e.target.reset();
            }
        }).catch(err => showAlert('settings-alert', 'Error changing password', 'error'));
    });
});

// ==================== NAVIGATION ====================

function showDashboard() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('dashboard').classList.add('active');
    loadAvailableClasses();
    navigateTo('students');
}

function logout() {
    localStorage.removeItem('token');
    document.getElementById('login-page').style.display = 'block';
    document.getElementById('dashboard').classList.remove('active');
    document.getElementById('login-form').reset();
    document.getElementById('login-error').style.display = 'none';
}

function navigateTo(section) {
    const subNav = document.getElementById(section + '-subnav');
    const parentGroup = document.getElementById('nav-group-' + section) || (subNav ? subNav.closest('.nav-group') : null);
    const isCurrentlyExpanded = parentGroup && parentGroup.classList.contains('expanded');

    // Remove expanded state from all nav groups
    document.querySelectorAll('.nav-group').forEach(el => el.classList.remove('expanded'));
    document.querySelectorAll('.sub-nav').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    // Toggle sub-nav if present
    if (subNav && parentGroup) {
        if (!isCurrentlyExpanded) {
            parentGroup.classList.add('expanded');
            subNav.style.display = 'block';
        }
    }

    // Activate current nav item
    const navItem = document.querySelector('.nav-item[data-section="' + section + '"]');
    if (navItem) navItem.classList.add('active');

    // Show section content
    document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
    const targetSection = document.getElementById('section-' + section);
    if (targetSection) targetSection.classList.add('active');

    // Load section data
    if (section === 'teachers') {
        showTeacherSection('add');
        loadTeachers();
    }
    if (section === 'calendar') loadCalendar();
    if (section === 'students') {
        showStudentSection('add');
        loadAvailableClasses();
    }
    if (section === 'fees') {
        loadAvailableClasses();
    }
    if (section === 'exams') {
        showExamSection('datesheet');
        loadAvailableClasses();
    }

    // Close mobile sidebar on navigation
    if (window.innerWidth <= 768) {
        document.body.classList.remove('sidebar-open');
    }
}

function showStudentSection(sub) {
    document.querySelectorAll('#section-students .sub-section').forEach(el => el.style.display = 'none');
    const target = document.getElementById('student-' + sub);
    if (target) target.style.display = 'block';

    const group = document.getElementById('nav-group-students');
    const subNav = document.getElementById('students-subnav');
    if (group && subNav) {
        group.classList.add('expanded');
        subNav.style.display = 'block';
    }

    document.querySelectorAll('#students-subnav .sub-nav-item').forEach(el => el.classList.remove('active'));
    const labels = { 'add': 'Add Student', 'manage': 'Manage Students', 'upgrade': 'Upgrade Student' };
    const subNavItems = document.querySelectorAll('#students-subnav .sub-nav-item');
    subNavItems.forEach(el => {
        if (el.textContent.includes(labels[sub])) el.classList.add('active');
    });

    if (sub === 'manage') {
        loadAvailableClasses().then(() => loadStudentsByClass());
    }
    if (sub === 'upgrade') {
        loadAvailableClasses().then(() => loadStudentsForUpgrade());
    }
}

function showTeacherSection(sub) {
    document.querySelectorAll('#section-teachers .sub-section').forEach(el => el.style.display = 'none');
    const target = document.getElementById('teacher-' + sub);
    if (target) target.style.display = 'block';

    const group = document.getElementById('nav-group-teachers');
    const subNav = document.getElementById('teachers-subnav');
    if (group && subNav) {
        group.classList.add('expanded');
        subNav.style.display = 'block';
    }

    document.querySelectorAll('#teachers-subnav .sub-nav-item').forEach(el => el.classList.remove('active'));
    const labels = { 'add': 'Add Teacher', 'manage': 'Manage Teachers', 'assign': 'Assign Subject' };
    const subNavItems = document.querySelectorAll('#teachers-subnav .sub-nav-item');
    subNavItems.forEach(el => {
        if (el.textContent.includes(labels[sub])) el.classList.add('active');
    });

    if (sub === 'manage') loadTeachers();
    if (sub === 'assign') loadTeachersForAssign();
}

function showExamSection(sub) {
    document.querySelectorAll('#section-exams .sub-section').forEach(el => el.style.display = 'none');
    const target = document.getElementById('exam-' + sub);
    if (target) target.style.display = 'block';

    const group = document.getElementById('nav-group-exams');
    const subNav = document.getElementById('exams-subnav');
    if (group && subNav) {
        group.classList.add('expanded');
        subNav.style.display = 'block';
    }

    document.querySelectorAll('#exams-subnav .sub-nav-item').forEach(el => el.classList.remove('active'));
    const labels = { 'datesheet': 'Date Sheet', 'result': 'Result' };
    const subNavItems = document.querySelectorAll('#exams-subnav .sub-nav-item');
    subNavItems.forEach(el => {
        if (el.textContent.includes(labels[sub])) el.classList.add('active');
    });
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    const sw = document.getElementById('theme-switch');
    if (sw) sw.classList.toggle('active');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function toggleSidebar() {
    if (window.innerWidth <= 768) {
        document.body.classList.toggle('sidebar-open');
    } else {
        const isCollapsed = document.body.classList.toggle('sidebar-collapsed');
        localStorage.setItem('sidebar-collapsed', isCollapsed ? 'true' : 'false');
    }
}

// Search bar in topbar
const navPages = [
    { title: 'Students - Add Student', section: 'students', sub: 'add' },
    { title: 'Students - Manage Students', section: 'students', sub: 'manage' },
    { title: 'Students - Upgrade Student', section: 'students', sub: 'upgrade' },
    { title: 'Teachers - Add Teacher', section: 'teachers', sub: 'add' },
    { title: 'Teachers - Manage Teachers', section: 'teachers', sub: 'manage' },
    { title: 'Teachers - Assign Subject', section: 'teachers', sub: 'assign' },
    { title: 'Fees Management', section: 'fees' },
    { title: 'Examination - Date Sheet', section: 'exams', sub: 'datesheet' },
    { title: 'Examination - Result', section: 'exams', sub: 'result' },
    { title: 'Academic Calendar', section: 'calendar' },
    { title: 'Settings', section: 'settings' }
];

function handleNavSearch(query) {
    const container = document.getElementById('search-dropdown-results');
    if (!container) return;
    const q = (query || '').trim().toLowerCase();

    if (!q) {
        container.style.display = 'none';
        container.innerHTML = '';
        return;
    }

    const matches = navPages.filter(p => p.title.toLowerCase().includes(q));
    if (matches.length === 0) {
        container.innerHTML = '<div class="search-result-item" style="color:var(--text-secondary)">No pages found</div>';
    } else {
        container.innerHTML = matches.map(m => `
            <div class="search-result-item" onclick="selectSearchResult('${m.section}', '${m.sub || ''}')">
                <span>${m.title}</span>
            </div>
        `).join('');
    }
    container.style.display = 'block';
}

function selectSearchResult(section, sub) {
    navigateTo(section);
    if (section === 'students' && sub) showStudentSection(sub);
    if (section === 'teachers' && sub) showTeacherSection(sub);
    if (section === 'exams' && sub) showExamSection(sub);

    const input = document.getElementById('topbar-search-input');
    if (input) input.value = '';
    const container = document.getElementById('search-dropdown-results');
    if (container) container.style.display = 'none';
}

// Close search dropdown on click outside
document.addEventListener('click', function(e) {
    const searchBar = document.querySelector('.search-bookmark-bar');
    const container = document.getElementById('search-dropdown-results');
    if (searchBar && container && !searchBar.contains(e.target)) {
        container.style.display = 'none';
    }
});

// ==================== STUDENTS ====================

function loadStudentsByClass() {
    const cls = document.getElementById('manage-class-select').value;
    const url = cls ? '/api/students?className=' + encodeURIComponent(cls) : '/api/students';
    fetch(url, { headers: apiHeaders() })
    .then(res => res.json())
    .then(data => {
        if (!data || data.length === 0) {
            document.getElementById('students-table-container').innerHTML = '<p class="empty-state">No students found</p>';
            return;
        }
        let html = '<table class="data-table"><thead><tr><th>Name</th><th>Roll No</th><th>Class</th><th>Hostler</th><th>DOB</th><th>Address</th><th>Parent Contact</th><th>Registration Date</th><th>Actions</th></tr></thead><tbody>';
        data.forEach(s => {
            const safeStudent = JSON.stringify(s).replace(/'/g, '&#39;').replace(/"/g, '&quot;');
            const hostlerBadge = s.isHostler
                ? '<span class="badge-hostler badge-hostler-yes">Yes</span>'
                : '<span class="badge-hostler badge-hostler-no">No</span>';
            html += '<tr>';
            html += '<td>' + s.name + '</td>';
            html += '<td>' + s.rollNo + '</td>';
            html += '<td>' + s.className + '</td>';
            html += '<td>' + hostlerBadge + '</td>';
            html += '<td>' + (s.dob || '-') + '</td>';
            html += '<td>' + (s.address || '-') + '</td>';
            html += '<td>' + (s.parentContact || '-') + '</td>';
            html += '<td>' + (s.registrationDate || '-') + '</td>';
            html += '<td><button class="btn btn-sm btn-primary" onclick="openEditStudentModal(' + safeStudent + ')">Edit</button></td>';
            html += '</tr>';
        });
        html += '</tbody></table>';
        document.getElementById('students-table-container').innerHTML = html;
    })
    .catch(() => {
        document.getElementById('students-table-container').innerHTML = '<p class="empty-state">Error loading students</p>';
    });
}

function openEditStudentModal(student) {
    document.getElementById('edit-student-id').value = student._id;
    document.getElementById('edit-student-name').value = student.name;
    document.getElementById('edit-student-roll').value = student.rollNo;
    document.getElementById('edit-student-dob').value = student.dob || '';
    document.getElementById('edit-student-regdate').value = student.registrationDate || '';
    document.getElementById('edit-student-address').value = student.address || '';
    document.getElementById('edit-student-parent').value = student.parentContact || '';
    document.getElementById('edit-student-class').value = student.className;
    if (student.isHostler) {
        document.getElementById('edit-student-hostler-yes').checked = true;
    } else {
        document.getElementById('edit-student-hostler-no').checked = true;
    }
    document.getElementById('edit-student-modal').classList.add('active');
}

function closeEditStudentModal() {
    document.getElementById('edit-student-modal').classList.remove('active');
}

function deleteStudent() {
    if (confirm('Are you sure you want to delete this student?')) {
        const id = document.getElementById('edit-student-id').value;
        fetch('/api/students/' + id, { method: 'DELETE', headers: apiHeaders() })
        .then(() => {
            closeEditStudentModal();
            showAlert('student-alert', 'Student deleted successfully!', 'success');
            loadStudentsByClass();
            loadAvailableClasses();
        });
    }
}

function loadStudentsForUpgrade() {
    const cls = document.getElementById('upgrade-class-select').value;
    if (!cls) {
        document.getElementById('upgrade-table-container').innerHTML = '<p class="empty-state">Select a class to view students for upgrade</p>';
        return;
    }
    fetch('/api/students?className=' + encodeURIComponent(cls), { headers: apiHeaders() })
    .then(res => res.json())
    .then(data => {
        if (!data || data.length === 0) {
            document.getElementById('upgrade-table-container').innerHTML = '<p class="empty-state">No students found in this class</p>';
            return;
        }
        let html = '<table class="data-table"><thead><tr><th>Name</th><th>Roll No</th><th>Current Class</th><th>Actions</th></tr></thead><tbody>';
        data.forEach(s => {
            html += '<tr>';
            html += '<td>' + s.name + '</td>';
            html += '<td>' + s.rollNo + '</td>';
            html += '<td>' + s.className + '</td>';
            html += '<td><button class="btn btn-sm btn-success" onclick="upgradeStudent(\'' + s._id + '\')">Upgrade Student</button></td>';
            html += '</tr>';
        });
        html += '</tbody></table>';
        document.getElementById('upgrade-table-container').innerHTML = html;
    });
}

function upgradeStudent(id) {
    let target = document.getElementById('upgrade-target-class').value.trim();
    if (!target) {
        target = prompt('Enter the target class name to upgrade this student to:');
        if (!target) return;
    }
    if (confirm('Upgrade this student to "' + target + '"?')) {
        fetch('/api/students/' + id + '/upgrade', {
            method: 'PUT',
            headers: apiHeaders(),
            body: JSON.stringify({ targetClass: target })
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                showAlert('upgrade-alert', data.error, 'error');
                showAlert('student-alert', data.error, 'error');
            } else {
                showAlert('upgrade-alert', 'Student upgraded to ' + target + ' successfully!', 'success');
                showAlert('student-alert', 'Student upgraded to ' + target + ' successfully!', 'success');
                loadStudentsForUpgrade();
                loadAvailableClasses();
            }
        });
    }
}

function batchUpgradeStudents() {
    const fromClass = document.getElementById('upgrade-class-select').value;
    if (!fromClass) {
        showAlert('upgrade-alert', 'Please select the current class first', 'error');
        showAlert('student-alert', 'Please select the current class first', 'error');
        return;
    }
    const targetClass = document.getElementById('upgrade-target-class').value.trim();
    if (!targetClass) {
        showAlert('upgrade-alert', 'Please enter the target class name to upgrade to', 'error');
        showAlert('student-alert', 'Please enter the target class name to upgrade to', 'error');
        return;
    }
    if (confirm('Are you sure you want to upgrade ALL students from "' + fromClass + '" to "' + targetClass + '"?')) {
        fetch('/api/students/upgrade/batch', {
            method: 'PUT',
            headers: apiHeaders(),
            body: JSON.stringify({ fromClass, targetClass })
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                showAlert('upgrade-alert', data.error, 'error');
                showAlert('student-alert', data.error, 'error');
            } else {
                const msg = data.message || ('Students upgraded to ' + targetClass + ' successfully!');
                showAlert('upgrade-alert', msg, 'success');
                showAlert('student-alert', msg, 'success');
                loadAvailableClasses().then(() => {
                    document.getElementById('upgrade-class-select').value = targetClass;
                    loadStudentsForUpgrade();
                });
            }
        })
        .catch(() => {
            showAlert('upgrade-alert', 'Error upgrading students', 'error');
            showAlert('student-alert', 'Error upgrading students', 'error');
        });
    }
}

// ==================== TEACHERS ====================

function loadTeachers() {
    fetch('/api/teachers', { headers: apiHeaders() })
    .then(res => res.json())
    .then(data => {
        if (!data || data.length === 0) {
            document.getElementById('teachers-table-container').innerHTML = '<p class="empty-state">No teachers found</p>';
            return;
        }
        let html = '<table class="data-table"><thead><tr><th>Name</th><th>Gender</th><th>DOB</th><th>Address</th><th>Subject</th><th>Actions</th></tr></thead><tbody>';
        data.forEach(t => {
            const safeTeacher = JSON.stringify(t).replace(/'/g, '&#39;').replace(/"/g, '&quot;');
            html += '<tr>';
            html += '<td>' + t.name + '</td>';
            html += '<td>' + (t.gender || '') + '</td>';
            html += '<td>' + (t.dob || '') + '</td>';
            html += '<td>' + (t.address || '') + '</td>';
            html += '<td>' + (t.subject || 'Not Assigned') + '</td>';
            html += '<td><button class="btn btn-sm btn-primary" onclick="openEditTeacherModal(' + safeTeacher + ')">Edit</button></td>';
            html += '</tr>';
        });
        html += '</tbody></table>';
        document.getElementById('teachers-table-container').innerHTML = html;
    });
}

function loadTeachersForAssign() {
    fetch('/api/teachers', { headers: apiHeaders() })
    .then(res => res.json())
    .then(data => {
        const sel = document.getElementById('assign-teacher-select');
        sel.innerHTML = '<option value="">Select Teacher</option>';
        data.forEach(t => {
            sel.innerHTML += '<option value="' + t._id + '">' + t.name + (t.subject ? ' (' + t.subject + ')' : '') + '</option>';
        });
    });
}

function openEditTeacherModal(teacher) {
    document.getElementById('edit-teacher-id').value = teacher._id;
    document.getElementById('edit-teacher-name').value = teacher.name;
    document.getElementById('edit-teacher-gender').value = teacher.gender || '';
    document.getElementById('edit-teacher-dob').value = teacher.dob || '';
    document.getElementById('edit-teacher-regdate').value = teacher.registrationDate || '';
    document.getElementById('edit-teacher-address').value = teacher.address || '';
    document.getElementById('edit-teacher-subject').value = teacher.subject || '';
    document.getElementById('edit-teacher-modal').classList.add('active');
}

function closeEditTeacherModal() {
    document.getElementById('edit-teacher-modal').classList.remove('active');
}

function deleteTeacher() {
    if (confirm('Are you sure you want to delete this teacher?')) {
        const id = document.getElementById('edit-teacher-id').value;
        fetch('/api/teachers/' + id, { method: 'DELETE', headers: apiHeaders() })
        .then(() => {
            closeEditTeacherModal();
            showAlert('teacher-alert', 'Teacher deleted successfully!', 'success');
            loadTeachers();
        });
    }
}

// ==================== FEES ====================

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

window.feeStudentsMap = {};
window.feeCache = {};

function loadFeesData() {
    const cls = document.getElementById('fees-class-select').value;
    if (!cls) {
        document.getElementById('fees-table-container').innerHTML = '<p class="empty-state">Select a class to view fee records</p>';
        return;
    }
    fetch('/api/fees/students?className=' + encodeURIComponent(cls), { headers: apiHeaders() })
    .then(res => res.json())
    .then(data => {
        if (!data || data.length === 0) {
            document.getElementById('fees-table-container').innerHTML = '<p class="empty-state">No students found in this class</p>';
            return;
        }
        let html = '<table class="data-table fee-students-table"><thead><tr><th>Student Name</th><th>Roll No</th><th>Hostler</th><th>Next Due Date</th><th>Last Paid</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
        data.forEach(item => {
            const student = item.student;
            const fee = item.latestFee;
            window.feeStudentsMap[student._id] = student;

            const payAmount = fee ? '₹' + fee.amount + ' on ' + formatDate(fee.paymentDate) : 'Never paid';
            const hostlerTag = student.isHostler
                ? '<span class="badge-hostler badge-hostler-yes">Yes</span>'
                : '<span class="badge-hostler badge-hostler-no">No</span>';

            // Due Date column status
            let dueDateCell = '<span class="muted">Up to date</span>';
            if (item.nextDueDate) {
                if (item.isOverdue) {
                    dueDateCell = '<span class="status-badge status-overdue">' + formatDate(item.nextDueDate) + '</span>';
                } else {
                    dueDateCell = '<span>' + formatDate(item.nextDueDate) + '</span>';
                }
            }

            // Overall Status column
            let statusText = 'Paid';
            let statusClass = 'success';
            if (item.isOverdue) {
                statusText = 'Overdue';
                statusClass = 'overdue';
            } else if (item.totalPending > 0) {
                statusText = 'Pending';
                statusClass = 'error';
            } else if (fee) {
                statusText = 'Paid';
                statusClass = 'success';
            }

            html += '<tr>';
            html += '<td><a class="fee-student-link" onclick="openFeeHistory(\'' + student._id + '\')">' + student.name + '</a></td>';
            html += '<td>' + student.rollNo + '</td>';
            html += '<td>' + hostlerTag + '</td>';
            html += '<td class="next-due-cell">' + dueDateCell + '</td>';
            html += '<td>' + payAmount + '</td>';
            html += '<td><span class="status-badge status-' + statusClass + '">' + statusText + '</span></td>';
            html += '<td><button class="btn btn-sm btn-info" onclick="openFeeHistory(\'' + student._id + '\')">History</button> ';
            html += '<button class="btn btn-sm ' + (item.isOverdue ? 'btn-danger' : 'btn-success') + '" onclick="openFeePaymentModalByStudentId(\'' + student._id + '\', ' + (item.firstPendingCycleNo || '') + ')">' + (item.isOverdue ? 'Pay Overdue' : 'Pay') + '</button></td>';
            html += '</tr>';
        });
        html += '</tbody></table>';
        document.getElementById('fees-table-container').innerHTML = html;
    })
    .catch(() => {
        document.getElementById('fees-table-container').innerHTML = '<p class="empty-state">Error loading fee data</p>';
    });
}

function getTodayAD() {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// Store student for post-payment callback
let _feeHistoryStudentId = null;
let _feeHistoryStudentData = null;

function openFeePaymentModalByStudentId(studentId, cycleNo) {
    const student = window.feeStudentsMap[studentId];
    if (student) {
        openFeePaymentModal(student, cycleNo);
    }
}

function getSelectedFeeMonths() {
    const sel = document.getElementById('fee-months-select');
    if (!sel) return 1;
    if (sel.value === 'custom') {
        const customVal = parseInt(document.getElementById('fee-custom-months').value, 10);
        return (!isNaN(customVal) && customVal > 0) ? customVal : 1;
    }
    const val = parseInt(sel.value, 10);
    return (!isNaN(val) && val > 0) ? val : 1;
}

function handleFeeMonthsChange() {
    const sel = document.getElementById('fee-months-select');
    const customGroup = document.getElementById('fee-custom-months-group');
    if (sel.value === 'custom') {
        customGroup.style.display = 'block';
        document.getElementById('fee-custom-months').focus();
    } else {
        customGroup.style.display = 'none';
    }
    calculateTotalFee();
    updateFeeCycleNotice();
}

function handleCustomMonthsInput() {
    calculateTotalFee();
    updateFeeCycleNotice();
}

function calculateTotalFee() {
    const rateInput = document.getElementById('fee-monthly-rate');
    const amountInput = document.getElementById('fee-amount');
    if (!rateInput || !amountInput) return;

    const rate = parseFloat(rateInput.value);
    const months = getSelectedFeeMonths();
    if (!isNaN(rate) && rate > 0) {
        amountInput.value = Math.round(rate * months);
    }
}

function updateFeeCycleNotice() {
    const noticeEl = document.getElementById('fee-cycle-notice');
    if (!noticeEl) return;
    const startCycle = window._currentFeeStartCycle;
    const months = getSelectedFeeMonths();

    if (startCycle) {
        noticeEl.style.display = 'block';
        if (months === 1) {
            noticeEl.innerText = 'Clearing Fee for Cycle #' + startCycle;
        } else {
            const endCycle = startCycle + months - 1;
            noticeEl.innerText = 'Clearing ' + months + ' Cycles: #' + startCycle + ' to #' + endCycle;
        }
    } else {
        if (months > 1) {
            noticeEl.style.display = 'block';
            noticeEl.innerText = 'Recording Advance Payment for ' + months + ' Months';
        } else {
            noticeEl.style.display = 'none';
        }
    }
}

function openFeePaymentModal(student, cycleNo) {
    if (!student) return;
    document.getElementById('fee-student-id').value = student._id;
    document.getElementById('fee-student-name-hidden').value = student.name;
    document.getElementById('fee-class-name').value = student.className;
    document.getElementById('fee-student-display').value = student.name + ' (' + student.className + ')';
    document.getElementById('fee-date').value = getTodayAD();
    document.getElementById('fee-amount').value = '';

    // Reset multi-month controls
    const monthsSel = document.getElementById('fee-months-select');
    if (monthsSel) monthsSel.value = '1';
    const customGroup = document.getElementById('fee-custom-months-group');
    if (customGroup) customGroup.style.display = 'none';
    const customInput = document.getElementById('fee-custom-months');
    if (customInput) customInput.value = '';
    const rateInput = document.getElementById('fee-monthly-rate');
    if (rateInput) rateInput.value = '';

    window._currentFeeStartCycle = cycleNo || null;
    updateFeeCycleNotice();

    // Store for re-opening history after payment
    _feeHistoryStudentId = student._id;
    _feeHistoryStudentData = student;
    document.getElementById('fee-payment-modal').classList.add('active');
}


function closeFeePaymentModal() {
    document.getElementById('fee-payment-modal').classList.remove('active');
}

function viewReceipts(studentId) {
    fetch('/api/fees?studentId=' + studentId, { headers: apiHeaders() })
    .then(res => res.json())
    .then(data => {
        if (data && data.length > 0) {
            showReceipt(data[0]);
        } else {
            showAlert('fee-alert', 'No receipts found for this student', 'error');
        }
    });
}

// ==================== FEE HISTORY ====================

function openFeeHistory(studentId) {
    const modal = document.getElementById('fee-history-modal');
    const content = document.getElementById('fee-history-content');
    content.innerHTML = '<div class="fee-history-loading"><div class="spinner"></div><p>Loading fee history...</p></div>';
    modal.classList.add('active');

    fetch('/api/fees/history/' + studentId, { headers: apiHeaders() })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            content.innerHTML = '<p class="fee-history-error">' + data.error + '</p>';
            return;
        }
        window.feeStudentsMap[data.student._id] = data.student;
        renderFeeHistory(data);
    })
    .catch(() => {
        content.innerHTML = '<p class="fee-history-error">Failed to load fee history. Please try again.</p>';
    });
}

function closeFeeHistoryModal() {
    document.getElementById('fee-history-modal').classList.remove('active');
}

function renderFeeHistory(data) {
    const { student, cycles, nextDueDate, isOverdue, totalPaid, totalPending, firstPendingCycleNo } = data;
    const content = document.getElementById('fee-history-content');

    // Student info header
    let html = '<div class="fee-history-header">';
    html += '<div class="fee-history-student-info">';
    html += '<div class="fee-history-student-name">' + student.name + '</div>';
    html += '<div class="fee-history-student-meta">';
    html += '<span>Class: ' + student.className + '</span>';
    html += '<span>Roll No: ' + student.rollNo + '</span>';
    html += '<span>Hostler: ' + (student.isHostler ? 'Yes' : 'No') + '</span>';
    html += '<span>Registered: ' + formatDate(student.registrationDate) + '</span>';
    if (student.parentContact) html += '<span>' + student.parentContact + '</span>';
    html += '</div></div>';

    // Summary badges
    html += '<div class="fee-history-summary">';
    html += '<div class="fee-summary-badge paid-badge"><span class="badge-num">' + totalPaid + '</span><span class="badge-label">Paid</span></div>';
    html += '<div class="fee-summary-badge pending-badge"><span class="badge-num">' + totalPending + '</span><span class="badge-label">Pending</span></div>';
    html += '<div class="fee-summary-badge total-badge"><span class="badge-num">' + cycles.length + '</span><span class="badge-label">Total Cycles</span></div>';
    html += '</div></div>'; // close fee-history-header

    // Next due date banner with direct action button
    if (nextDueDate) {
        html += '<div class="next-due-banner ' + (isOverdue ? 'overdue' : 'upcoming') + '">';
        if (isOverdue) {
            html += '<span>Fee Overdue! Was due on <strong>' + formatDate(nextDueDate) + '</strong></span>';
            html += '<button class="btn btn-sm btn-danger banner-pay-btn" onclick="openFeePaymentFromHistoryId(\'' + student._id + '\', ' + firstPendingCycleNo + ')">Pay Overdue Fee Now</button>';
        } else {
            html += '<span>Next fee due on: <strong>' + formatDate(nextDueDate) + '</strong></span>';
            html += '<button class="btn btn-sm btn-success banner-pay-btn" onclick="openFeePaymentFromHistoryId(\'' + student._id + '\', ' + firstPendingCycleNo + ')">Pay Next Fee</button>';
        }
        html += '</div>';
    } else {
        html += '<div class="next-due-banner all-paid">All fees are paid up to date!</div>';
    }

    // Fee timeline table
    if (cycles.length === 0) {
        html += '<p class="empty-state">No fee cycles found.</p>';
    } else {
        html += '<div class="fee-history-table-wrap">';
        html += '<table class="data-table fee-history-table"><thead><tr>';
        html += '<th>#</th><th>Cycle Start</th><th>Due Date</th><th>Status</th><th>Amount Paid</th><th>Payment Date</th><th>Actions</th>';
        html += '</tr></thead><tbody>';

        cycles.forEach(cycle => {
            const isCyclePaid = cycle.status === 'paid';
            const isCycleOverdue = !isCyclePaid && new Date(cycle.dueDate) < new Date();
            const rowClass = isCyclePaid ? 'cycle-row-paid' : (isCycleOverdue ? 'cycle-row-overdue' : 'cycle-row-pending');

            html += '<tr class="' + rowClass + '">';
            html += '<td>' + cycle.cycleNo + '</td>';
            html += '<td>' + formatDate(cycle.cycleStart) + '</td>';
            html += '<td>' + formatDate(cycle.dueDate) + '</td>';

            if (isCyclePaid) {
                window.feeCache[cycle.fee._id] = cycle.fee;
                let multiMonthTag = '';
                if (cycle.feeTotalMonths > 1) {
                    multiMonthTag = ' <span class="badge-hostler" style="background:#e0e7ff;color:#3730a3;font-size:10.5px;padding:2px 7px;">Month ' + cycle.monthInFee + ' of ' + cycle.feeTotalMonths + '</span>';
                }
                html += '<td><span class="status-badge status-success">Paid</span>' + multiMonthTag + '</td>';
                html += '<td>₹' + cycle.fee.amount + (cycle.feeTotalMonths > 1 ? ' <span class="muted" style="font-size:11px">(Total)</span>' : '') + '</td>';
                html += '<td>' + formatDate(cycle.fee.paymentDate) + '</td>';
                html += '<td><button class="btn btn-sm btn-primary" onclick="showReceiptById(\'' + cycle.fee._id + '\')">Receipt</button></td>';
            } else {
                html += '<td><span class="status-badge status-' + (isCycleOverdue ? 'overdue' : 'error') + '">' + (isCycleOverdue ? 'Overdue' : 'Pending') + '</span></td>';
                html += '<td>—</td>';
                html += '<td>—</td>';
                html += '<td><button class="btn btn-sm ' + (isCycleOverdue ? 'btn-danger' : 'btn-success') + '" onclick="openFeePaymentFromHistoryId(\'' + student._id + '\', ' + cycle.cycleNo + ')">Pay</button></td>';
            }

            html += '</tr>';
        });

        html += '</tbody></table></div>';
    }

    content.innerHTML = html;
}


function openFeePaymentFromHistoryId(studentId, cycleNo) {
    const student = window.feeStudentsMap[studentId];
    if (student) {
        openFeePaymentModal(student, cycleNo);
    }
    closeFeeHistoryModal();
}

function showReceiptById(feeId) {
    const fee = window.feeCache[feeId];
    if (fee) {
        closeFeeHistoryModal();
        showReceipt(fee);
    }
}


function showReceipt(fee) {
    document.getElementById('receipt-no').innerText = fee.receiptNo;
    document.getElementById('receipt-date').innerText = fee.paymentDate;
    document.getElementById('receipt-student').innerText = fee.studentName;
    document.getElementById('receipt-class').innerText = fee.className;
    document.getElementById('receipt-amount').innerText = '₹' + fee.amount;

    const periodEl = document.getElementById('receipt-period');
    const periodRow = document.getElementById('receipt-period-row');
    if (periodEl && periodRow) {
        const months = fee.monthsCovered || 1;
        let periodText = months + (months === 1 ? ' Month' : ' Months');
        if (fee.cycleRange && fee.cycleRange.from && fee.cycleRange.to) {
            if (fee.cycleRange.from === fee.cycleRange.to) {
                periodText += ' (Cycle #' + fee.cycleRange.from + ')';
            } else {
                periodText += ' (Cycles #' + fee.cycleRange.from + ' to #' + fee.cycleRange.to + ')';
            }
        }
        periodEl.innerText = periodText;
        periodRow.style.display = 'flex';
    }

    document.getElementById('receipt-modal').classList.add('active');
}

function closeReceiptModal() {
    document.getElementById('receipt-modal').classList.remove('active');
}

// ==================== EXAMINATION ====================

function loadDateSheet() {
    const cls = document.getElementById('view-datesheet-class').value;
    if (!cls) {
        document.getElementById('datesheet-table-container').innerHTML = '';
        return;
    }
    fetch('/api/exams/datesheet?className=' + encodeURIComponent(cls), { headers: apiHeaders() })
    .then(res => res.json())
    .then(data => {
        if (!data || data.length === 0) {
            document.getElementById('datesheet-table-container').innerHTML = '<p class="empty-state">No date sheet entries for this class</p>';
            return;
        }
        let html = '<table class="data-table"><thead><tr><th>Subject</th><th>Date</th><th>Time</th><th>Actions</th></tr></thead><tbody>';
        data.forEach(d => {
            html += '<tr>';
            html += '<td>' + d.subject + '</td>';
            html += '<td>' + d.date + '</td>';
            html += '<td>' + d.time + '</td>';
            html += '<td><button class="btn btn-sm btn-danger" onclick="deleteDateSheetEntry(\'' + d._id + '\')">Delete</button></td>';
            html += '</tr>';
        });
        html += '</tbody></table>';
        document.getElementById('datesheet-table-container').innerHTML = html;
    });
}

function deleteDateSheetEntry(id) {
    if (confirm('Delete this date sheet entry?')) {
        fetch('/api/exams/datesheet/' + id, { method: 'DELETE', headers: apiHeaders() })
        .then(() => {
            loadDateSheet();
            loadAvailableClasses();
        });
    }
}

function loadResult() {
    const cls = document.getElementById('view-result-class').value;
    if (!cls) {
        document.getElementById('result-display').innerHTML = '';
        return;
    }
    fetch('/api/exams/result?className=' + encodeURIComponent(cls), { headers: apiHeaders() })
    .then(res => res.json())
    .then(data => {
        const disp = document.getElementById('result-display');
        if (data && data.filePath) {
            if (data.filePath.endsWith('.pdf')) {
                disp.innerHTML = '<iframe src="' + data.filePath + '"></iframe>';
            } else {
                disp.innerHTML = '<img src="' + data.filePath + '" alt="Result for Class ' + cls + '">';
            }
        } else {
            disp.innerHTML = '<p class="empty-state">No result uploaded for this class</p>';
        }
    })
    .catch(() => {
        document.getElementById('result-display').innerHTML = '<p class="empty-state">Error loading result</p>';
    });
}

// ==================== ACADEMIC CALENDAR ====================

function loadCalendar() {
    fetch('/api/calendar', { headers: apiHeaders() })
    .then(res => res.json())
    .then(data => {
        const disp = document.getElementById('calendar-display');
        if (data && data.filePath) {
            if (data.filePath.endsWith('.pdf')) {
                disp.innerHTML = '<iframe src="' + data.filePath + '"></iframe>';
            } else {
                disp.innerHTML = '<img src="' + data.filePath + '" alt="Academic Calendar">';
            }
        } else {
            disp.innerHTML = '<p class="empty-state">No calendar uploaded yet</p>';
        }
    })
    .catch(() => {
        document.getElementById('calendar-display').innerHTML = '<p class="empty-state">No calendar uploaded yet</p>';
    });
}

// ==================== THEME ====================

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    document.getElementById('theme-switch').classList.toggle('active');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}
