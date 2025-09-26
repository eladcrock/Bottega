// Global application state
let currentUser = null;
let currentView = 'welcome';
let tipEntries = [];
let lastCalculation = null;

// Constants for wage calculations
const HOURLY_WAGE = 16.50;
const PAID_HOURS_PER_DAY = 6.5; // 7 hours minus 0.5 hour unpaid break
const DEFAULT_HOURS = 7;

// Helper function to format dates without timezone issues
function formatDateLocal(dateString) {
    // Parse YYYY-MM-DD format and create date in local timezone
    const [year, month, day] = dateString.split('-');
    const date = new Date(year, month - 1, day); // month is 0-indexed
    return date.toLocaleDateString();
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    // Check if Supabase is configured
    if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
        console.warn('Supabase not configured. Please update supabase-config.js with your project credentials.');
        alert('Please configure Supabase credentials in supabase-config.js file.');
        return;
    }

    // Check for existing user session
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    
    if (session && session.user) {
        currentUser = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata.name || session.user.email.split('@')[0]
        };
        await loadUserData();
        showDashboard();
    } else {
        showView('welcome');
    }
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('shiftDate');
    if (dateInput) {
        dateInput.value = today;
    }
    
    // Setup form event listeners
    setupEventListeners();

    // Listen for auth state changes
    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
            currentUser = {
                id: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata.name || session.user.email.split('@')[0]
            };
            loadUserData();
            showDashboard();
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            tipEntries = [];
            showView('welcome');
        }
    });
}

function setupEventListeners() {
    // Auth form listeners
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Pay period selector
    const payPeriodSelect = document.getElementById('payPeriodSelect');
    if (payPeriodSelect) {
        payPeriodSelect.addEventListener('change', updatePayPeriodSummary);
    }
    
    // Quick entry form
    const quickEntryForm = document.getElementById('quickEntryForm');
    if (quickEntryForm) {
        quickEntryForm.addEventListener('submit', handleQuickEntry);
        
        // Set today's date as default
        const quickDate = document.getElementById('quickDate');
        if (quickDate) {
            quickDate.value = new Date().toISOString().split('T')[0];
        }
    }
}

// View Management
async function showView(viewName) {
    // Hide all views
    const views = document.querySelectorAll('.view');
    views.forEach(view => view.classList.add('hidden'));
    
    // Show navbar for authenticated users
    const navbar = document.getElementById('navbar');
    if (currentUser && viewName !== 'welcome') {
        navbar.classList.remove('hidden');
        document.getElementById('userGreeting').textContent = `Welcome, ${currentUser.name}`;
    } else {
        navbar.classList.add('hidden');
    }
    
    // Show specific view
    const targetView = document.getElementById(viewName + 'View');
    if (targetView) {
        targetView.classList.remove('hidden');
        currentView = viewName;
        
        // Load view-specific data
        switch (viewName) {
            case 'calculator':
                setupCalculatorView();
                break;
            case 'dashboard':
                await loadUserData(); // Refresh data
                loadDashboard();
                break;
            case 'history':
                await loadUserData(); // Refresh data
                loadHistory();
                break;
            case 'analytics':
                await loadUserData(); // Refresh data
                loadAnalytics();
                break;
        }
    }
}

function setupCalculatorView() {
    const guestPrompt = document.getElementById('guestPrompt');
    const savePrompt = document.getElementById('savePrompt');
    
    if (!currentUser) {
        guestPrompt.classList.remove('hidden');
        savePrompt.classList.add('hidden');
    } else {
        guestPrompt.classList.add('hidden');
    }
}

