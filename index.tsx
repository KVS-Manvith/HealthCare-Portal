

import { GoogleGenAI, Chat, Type } from "@google/genai";
// @ts-ignore
const axios = window.axios;

// --- DOM ELEMENTS ---

// Auth Elements
const authContainer = document.getElementById('authContainer');
const appContainer = document.getElementById('appContainer');
const loginFormContainer = document.getElementById('loginFormContainer');
const signUpFormContainer = document.getElementById('signUpFormContainer');
const loginForm = document.getElementById('loginForm');
const signUpForm = document.getElementById('signUpForm');
const showSignUpLink = document.getElementById('showSignUpLink');
const showLoginLink = document.getElementById('showLoginLink');
const loginError = document.getElementById('loginError');
const signUpError = document.getElementById('signUpError');
const logoutBtn = document.getElementById('logoutBtn');

// App Elements
const appointmentsBtn = document.getElementById('appointmentsBtn');
const hospitalsBtn = document.getElementById('hospitalsBtn');
const recordsBtn = document.getElementById('recordsBtn');
const profileBtn = document.getElementById('profileBtn');
const contactBtn = document.getElementById('contactBtn');

const welcomeSection = document.querySelector('.welcome-section') as HTMLElement;
const contentSections = document.querySelectorAll('.content-section');
const appointmentsContent = document.getElementById('appointmentsContent');
const hospitalsContent = document.getElementById('hospitalsContent');
const recordsContent = document.getElementById('recordsContent');
const profileContent = document.getElementById('profileContent');
const backBtns = document.querySelectorAll('.back-btn');

// Profile Elements
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
const profileDob = document.getElementById('profileDob');
const profilePhone = document.getElementById('profilePhone');
const editProfileBtn = document.getElementById('editProfileBtn');
const cancelEditProfileBtn = document.getElementById('cancelEditProfileBtn');
const backFromProfileBtn = document.getElementById('backFromProfile');
const profileDetailsView = document.getElementById('profileDetailsView');
const profileDetailsEdit = document.getElementById('profileDetailsEdit') as HTMLFormElement;
const editProfileNameInput = document.getElementById('editProfileName') as HTMLInputElement;
const editProfileDobInput = document.getElementById('editProfileDob') as HTMLInputElement;
const editProfileEmailInput = document.getElementById('editProfileEmail') as HTMLInputElement;
const editProfilePhoneInput = document.getElementById('editProfilePhone') as HTMLInputElement;

// Appointment Booking Elements
const bookAppointmentBtn = document.getElementById('bookAppointmentBtn');
const appointmentForm = document.getElementById('appointmentForm');
const bookingForm = document.getElementById('bookingForm') as HTMLFormElement;
const doctorsGrid = document.getElementById('doctorsGrid');
const appointmentDate = document.getElementById('appointmentDate') as HTMLInputElement;
const appointmentTime = document.getElementById('appointmentTime') as HTMLSelectElement;
const appointmentList = document.getElementById('appointmentList');
const submitBtn = document.getElementById('submitBtn') as HTMLButtonElement;
const appointmentsLoader = document.getElementById('appointmentsLoader');
const doctorsLoader = document.getElementById('doctorsLoader');

// Calendar Elements
const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');
const currentMonthYear = document.getElementById('currentMonthYear');
const calendarDays = document.getElementById('calendarDays');
const appointmentsListTitle = document.getElementById('appointmentsListTitle');
const showAllAppointmentsBtn = document.getElementById('showAllAppointmentsBtn');