// Authentication with Supabase
function toggleAuth() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const registrationSuccess = document.getElementById('registrationSuccess');
    const registrationFormDiv = document.getElementById('registrationForm');
    const loginError = document.getElementById('loginError');
    
    loginForm.classList.toggle('hidden');
    registerForm.classList.toggle('hidden');
    
    // Hide error messages when switching forms
    loginError.classList.add('hidden');
    
    // Reset registration form when switching
    if (!registerForm.classList.contains('hidden')) {
        registrationSuccess.classList.add('hidden');
        registrationFormDiv.classList.remove('hidden');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Hide any previous error message
    document.getElementById('loginError').classList.add('hidden');
    
    try {
        console.log('Attempting to sign in with email:', email);
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) {
            console.error('Login error:', error);
            console.error('Full error details:', JSON.stringify(error, null, 2));
            
            // Show specific error messages
            if (error.message.includes('Invalid login credentials')) {
                // This is likely due to unconfirmed email
                document.getElementById('loginError').classList.remove('hidden');
            } else if (error.message.includes('email') || error.message.includes('confirm') || 
                       error.message.includes('verify')) {
                document.getElementById('loginError').classList.remove('hidden');
            } else {
                alert('Login failed: ' + error.message);
            }
            return;
        }
        
        console.log('Login successful:', data);
        // currentUser will be set by the auth state change listener
    } catch (networkError) {
        console.error('Network error during login:', networkError);
        alert('Connection failed. Please check your internet connection and try again. \n\nError: ' + networkError.message);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    try {
        console.log('Attempting to register with email:', email);
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: 'https://eladcrock.github.io/Bottega',
                data: {
                    name: name || email.split('@')[0] // Use name if provided, otherwise use email prefix
                }
            }
        });
        
        if (error) {
            console.error('Registration error:', error);
            alert('Registration failed: ' + error.message);
            return;
        }
        
        console.log('Registration successful:', data);
        // Show success message
        document.getElementById('registrationForm').classList.add('hidden');
        document.getElementById('registrationSuccess').classList.remove('hidden');
        
    } catch (networkError) {
        console.error('Network error during registration:', networkError);
        alert('Connection failed. Please check your internet connection and try again. \n\nError: ' + networkError.message);
    }
}

async function resendConfirmation() {
    const email = document.getElementById('loginEmail').value;
    if (!email) {
        alert('Please enter your email address first.');
        return;
    }
    
    try {
        const { error } = await supabaseClient.auth.resend({
            type: 'signup',
            email: email,
            options: {
                emailRedirectTo: 'https://eladcrock.github.io/Bottega'
            }
        });
        
        if (error) {
            console.error('Error resending confirmation:', error);
            alert('Failed to resend confirmation email: ' + error.message);
            return;
        }
        
        alert('Confirmation email sent! Please check your inbox and spam folder.');
    } catch (networkError) {
        console.error('Network error during resend:', networkError);
        alert('Connection failed. Please try again later.');
    }
}

async function logout() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
        console.error('Logout error:', error);
    }
    // currentUser will be cleared by auth state change listener
}

async function handleQuickEntry(e) {
    e.preventDefault();
    
    // Check if user is logged in
    if (!currentUser) {
        alert('Please sign in to save tip entries.');
        showView('welcome');
        return;
    }
    
    const date = document.getElementById('quickDate').value;
    const tips = parseFloat(document.getElementById('quickTips').value);
    const hours = parseFloat(document.getElementById('quickHours').value) || null;
    const notes = document.getElementById('quickNotes').value.trim();
    
    if (!date || !tips || tips <= 0) {
        alert('Please enter a valid date and tip amount.');
        return;
    }
    
    try {
        // Create a simplified tip entry
        const tipEntry = {
            user_id: currentUser.id,
            date: date,
            total_tips: tips,
            hours_worked: hours,
            notes: notes,
            // Simple breakdown for quick entries
            breakdown: {
                netTip: tips,
                totalTips: tips,
                busserTip: 0,
                porterTip: 0,
                hourlyRate: hours ? (tips / hours) : 0
            },
            // Default values for required fields
            net_sales: 0,
            wine_sales: 0,
            num_hosts: 0,
            num_runners: 0
        };
        
        // Save to Supabase
        const { data, error } = await supabaseClient
            .from('tip_entries')
            .insert([tipEntry])
            .select();
        
        if (error) {
            console.error('Error saving quick entry:', error);
            alert('Failed to save tip entry: ' + error.message);
            return;
        }
        
        // Success feedback
        alert('✅ Tip entry saved successfully!');
        
        // Clear the form
        document.getElementById('quickEntryForm').reset();
        document.getElementById('quickDate').value = new Date().toISOString().split('T')[0];
        
        // Reload user data to reflect the new entry
        await loadUserData();
        
    } catch (error) {
        console.error('Error in handleQuickEntry:', error);
        alert('Failed to save tip entry. Please try again.');
    }
}

async function loadUserData() {
    if (!currentUser) return;
    
    console.log('Loading user data for:', currentUser.email);
    
    const { data, error } = await supabaseClient
        .from('tip_entries')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('date', { ascending: false });
    
    if (error) {
        console.error('Error loading tip entries:', error);
        tipEntries = [];
        return;
    }
    
    tipEntries = data || [];
    console.log('Loaded tip entries:', tipEntries.length, 'entries');
}

async function saveUserData() {
    // This function is no longer needed as we save directly to Supabase
    // Kept for compatibility
}

// Tip Calculator (Enhanced with Supabase)
function calculateTip() {
    const totalTips = parseFloat(document.getElementById('totalTips').value) || 0;
    const netSales = parseFloat(document.getElementById('netSales').value) || 0;
    const wineSales = parseFloat(document.getElementById('wineSales').value) || 0;
    const numHosts = parseInt(document.getElementById('numHosts').value) || 0;
    const numRunners = parseInt(document.getElementById('numRunners').value) || 0;

    const BUSSER_PERCENT = 0.16;
    const PORTER_PERCENT = 0.01;
    const SOLO_PERCENT = 0.045;
    const DUO_PERCENT = 0.07;
    const TRIO_PERCENT = 0.09;
    const WINE_PERCENT = 0.03;
    const KITCHEN_TIP = 5;

    let buffTip = 0, hostTip = 0, barTip = 0, totalTip = 0,
        bussTip, sommTip = 0, runTip = 0, kitchenTip = 0;

    if (netSales < 2500) {
        buffTip = netSales * PORTER_PERCENT;
    } else {
        buffTip = 25;
    }

    if (wineSales > 0) {
        sommTip = wineSales * WINE_PERCENT;
    }

    if (numRunners === 3) {
        runTip = totalTips * TRIO_PERCENT;
    } else if (numRunners === 2) {
        runTip = totalTips * DUO_PERCENT;
    } else if (numRunners === 1) {
        runTip = totalTips * SOLO_PERCENT;
    }

    if (numHosts === 3) {
        hostTip = totalTips * TRIO_PERCENT;
    } else if (numHosts === 2) {
        hostTip = totalTips * DUO_PERCENT;
    } else if (numHosts === 1) {
        hostTip = totalTips * SOLO_PERCENT;
    }

    bussTip = totalTips * BUSSER_PERCENT;
    barTip = totalTips * DUO_PERCENT;

    if (totalTips > 0) {
        kitchenTip = KITCHEN_TIP;
    }

    const netTip = totalTips - bussTip - sommTip - hostTip - runTip - buffTip - barTip - kitchenTip;
    totalTip = totalTips - netTip;

    // Store calculation for potential saving
    lastCalculation = {
        date: document.getElementById('shiftDate').value,
        hours_worked: parseFloat(document.getElementById('hoursWorked').value) || 7,
        notes: document.getElementById('notes').value,
        total_tips: totalTips,
        net_sales: netSales,
        wine_sales: wineSales,
        num_hosts: numHosts,
        num_runners: numRunners,
        breakdown: {
            bussTip,
            sommTip,
            buffTip,
            runTip,
            barTip,
            hostTip,
            kitchenTip,
            netTip,
            totalTip
        }
    };

    document.getElementById('output').innerHTML = `
        <p>Based on a NET of $${netSales.toFixed(2)}</p>
        <p>Wine sales of $${wineSales.toFixed(2)},</p>
        <p>with ${numHosts} Hosts, ${numRunners} Runners,</p>
        <p>You will tip-out:</p>
        <p>$${bussTip.toFixed(2)} to Busser</p>
        <p>$${sommTip.toFixed(2)} to Somm</p>
        <p>$${buffTip.toFixed(2)} to Porter</p>
        <p>$${runTip.toFixed(2)} to Runner(s)</p>
        <p>$${barTip.toFixed(2)} to Bar</p>
        <p>$${hostTip.toFixed(2)} to Host(s)</p>
        <p>$${kitchenTip.toFixed(2)} to Kitchen</p>
        <p><strong>Server tips: $${netTip.toFixed(2)}</strong></p>
        <p>Total tipout: $${totalTip.toFixed(2)}</p>
    `;

    document.getElementById('results').classList.remove('hidden');
    
    // Show appropriate navigation options
    if (currentUser) {
        document.getElementById('savePrompt').classList.remove('hidden');
        document.getElementById('guestBackPrompt').classList.add('hidden');
    } else {
        document.getElementById('guestBackPrompt').classList.remove('hidden');
    }
}