// Modal Elements
const confirmationModal = document.getElementById('confirmationModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalAppointmentDetails = document.getElementById('modalAppointmentDetails');
const cancelBookingBtn = document.getElementById('cancelBookingBtn');
const confirmBookingBtn = document.getElementById('confirmBookingBtn') as HTMLButtonElement;


// Hospital Elements
const hospitalSearchInput = document.getElementById('hospitalSearchInput') as HTMLInputElement;
const hospitalList = document.getElementById('hospitalList');


// Chatbot Elements
const chatbotToggle = document.getElementById('chatbotToggle');
const chatbotWindow = document.getElementById('chatbotWindow');
const chatbotClose = document.getElementById('chatbotClose');
const chatbotMessages = document.getElementById('chatbotMessages');
const chatbotQuickReplies = document.getElementById('chatbotQuickReplies');
const chatbotInput = document.getElementById('chatbotInput') as HTMLInputElement;
const chatbotSend = document.getElementById('chatbotSend') as HTMLButtonElement;
const typingIndicator = document.getElementById('typingIndicator');

// --- STATE ---
let appointments = [];
let doctors = [];
let selectedDoctor = null;
let chat: Chat | null = null;
let ai: GoogleGenAI | null = null;
let currentDate = new Date();
let selectedDate: string | null = null;
let currentAppointmentData = null; // To hold data for the confirmation modal
const USERS_STORAGE_key = 'healthcare_users'; // Mock DB key
const CURRENT_USER_SESSION_key = 'healthcare_current_user';

// --- DATA ---
const allHospitals = [
    { name: "City General Hospital", location: "123 Medical Drive, Downtown", phone: "(555) 123-4567", distance: "1.2 miles away" },
    { name: "Westside Medical Center", location: "456 Health Avenue, Westside", phone: "(555) 987-6543", distance: "2.5 miles away" },
    { name: "North Valley Clinic", location: "789 Wellness St, North Valley", phone: "(555) 246-8135", distance: "4.8 miles away" },
    { name: "Bayview Community Health", location: "101 Ocean Blvd, Bayview", phone: "(555) 369-2581", distance: "7.1 miles away" },
    { name: "Riverbend Specialty Hospital", location: "222 River Rd, Riverbend", phone: "(555) 111-2222", distance: "8.3 miles away" }
];


// --- SIMULATED BACKEND API using Axios ---
// This section simulates a backend API. It uses Axios syntax, but the logic
// is mocked to use localStorage. When a real backend is built, you will only
// need to change the URLs and logic inside these functions.

const apiClient = axios.create({
    baseURL: '/api', // A base URL for a real API
    timeout: 1000,
});

// Mocking function to simulate API delay and localStorage interaction
// FIX: Add generic type and return type to mockRequest for proper type inference on API calls, which resolves multiple 'property data does not exist' errors. Also type caught error as any.
// Using <T,> to avoid ambiguity with JSX syntax in .tsx files.
const mockRequest = <T,>(delay: number, callback: () => T): Promise<{ data: T }> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                const result = callback();
                // Axios wraps successful responses in a `data` object
                resolve({ data: result });
            } catch (error: any) {
                 // Axios wraps errors in a specific structure
                reject({ response: { data: { message: error.message } } });
            }
        }, delay);
    });
};