async function saveTipEntry() {
    if (!currentUser || !lastCalculation) return;
    
    try {
        // Check if entry for this date already exists
        const { data: existingEntry } = await supabaseClient
            .from('tip_entries')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('date', lastCalculation.date)
            .single();
        
        const entryData = {
            user_id: currentUser.id,
            ...lastCalculation
        };
        
        if (existingEntry) {
            if (confirm('An entry for this date already exists. Do you want to update it?')) {
                const { error } = await supabaseClient
                    .from('tip_entries')
                    .update(entryData)
                    .eq('id', existingEntry.id);
                
                if (error) throw error;
            } else {
                return;
            }
        } else {
            const { error } = await supabaseClient
                .from('tip_entries')
                .insert([entryData]);
            
            if (error) throw error;
        }
        
        await loadUserData(); // Refresh data
        alert('Tip entry saved successfully!');
        document.getElementById('savePrompt').classList.add('hidden');
        
    } catch (error) {
        console.error('Error saving tip entry:', error);
        alert('Failed to save tip entry: ' + error.message);
    }
}

function clearResults() {
    // Hide results and clear form
    document.getElementById('results').classList.add('hidden');
    
    // Reset the form to clear all fields
    document.getElementById('tipForm').reset();
    
    // Set today's date as the default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('shiftDate').value = today;
}

// Dashboard Functions
function showDashboard() {
    showView('dashboard');
}

async function loadDashboard() {
    if (!currentUser) return;
    
    const now = new Date();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Weekly total
    const weeklyEntries = tipEntries.filter(entry => new Date(entry.date) >= weekStart);
    const weeklyTotal = weeklyEntries.reduce((sum, entry) => sum + entry.breakdown.netTip, 0);
    
    // Monthly total
    const monthlyEntries = tipEntries.filter(entry => new Date(entry.date) >= monthStart);
    const monthlyTotal = monthlyEntries.reduce((sum, entry) => sum + entry.breakdown.netTip, 0);
    
    // Calculate hourly rates with 7 hour default
    let totalWorkHours = 0;
    let totalTipEarnings = 0;
    let totalShifts = tipEntries.length;
    
    tipEntries.forEach(entry => {
        // Use 7 hours default if no hours entered or hours is 0
        const workHours = entry.hours_worked && entry.hours_worked > 0 ? entry.hours_worked : DEFAULT_HOURS;
        
        totalWorkHours += workHours;
        totalTipEarnings += entry.breakdown.netTip;
    });
    
    const avgTipPerHour = totalWorkHours > 0 ? totalTipEarnings / totalWorkHours : 0;
    
    // Calculate total hourly: wage per hour + tip per hour
    const wagePerHour = totalShifts > 0 ? (HOURLY_WAGE * PAID_HOURS_PER_DAY * totalShifts) / totalWorkHours : 0;
    const totalHourlyRate = wagePerHour + avgTipPerHour;
    
    // Update dashboard elements
    document.getElementById('weeklyTotal').textContent = `$${weeklyTotal.toFixed(2)}`;
    document.getElementById('monthlyTotal').textContent = `$${monthlyTotal.toFixed(2)}`;
    document.getElementById('avgPerHour').textContent = `$${avgTipPerHour.toFixed(2)}`;
    document.getElementById('totalWages').textContent = `$${totalHourlyRate.toFixed(2)}`;
    
    updatePayPeriodSummary();
}