const api = {
    // FIX: Added types to parameters
    login(email: string, password: string) {
        console.log(`MOCK: axios.post('/api/auth/login', { email: '${email}' })`);
        return mockRequest(500, () => {
            const users = JSON.parse(localStorage.getItem(USERS_STORAGE_key) || '[]');
            const user = users.find(u => u.email === email && u.password === password);
            if (user) {
                return { success: true, user };
            } else {
                throw new Error('Invalid email or password.');
            }
        });
    },

    // FIX: Added types to parameters
    signUp(userData: { name: string, email: string, password: string, dob: string }) {
        console.log(`MOCK: axios.post('/api/auth/signup', { name: '${userData.name}'... })`);
        return mockRequest(700, () => {
            const users = JSON.parse(localStorage.getItem(USERS_STORAGE_key) || '[]');
            if (users.some(u => u.email === userData.email)) {
                throw new Error('An account with this email already exists.');
            }
            // FIX: Replaced object spread with Object.assign for wider compatibility
            const newUser = Object.assign({}, userData, { phone: '' });
            users.push(newUser);
            localStorage.setItem(USERS_STORAGE_key, JSON.stringify(users));
            return { success: true, user: newUser };
        });
    },

    // FIX: Added types to parameters
    updateUserProfile(email: string, updatedData: { name: string, dob: string, phone: string }) {
        console.log(`MOCK: axios.put('/api/users/${email}', { ...updatedData })`);
        return mockRequest(600, () => {
            const users = JSON.parse(localStorage.getItem(USERS_STORAGE_key) || '[]');
            const userIndex = users.findIndex(u => u.email === email);
            if (userIndex !== -1) {
                // FIX: Replaced object spread with Object.assign for wider compatibility
                users[userIndex] = Object.assign({}, users[userIndex], updatedData);
                localStorage.setItem(USERS_STORAGE_key, JSON.stringify(users));
                return { success: true, user: users[userIndex] };
            }
            throw new Error('User not found.');
        });
    },
    
    fetchDoctors() {
        console.log("MOCK: axios.get('/api/doctors')");
        return mockRequest(800, () => [
            { id: 1, name: "Dr. Sarah Johnson", specialty: "Cardiology", rating: 4.8, avatar: "SJ" },
            { id: 2, name: "Dr. Michael Chen", specialty: "Dermatology", rating: 4.6, avatar: "MC" },
            { id: 3, name: "Dr. Emily Roberts", specialty: "Dentistry", rating: 4.9, avatar: "ER" },
            { id: 4, name: "Dr. James Wilson", specialty: "Pediatrics", rating: 4.7, avatar: "JW" },
            { id: 5, name: "Dr. Lisa Patel", specialty: "Orthopedics", rating: 4.5, avatar: "LP" },
            { id: 6, name: "Dr. David Kim", specialty: "Neurology", rating: 4.8, avatar: "DK" }
        ]);
    },

    fetchAppointments() {
        console.log("MOCK: axios.get('/api/appointments')");
        return mockRequest(500, () => {
            const allAppointments = JSON.parse(localStorage.getItem('healthcare_appointments') || '[]');
            if (allAppointments.length === 0) {
                 // Helper to generate future dates dynamically
                 const getFutureDate = (daysToAdd: number) => {
                     const date = new Date();
                     date.setDate(date.getDate() + daysToAdd);
                     const yyyy = date.getFullYear();
                     const mm = String(date.getMonth() + 1).padStart(2, '0');
                     const dd = String(date.getDate()).padStart(2, '0');
                     return `${yyyy}-${mm}-${dd}`;
                 };

                 const initialAppointments = [
                    { id: 1, doctor: "Dr. Sarah Johnson", specialty: "Cardiology", date: getFutureDate(3), time: "10:30 AM", reason: "Routine heart checkup", status: "confirmed" },
                    { id: 2, doctor: "Dr. Michael Chen", specialty: "Dermatology", date: getFutureDate(7), time: "02:15 PM", reason: "Skin rash evaluation", status: "confirmed" },
                    { id: 3, doctor: "Dr. Emily Roberts", specialty: "Dentistry", date: getFutureDate(15), time: "09:00 AM", reason: "Regular dental cleaning", status: "pending" }
                ];
                localStorage.setItem('healthcare_appointments', JSON.stringify(initialAppointments));
                return initialAppointments;
            }
            return allAppointments;
        });
    },

    // FIX: Added types to parameters
    postAppointment(newAppointmentData: { doctor: string, specialty: string, date: string, time: string, reason: string }) {
        console.log("MOCK: axios.post('/api/appointments', { ...newAppointmentData })");
        return mockRequest(1200, () => {
            const allAppointments = JSON.parse(localStorage.getItem('healthcare_appointments') || '[]');
            // FIX: Replaced object spread with Object.assign for wider compatibility
            const newAppointment = Object.assign({}, newAppointmentData, { id: Date.now(), status: 'pending' });
            allAppointments.push(newAppointment);
            localStorage.setItem('healthcare_appointments', JSON.stringify(allAppointments));
            return newAppointment;
        });
    }
};

// --- AUTHENTICATION LOGIC ---
async function handleLogin(e: Event) {
    e.preventDefault();
    loginError.textContent = '';
    const email = (document.getElementById('loginEmail') as HTMLInputElement).value;
    const password = (document.getElementById('loginPassword') as HTMLInputElement).value;
    
    try {
        const response = await api.login(email, password);
        // With axios, the actual data is in response.data
        if (response.data.success) {
            sessionStorage.setItem(CURRENT_USER_SESSION_key, JSON.stringify(response.data.user));
            showApp(response.data.user);
        }
    // FIX: Type caught error as 'any' to allow accessing properties for error messages.
    } catch (error: any) {
        // Axios errors have a response.data object
        loginError.textContent = error.response?.data?.message || 'An unknown error occurred.';
    }
}