function updatePayPeriodSummary() {
    if (!currentUser) return;
    
    const select = document.getElementById('payPeriodSelect');
    const isCurrentPeriod = select.value === 'current';
    
    const now = new Date();
    let startDate, endDate;
    
    // Calculate pay period dates (1st-15th or 16th-end of month)
    if (now.getDate() <= 15) {
        // First half of month
        if (isCurrentPeriod) {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 15);
        } else {
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 16);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of previous month
        }
    } else {
        // Second half of month
        if (isCurrentPeriod) {
            startDate = new Date(now.getFullYear(), now.getMonth(), 16);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
        } else {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 15);
        }
    }
    
    const periodEntries = tipEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startDate && entryDate <= endDate;
    });
    
    // Calculate tip earnings for period
    const periodTipTotal = periodEntries.reduce((sum, entry) => sum + entry.breakdown.netTip, 0);
    
    // Calculate hours worked for period
    let totalHours = 0;
    periodEntries.forEach(entry => {
        const workHours = entry.hours_worked && entry.hours_worked > 0 ? entry.hours_worked : DEFAULT_HOURS;
        totalHours += workHours;
    });
    
    // Calculate base wage earnings for period
    const numShifts = periodEntries.length;
    const baseWageTotal = HOURLY_WAGE * PAID_HOURS_PER_DAY * numShifts;
    
    // Total gross pay (tips + wages)
    const grossPay = periodTipTotal + baseWageTotal;
    
    // Calculate comprehensive California tax and payroll deductions
    // This includes: Federal tax, CA state tax, Social Security, Medicare, CA SDI, CA ETT
    // Using simplified rates for typical server income levels in California
    const deductionRate = parseFloat(document.getElementById('taxBracket').value);
    const totalDeductions = grossPay * (deductionRate / 100);
    const netPay = grossPay - totalDeductions;
    
    // Update display
    document.getElementById('payPeriodDates').textContent = 
        `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    document.getElementById('payPeriodTotal').textContent = `$${grossPay.toFixed(2)}`;
    document.getElementById('estimatedTax').textContent = `-$${totalDeductions.toFixed(2)}`;
    document.getElementById('netPay').textContent = `$${netPay.toFixed(2)}`;
}

// History Functions
async function loadHistory() {
    if (!currentUser) return;
    
    const sortedEntries = [...tipEntries].sort((a, b) => new Date(b.date) - new Date(a.date));
    const historyList = document.getElementById('historyList');
    
    if (sortedEntries.length === 0) {
        historyList.innerHTML = '<p class="no-data">No tip entries found. Start by calculating some tips!</p>';
        return;
    }
    
    historyList.innerHTML = sortedEntries.map(entry => {
        // Calculate total hourly for this entry
        const workHours = entry.hours_worked && entry.hours_worked > 0 ? entry.hours_worked : DEFAULT_HOURS;
        const tipPerHour = entry.breakdown.netTip / workHours;
        const wagePerHour = (HOURLY_WAGE * PAID_HOURS_PER_DAY) / workHours;
        const totalHourly = wagePerHour + tipPerHour;
        
        return `
        <div class="history-item">
            <div class="history-date">${formatDateLocal(entry.date)}</div>
            <div class="history-details">
                <div><strong>Net Tips:</strong> $${entry.breakdown.netTip.toFixed(2)}</div>
                ${entry.hours_worked && entry.hours_worked > 0 ? `<div><strong>Hours:</strong> ${entry.hours_worked}h</div>` : ''}
                ${entry.hours_worked && entry.hours_worked > 0 ? `<div><strong>Tips/Hr:</strong> $${(entry.breakdown.netTip / entry.hours_worked).toFixed(2)}</div>` : ''}
                <div><strong>Total Hourly:</strong> $${totalHourly.toFixed(2)}</div>
                ${entry.notes ? `<div><strong>Notes:</strong> ${entry.notes}</div>` : ''}
            </div>
            <div class="history-amount">$${entry.breakdown.netTip.toFixed(2)}</div>
            <div class="history-actions">
                <button class="btn btn-secondary btn-small" onclick="editEntry('${entry.id}')">Edit</button>
                <button class="btn btn-secondary btn-small" onclick="deleteEntry('${entry.id}')">Delete</button>
            </div>
        </div>`;
    }).join('');
}

function filterHistory() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
        loadHistory(); // Show all if no dates selected
        return;
    }
    
    const filteredEntries = tipEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const historyList = document.getElementById('historyList');
    
    if (filteredEntries.length === 0) {
        historyList.innerHTML = '<p class="no-data">No entries found for the selected date range.</p>';
        return;
    }
    
    historyList.innerHTML = filteredEntries.map(entry => {
        // Calculate total hourly for this entry
        const workHours = entry.hours_worked && entry.hours_worked > 0 ? entry.hours_worked : DEFAULT_HOURS;
        const tipPerHour = entry.breakdown.netTip / workHours;
        const wagePerHour = (HOURLY_WAGE * PAID_HOURS_PER_DAY) / workHours;
        const totalHourly = wagePerHour + tipPerHour;
        
        return `
        <div class="history-item">
            <div class="history-date">${formatDateLocal(entry.date)}</div>
            <div class="history-details">
                <div><strong>Net Tips:</strong> $${entry.breakdown.netTip.toFixed(2)}</div>
                ${entry.hours_worked && entry.hours_worked > 0 ? `<div><strong>Hours:</strong> ${entry.hours_worked}h</div>` : ''}
                ${entry.hours_worked && entry.hours_worked > 0 ? `<div><strong>Tips/Hr:</strong> $${(entry.breakdown.netTip / entry.hours_worked).toFixed(2)}</div>` : ''}
                <div><strong>Total Hourly:</strong> $${totalHourly.toFixed(2)}</div>
                ${entry.notes ? `<div><strong>Notes:</strong> ${entry.notes}</div>` : ''}
            </div>
            <div class="history-amount">$${entry.breakdown.netTip.toFixed(2)}</div>
            <div class="history-actions">
                <button class="btn btn-secondary btn-small" onclick="editEntry('${entry.id}')">Edit</button>
                <button class="btn btn-secondary btn-small" onclick="deleteEntry('${entry.id}')">Delete</button>
            </div>
        </div>`;
    }).join('');
}

async function editEntry(entryId) {
    const entry = tipEntries.find(e => e.id === entryId);
    if (!entry) return;
    
    // Populate calculator form with entry data
    document.getElementById('shiftDate').value = entry.date;
    document.getElementById('hoursWorked').value = entry.hours_worked;
    document.getElementById('totalTips').value = entry.total_tips;
    document.getElementById('netSales').value = entry.net_sales;
    document.getElementById('wineSales').value = entry.wine_sales;
    document.getElementById('numHosts').value = entry.num_hosts;
    document.getElementById('numRunners').value = entry.num_runners;
    document.getElementById('notes').value = entry.notes || '';
    
    // Switch to calculator view
    showView('calculator');
    
    // Calculate with existing data
    calculateTip();
}

async function deleteEntry(entryId) {
    if (confirm('Are you sure you want to delete this entry?')) {
        try {
            const { error } = await supabaseClient
                .from('tip_entries')
                .delete()
                .eq('id', entryId);
            
            if (error) throw error;
            
            await loadUserData(); // Refresh data
            loadHistory(); // Refresh the list
            
            // Refresh analytics if currently viewing them
            const currentView = document.querySelector('.view-section:not(.hidden)');
            if (currentView && currentView.id === 'analytics') {
                loadAnalytics();
            }
            
        } catch (error) {
            console.error('Error deleting entry:', error);
            alert('Failed to delete entry: ' + error.message);
        }
    }
}

// Analytics Functions
let currentAnalyticsView = 'tips';
let dayChart = null;
let timeChart = null;

function toggleAnalytics(viewType) {
    currentAnalyticsView = viewType;
    
    // Update button states
    document.getElementById('tipsToggle').classList.toggle('active', viewType === 'tips');
    document.getElementById('hourlyToggle').classList.toggle('active', viewType === 'hourly');
    
    // Update chart titles
    if (viewType === 'tips') {
        document.getElementById('dayChartTitle').textContent = 'Tips by Day of Week';
        document.getElementById('timeChartTitle').textContent = 'Tips Over Time';
    } else {
        document.getElementById('dayChartTitle').textContent = 'Total Hourly Rate by Day of Week';
        document.getElementById('timeChartTitle').textContent = 'Total Hourly Rate Over Time';
    }
    
    // Recreate all analytics with new data
    createBestDaysAnalysis();
    createDayOfWeekChart();
    createTimeChart();
}

async function loadAnalytics() {
    if (!currentUser || tipEntries.length === 0) {
        document.getElementById('dayChart').parentElement.innerHTML = '<p class="no-data">No data available for analytics. Add some tip entries first!</p>';
        document.getElementById('timeChart').parentElement.innerHTML = '<p class="no-data">No data available for analytics. Add some tip entries first!</p>';
        document.getElementById('bestDaysAnalysis').innerHTML = '<div class="no-data-analytics">No data available for best days analysis. Add some tip entries first!</div>';
        return;
    }
    
    createBestDaysAnalysis();
    createDayOfWeekChart();
    createTimeChart();
}

function createBestDaysAnalysis() {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayTotals = {};
    
    // Initialize day totals
    dayNames.forEach(day => {
        dayTotals[day] = { total: 0, count: 0, entries: [] };
    });
    
    // Calculate totals by day
    tipEntries.forEach(entry => {
        const dayOfWeek = new Date(entry.date).getDay();
        const dayName = dayNames[dayOfWeek];
        
        if (currentAnalyticsView === 'tips') {
            dayTotals[dayName].total += entry.breakdown.netTip;
            dayTotals[dayName].entries.push(entry.breakdown.netTip);
        } else {
            // Calculate total hourly rate
            const hoursWorked = entry.hours_worked && entry.hours_worked > 0 ? entry.hours_worked : DEFAULT_HOURS;
            const basePay = HOURLY_WAGE * PAID_HOURS_PER_DAY;
            const totalPay = basePay + entry.breakdown.netTip;
            const hourlyRate = totalPay / hoursWorked;
            
            dayTotals[dayName].total += hourlyRate;
            dayTotals[dayName].entries.push(hourlyRate);
        }
        dayTotals[dayName].count += 1;
    });
    
    // Sort days by average earnings (highest first)
    const sortedDays = Object.entries(dayTotals)
        .map(([day, data]) => ({
            day,
            average: data.count > 0 ? data.total / data.count : 0,
            count: data.count,
            total: data.total
        }))
        .sort((a, b) => b.average - a.average);
    
    // Generate HTML for best days analysis
    const bestDaysHTML = sortedDays.map((dayData, index) => {
        const isBestDay = index === 0 && dayData.count > 0;
        const avgDisplay = dayData.average > 0 ? `$${dayData.average.toFixed(2)}` : '-';
        const countDisplay = dayData.count > 0 ? `${dayData.count} shift${dayData.count !== 1 ? 's' : ''}` : 'No shifts';
        
        return `
            <div class="day-stat-card ${isBestDay ? 'best-day' : ''}">
                <div class="day-name">${dayData.day}</div>
                <div class="day-average">${avgDisplay}</div>
                <div class="day-count">${countDisplay}</div>
            </div>
        `;
    }).join('');
    
    document.getElementById('bestDaysAnalysis').innerHTML = bestDaysHTML;
}

function createDayOfWeekChart() {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayTotals = new Array(7).fill(0);
    const dayCounts = new Array(7).fill(0);
    
    tipEntries.forEach(entry => {
        const dayOfWeek = new Date(entry.date).getDay();
        if (currentAnalyticsView === 'tips') {
            dayTotals[dayOfWeek] += entry.breakdown.netTip;
        } else {
            // Calculate total hourly rate (base wage + tips per hour)
            const hoursWorked = entry.hours_worked && entry.hours_worked > 0 ? entry.hours_worked : DEFAULT_HOURS;
            const basePay = HOURLY_WAGE * PAID_HOURS_PER_DAY;
            const totalPay = basePay + entry.breakdown.netTip;
            const hourlyRate = totalPay / hoursWorked;
            dayTotals[dayOfWeek] += hourlyRate;
        }
        dayCounts[dayOfWeek] += 1;
    });
    
    // Calculate averages
    const dayAverages = dayTotals.map((total, index) => 
        dayCounts[index] > 0 ? total / dayCounts[index] : 0
    );
    
    // Destroy existing chart if it exists
    if (dayChart) {
        dayChart.destroy();
    }
    
    const ctx = document.getElementById('dayChart').getContext('2d');
    const label = currentAnalyticsView === 'tips' ? 'Average Tips by Day' : 'Average Hourly Rate by Day';
    const tooltipLabel = currentAnalyticsView === 'tips' ? 'Average Tips' : 'Average Hourly Rate';
    
    dayChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dayNames,
            datasets: [{
                label: label,
                data: dayAverages,
                backgroundColor: [
                    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
                    '#FECA57', '#FF9FF3', '#54A0FF'
                ],
                borderColor: '#667eea',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toFixed(0);
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${tooltipLabel}: $${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    });
}

function createTimeChart() {
    const sortedEntries = [...tipEntries].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Destroy existing chart if it exists
    if (timeChart) {
        timeChart.destroy();
    }
    
    const ctx = document.getElementById('timeChart').getContext('2d');
    let data, label, tooltipLabel;
    
    if (currentAnalyticsView === 'tips') {
        data = sortedEntries.map(entry => entry.breakdown.netTip);
        label = 'Net Tips';
        tooltipLabel = 'Tips';
    } else {
        data = sortedEntries.map(entry => {
            const hoursWorked = entry.hours_worked && entry.hours_worked > 0 ? entry.hours_worked : DEFAULT_HOURS;
            const basePay = HOURLY_WAGE * PAID_HOURS_PER_DAY;
            const totalPay = basePay + entry.breakdown.netTip;
            return totalPay / hoursWorked;
        });
        label = 'Total Hourly Rate';
        tooltipLabel = 'Hourly Rate';
    }
    
    timeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedEntries.map(entry => formatDateLocal(entry.date)),
            datasets: [{
                label: label,
                data: data,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toFixed(0);
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${tooltipLabel}: $${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    });
}

// Dashboard Functions
function showDashboard() {
    showView('dashboard');
}