async function handleSignUp(e: Event) {
    e.preventDefault();
    signUpError.textContent = '';
    const name = (document.getElementById('signUpName') as HTMLInputElement).value;
    const dob = (document.getElementById('signUpDob') as HTMLInputElement).value;
    const email = (document.getElementById('signUpEmail') as HTMLInputElement).value;
    const password = (document.getElementById('signUpPassword') as HTMLInputElement).value;
    const confirmPassword = (document.getElementById('confirmPassword') as HTMLInputElement).value;

    if (password !== confirmPassword) {
        signUpError.textContent = 'Passwords do not match.';
        return;
    }

    try {
        // FIX: Expanded shorthand property names for wider compatibility
        const response = await api.signUp({ name: name, email: email, password: password, dob: dob });
        if (response.data.success) {
            sessionStorage.setItem(CURRENT_USER_SESSION_key, JSON.stringify(response.data.user));
            showApp(response.data.user);
        }
    // FIX: Type caught error as 'any' to allow accessing properties for error messages.
    } catch (error: any) {
        signUpError.textContent = error.response?.data?.message || 'An unknown error occurred.';
    }
}

function handleLogout() {
    sessionStorage.removeItem(CURRENT_USER_SESSION_key);
    showAuth();
}

function checkAuthStatus() {
    const userJson = sessionStorage.getItem(CURRENT_USER_SESSION_key);
    if (userJson) {
        showApp(JSON.parse(userJson));
    } else {
        showAuth();
    }
}

// --- UI MANAGEMENT ---
function populateProfileData(user) {
    profileName.textContent = user.name;
    profileEmail.textContent = user.email;
    profileDob.textContent = user.dob ? formatDate(user.dob, false) : 'Not set';
    profilePhone.textContent = user.phone || 'Not set';

    editProfileNameInput.value = user.name;
    editProfileEmailInput.value = user.email;
    editProfileDobInput.value = user.dob || '';
    editProfilePhoneInput.value = user.phone || '';
}

function showApp(user) {
    authContainer.classList.add('hidden');
    appContainer.classList.remove('hidden');
    populateProfileData(user);
    initializeMainApp();
}

function showAuth() {
    appContainer.classList.add('hidden');
    authContainer.classList.remove('hidden');
    showWelcome();
}

// --- RENDER FUNCTIONS ---
function renderDoctors() {
    doctorsGrid.innerHTML = '';
    doctors.forEach(doctor => {
        const doctorCard = document.createElement('div');
        doctorCard.className = 'doctor-card';
        doctorCard.dataset.doctorId = String(doctor.id);
        doctorCard.innerHTML = `
            <div class="doctor-avatar">${doctor.avatar}</div>
            <div class="doctor-name">${doctor.name}</div>
            <div class="doctor-specialty">${doctor.specialty}</div>
            <div class="doctor-rating">
                ${'★'.repeat(Math.floor(doctor.rating))}${doctor.rating % 1 !== 0 ? '½' : ''} ${doctor.rating}
            </div>
        `;
        doctorCard.addEventListener('click', () => handleDoctorSelect(doctor, doctorCard));
        doctorsGrid.appendChild(doctorCard);
    });
}

function renderTimeSlots() {
    const timeSlots = ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM"];
    appointmentTime.innerHTML = '<option value="">Select Time</option>';
    timeSlots.forEach(time => {
        const option = document.createElement('option');
        option.value = time;
        option.textContent = time;
        appointmentTime.appendChild(option);
    });
}

function renderAppointments(appointmentsToRender) {
    appointmentList.innerHTML = '';
    if (appointmentsToRender.length === 0) {
        appointmentList.innerHTML = '<p>No appointments scheduled for this day.</p>';
        return;
    }
    const sortedAppointments = [...appointmentsToRender].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    sortedAppointments.forEach(appointment => {
        const appointmentItem = document.createElement('div');
        appointmentItem.className = 'appointment-item';
        appointmentItem.innerHTML = `
            <div class="appointment-info">
                <h4>${appointment.doctor} - ${appointment.specialty}</h4>
                <p><i class="far fa-calendar"></i> ${formatDate(appointment.date)} | ${appointment.time}</p>
                <p>Reason: ${appointment.reason}</p>
            </div>
            <div class="appointment-status status-${appointment.status}">${appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}</div>
        `;
        appointmentList.appendChild(appointmentItem);
    });
}

function renderHospitals(hospitalsToRender) {
    hospitalList.innerHTML = '';
    if (hospitalsToRender.length === 0) {
        hospitalList.innerHTML = '<p>No hospitals found matching your search.</p>';
        return;
    }
    hospitalsToRender.forEach(hospital => {
        const hospitalItem = document.createElement('div');
        hospitalItem.className = 'hospital-item';
        hospitalItem.innerHTML = `
            <i class="fas fa-hospital hospital-icon"></i>
            <div class="hospital-info">
                <h4>${hospital.name}</h4>
                <p><i class="fas fa-map-marker-alt"></i> ${hospital.location}</p>
                <p><i class="fas fa-phone"></i> ${hospital.phone}</p>
                <p class="hospital-distance">${hospital.distance}</p>
            </div>
        `;
        hospitalList.appendChild(hospitalItem);
    });
}

function renderCalendar() {
    calendarDays.innerHTML = '';
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    currentMonthYear.textContent = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const lastDateOfMonth = new Date(year, month + 1, 0).getDate();
    const lastDayOfMonth = new Date(year, month, lastDateOfMonth).getDay();
    const lastDateOfLastMonth = new Date(year, month, 0).getDate();

    // Previous month's days
    for (let i = firstDayOfMonth; i > 0; i--) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day other-month';
        dayEl.textContent = String(lastDateOfLastMonth - i + 1);
        calendarDays.appendChild(dayEl);
    }
    
    const today = new Date();
    // Current month's days
    for (let i = 1; i <= lastDateOfMonth; i++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        dayEl.textContent = String(i);
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        
        if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            dayEl.classList.add('current-day');
        }

        if (dateString === selectedDate) {
            dayEl.classList.add('selected');
        }

        if (appointments.some(app => app.date === dateString)) {
            dayEl.classList.add('has-appointment');
        }
        
        dayEl.addEventListener('click', () => {
            selectedDate = dateString;
            renderCalendar();
            filterAndRenderAppointments();
        });

        calendarDays.appendChild(dayEl);
    }
    
    // Next month's days
    for (let i = lastDayOfMonth; i < 6; i++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day other-month';
        dayEl.textContent = String(i - lastDayOfMonth + 1);
        calendarDays.appendChild(dayEl);
    }
}

function filterAndRenderAppointments() {
    if (selectedDate) {
        const filtered = appointments.filter(app => app.date === selectedDate);
        appointmentsListTitle.textContent = `Appointments for ${formatDate(selectedDate)}`;
        showAllAppointmentsBtn.classList.remove('hidden');
        renderAppointments(filtered);
    } else {
        appointmentsListTitle.textContent = 'All Upcoming Appointments';
        showAllAppointmentsBtn.classList.add('hidden');
        renderAppointments(appointments);
    }
}


function formatDate(dateString: string, useLongFormat = true) {
    if (!dateString) return 'Not set';
    const options: Intl.DateTimeFormatOptions = useLongFormat 
        ? { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
        : { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', options);
}

// --- UI EVENT HANDLERS ---
function showContent(sectionToShow) {
    welcomeSection.style.display = 'none';
    contentSections.forEach(section => section.classList.remove('active'));
    sectionToShow.classList.add('active');
}

function showWelcome() {
    contentSections.forEach(section => section.classList.remove('active'));
    welcomeSection.style.display = 'block';
}

function handleDoctorSelect(doctor, cardElement) {
    document.querySelectorAll('.doctor-card').forEach(card => card.classList.remove('selected'));
    cardElement.classList.add('selected');
    selectedDoctor = doctor;
}

function handleBookingSubmit(e: Event) {
    e.preventDefault();
    if (!selectedDoctor) {
        alert('Please select a doctor');
        return;
    }
    const appointmentData = {
        doctor: selectedDoctor.name,
        specialty: selectedDoctor.specialty,
        date: appointmentDate.value,
        time: appointmentTime.value,
        reason: (document.getElementById('appointmentReason') as HTMLTextAreaElement).value
    };

    if (!appointmentData.date || !appointmentData.time || !appointmentData.reason.trim()) {
        alert('Please fill out all appointment details.');
        return;
    }

    // Store data for the confirmation function
    currentAppointmentData = appointmentData;

    // Populate and show modal
    modalAppointmentDetails.innerHTML = `
        <p><strong>Doctor:</strong> ${appointmentData.doctor} (${appointmentData.specialty})</p>
        <p><strong>Date:</strong> ${formatDate(appointmentData.date)}</p>
        <p><strong>Time:</strong> ${appointmentData.time}</p>
        <p><strong>Reason:</strong> ${appointmentData.reason}</p>
    `;
    confirmationModal.classList.remove('hidden');
}

async function confirmAndBookAppointment() {
    if (!currentAppointmentData) return;

    confirmBookingBtn.disabled = true;
    confirmBookingBtn.textContent = 'Booking...';

    try {
        await api.postAppointment(currentAppointmentData);
        // Refetch appointments to update the list
        const response = await api.fetchAppointments();
        appointments = response.data;
        renderCalendar();
        filterAndRenderAppointments();
        
        bookingForm.reset();
        document.querySelectorAll('.doctor-card').forEach(card => card.classList.remove('selected'));
        selectedDoctor = null;
        appointmentForm.classList.remove('active');
        alert('Appointment booked successfully! You will receive a confirmation shortly.');
    } catch (error) {
        console.error("Failed to book appointment:", error);
        alert('There was an error booking your appointment. Please try again.');
    } finally {
        confirmBookingBtn.disabled = false;
        confirmBookingBtn.textContent = 'Confirm Booking';
        confirmationModal.classList.add('hidden');
        currentAppointmentData = null; // Clear the stored data
    }
}


async function handleProfileUpdate(e: Event) {
    e.preventDefault();

    const updatedData = {
        name: editProfileNameInput.value,
        dob: editProfileDobInput.value,
        phone: editProfilePhoneInput.value
    };

    const currentUser = JSON.parse(sessionStorage.getItem(CURRENT_USER_SESSION_key));
    
    try {
        const response = await api.updateUserProfile(currentUser.email, updatedData);
        if (response.data.success) {
            sessionStorage.setItem(CURRENT_USER_SESSION_key, JSON.stringify(response.data.user));
            populateProfileData(response.data.user);
            
            profileDetailsView.classList.remove('hidden');
            profileDetailsEdit.classList.add('hidden');
            editProfileBtn.classList.remove('hidden');
            backFromProfileBtn.classList.remove('hidden');
            alert('Profile updated successfully!');
        }
    // FIX: Type caught error as 'any' to allow accessing properties for error messages.
    } catch (error: any) {
         alert(`Error: ${error.response?.data?.message || 'Update failed.'}`);
    }
}

// --- CHATBOT LOGIC ---

// Helper function to clear quick replies
function clearQuickReplies() {
    if (chatbotQuickReplies) {
        chatbotQuickReplies.innerHTML = '';
        chatbotQuickReplies.style.padding = '0';
    }
}

// Helper function to render quick reply buttons
function renderQuickReplies(replies: string[]) {
    clearQuickReplies();
    if (!chatbotQuickReplies || replies.length === 0) return;

    chatbotQuickReplies.style.padding = '10px 15px';

    replies.forEach(replyText => {
        const button = document.createElement('button');
        button.textContent = replyText;
        button.className = 'quick-reply-btn';
        button.addEventListener('click', () => {
            chatbotInput.value = replyText;
            handleChatSend();
        });
        chatbotQuickReplies.appendChild(button);
    });
}

async function handleChatSend() {
    const userMessage = chatbotInput.value.trim();
    if (userMessage === '') return;

    clearQuickReplies();
    addMessageToUI(userMessage, 'user');
    chatbotInput.value = '';
    chatbotInput.disabled = true;
    chatbotSend.disabled = true;
    typingIndicator.classList.add('active');
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

    try {
        if (!ai) {
             ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        }
        if (!chat) {
            chat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: `You are a knowledgeable and empathetic AI Health Assistant for a platform called HealthCare+. Your goal is to provide helpful, general health information and empower users to make informed decisions about their well-being.

**Your Knowledge Base Includes:**
- **Common Health Conditions:** You can provide overviews of conditions like the common cold, flu, tension headaches, seasonal allergies, and minor sprains. This includes typical symptoms and general home care advice (e.g., rest, hydration).
- **Preventive Care:** You can offer tips on disease prevention, such as the importance of hand washing, staying up-to-date on vaccinations, and routine health screenings.
- **Healthy Lifestyle Choices:** You can give guidance on diet (balanced meals, hydration), exercise (benefits, suggestions for different fitness levels), sleep hygiene, and stress management techniques (e.g., mindfulness, deep breathing).

**Crucial Safety Protocols & Disclaimers:**
1.  **Never Diagnose or Prescribe:** You must NEVER provide a medical diagnosis, prescribe medication, or interpret complex lab results.
2.  **Always Include a Disclaimer:** For any health-related advice, you MUST start your response with a clear disclaimer, such as: "This is general health information and not a substitute for professional medical advice. Please consult a doctor for any health concerns."
3.  **Encourage Professional Consultation:** Always encourage users to consult a healthcare professional for personalized advice, diagnosis, and treatment.
4.  **Recognize Emergencies:** If a user mentions severe symptoms like chest pain, difficulty breathing, sudden severe headache, numbness, or signs of a serious allergic reaction, you MUST immediately advise them to seek emergency medical attention (e.g., "Based on those symptoms, it's important to seek immediate medical attention. Please contact emergency services or go to the nearest hospital.").
5.  **Promote App Features:** When a user's query relates to seeing a doctor or scheduling, seamlessly guide them to use the app's features to book an appointment.

Keep your responses clear, concise, and easy for a layperson to understand. Your tone should be supportive and caring.`
                }
            });
        }
        
        const response = await chat.sendMessage({ message: userMessage });
        typingIndicator.classList.remove('active');
        
        const botResponse = response.text;
        addMessageToUI(botResponse.replace(/\n/g, '<br>'), 'bot');
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

        // Generate and render quick replies
        try {
            const suggestionPrompt = `Based on the following conversation, suggest 3 concise, relevant follow-up questions a user might ask.
USER: "${userMessage}"
ASSISTANT: "${botResponse}"
`;
            const suggestionResponse = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: suggestionPrompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            questions: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.STRING
                                }
                            }
                        }
                    }
                }
            });

            const jsonString = suggestionResponse.text.trim();
            const suggestions = JSON.parse(jsonString);
            if (suggestions.questions && Array.isArray(suggestions.questions)) {
                renderQuickReplies(suggestions.questions);
            }

        } catch (suggestionError) {
            console.error("Failed to generate quick replies:", suggestionError);
            clearQuickReplies(); // Ensure no broken UI if suggestion fails
        }

    } catch (error) {
        console.error("Gemini API error:", error);
        typingIndicator.classList.remove('active');
        addMessageToUI("Sorry, I'm having trouble connecting right now. Please try again later.", 'bot');
    } finally {
        chatbotInput.disabled = false;
        chatbotSend.disabled = false;
        chatbotInput.focus();
    }
}

function createMessageElement(sender: 'user' | 'bot') {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');
    chatbotMessages.appendChild(messageElement);
    return messageElement;
}

function addMessageToUI(text: string, sender: 'user' | 'bot') {
    const messageElement = createMessageElement(sender);
    // Use innerHTML for bot messages to render line breaks (<br>)
    // and textContent for user messages to prevent any potential HTML injection.
    if (sender === 'bot') {
        messageElement.innerHTML = text;
    } else {
        messageElement.textContent = text;
    }
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

// --- INITIALIZATION ---
function setMinDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    appointmentDate.min = `${yyyy}-${mm}-${dd}`;
}

let isAppInitialized = false;

function initializeMainApp() {
    if (isAppInitialized) return;

    setMinDate();
    renderTimeSlots();

    appointmentsBtn.addEventListener('click', async () => {
        showContent(appointmentsContent);
        appointmentsLoader.classList.add('active');
        appointmentList.innerHTML = '';
        try {
            const response = await api.fetchAppointments();
            appointments = response.data;
            renderCalendar();
            filterAndRenderAppointments();
        } catch (e) {
            appointmentList.innerHTML = '<p class="error">Failed to load appointments.</p>';
        } finally {
            appointmentsLoader.classList.remove('active');
        }
    });
    
    hospitalsBtn.addEventListener('click', () => {
        showContent(hospitalsContent);
        hospitalSearchInput.value = '';
        renderHospitals(allHospitals);
    });

    recordsBtn.addEventListener('click', () => showContent(recordsContent));
    
    profileBtn.addEventListener('click', () => {
        showContent(profileContent);
        profileDetailsView.classList.remove('hidden');
        profileDetailsEdit.classList.add('hidden');
        editProfileBtn.classList.remove('hidden');
        backFromProfileBtn.classList.remove('hidden');
    });

    backBtns.forEach(btn => btn.addEventListener('click', showWelcome));

    contactBtn.addEventListener('click', () => {
        alert('Contact our support team at: support@healthcareplus.com or call (555) 123-HELP');
    });

    bookAppointmentBtn.addEventListener('click', async () => {
        appointmentForm.classList.toggle('active');
        if (appointmentForm.classList.contains('active') && doctors.length === 0) {
            doctorsLoader.classList.add('active');
            try {
                const response = await api.fetchDoctors();
                doctors = response.data;
                renderDoctors();
            } catch (e) {
                doctorsGrid.innerHTML = '<p class="error">Failed to load doctors.</p>';
            } finally {
                doctorsLoader.classList.remove('active');
            }
        }
    });

    bookingForm.addEventListener('submit', handleBookingSubmit);

    editProfileBtn.addEventListener('click', () => {
        profileDetailsView.classList.add('hidden');
        profileDetailsEdit.classList.remove('hidden');
        editProfileBtn.classList.add('hidden');
        backFromProfileBtn.classList.add('hidden');
    });

    cancelEditProfileBtn.addEventListener('click', () => {
        const currentUser = JSON.parse(sessionStorage.getItem(CURRENT_USER_SESSION_key));
        populateProfileData(currentUser);
        profileDetailsView.classList.remove('hidden');
        profileDetailsEdit.classList.add('hidden');
        editProfileBtn.classList.remove('hidden');
        backFromProfileBtn.classList.remove('hidden');
    });
    
    profileDetailsEdit.addEventListener('submit', handleProfileUpdate);

    hospitalSearchInput.addEventListener('input', (e) => {
        const searchTerm = (e.target as HTMLInputElement).value.toLowerCase();
        const filteredHospitals = allHospitals.filter(hospital => 
            hospital.name.toLowerCase().includes(searchTerm) || 
            hospital.location.toLowerCase().includes(searchTerm)
        );
        renderHospitals(filteredHospitals);
    });

    // Calendar navigation
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    showAllAppointmentsBtn.addEventListener('click', () => {
        selectedDate = null;
        renderCalendar();
        filterAndRenderAppointments();
    });

    // Chatbot listeners
    chatbotToggle.addEventListener('click', () => chatbotWindow.classList.toggle('active'));
    chatbotClose.addEventListener('click', () => chatbotWindow.classList.remove('active'));
    chatbotSend.addEventListener('click', handleChatSend);
    chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleChatSend();
    });

    // Modal listeners
    confirmBookingBtn.addEventListener('click', confirmAndBookAppointment);
    const closeModal = () => confirmationModal.classList.add('hidden');
    closeModalBtn.addEventListener('click', closeModal);
    cancelBookingBtn.addEventListener('click', closeModal);
    confirmationModal.addEventListener('click', (e) => {
        if (e.target === confirmationModal) {
            closeModal();
        }
    });
    
    isAppInitialized = true;
}

// --- GLOBAL APP START ---
document.addEventListener('DOMContentLoaded', () => {
    loginForm.addEventListener('submit', handleLogin);
    signUpForm.addEventListener('submit', handleSignUp);
    logoutBtn.addEventListener('click', handleLogout);

    showSignUpLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginError.textContent = '';
        loginFormContainer.classList.add('hidden');
        signUpFormContainer.classList.remove('hidden');
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        signUpError.textContent = '';
        signUpFormContainer.classList.add('hidden');
        loginFormContainer.classList.remove('hidden');
    });

    checkAuthStatus();
});