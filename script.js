window.addEventListener('DOMContentLoaded', () => {
    // Auth Elements
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const authForm = document.getElementById('auth-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const authTitle = document.getElementById('auth-title');
    const authSubmitBtn = document.getElementById('auth-submit-btn');
    const authSwitchLink = document.getElementById('auth-switch-link');
    const authSwitchText = document.getElementById('auth-switch-text');
    const logoutBtn = document.getElementById('logout-btn');
    const currentUserNameDisplay = document.getElementById('current-user-name');

    // App Elements
    const balance = document.getElementById('balance');
    const money_plus = document.getElementById('money-plus');
    const money_minus = document.getElementById('money-minus');
    const list = document.getElementById('list');
    const form = document.getElementById('form');
    const text = document.getElementById('text');
    const amount = document.getElementById('amount');
    const dateInput = document.getElementById('date');
    const category = document.getElementById('category');
    const typeIncome = document.getElementById('type-income');
    const typeExpense = document.getElementById('type-expense');
    const filterSelect = document.getElementById('filter');
    const periodMoneyPlus = document.getElementById('period-money-plus');
    const periodMoneyMinus = document.getElementById('period-money-minus');

    // --- State Variables ---
    let transactions = [];
    let isLoginMode = true;
    let currentUser = null;

    const incomeCategories = ['Salary', 'Pocket Money', 'Other'];
    const expenseCategories = ['Food', 'Travel', 'Other'];

    // --- AUTHENTICATION LOGIC ---
    const users = JSON.parse(localStorage.getItem('expense_users')) || [];

    authSwitchLink.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        if (isLoginMode) {
            authTitle.innerText = 'Login';
            authSubmitBtn.innerText = 'Login';
            authSwitchText.innerText = "Don't have an account?";
            authSwitchLink.innerText = 'Sign Up';
        } else {
            authTitle.innerText = 'Sign Up';
            authSubmitBtn.innerText = 'Sign Up';
            authSwitchText.innerText = 'Already have an account?';
            authSwitchLink.innerText = 'Login';
        }
    });

    authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!username || !password) {
            alert('Please fill all fields');
            return;
        }

        if (isLoginMode) {
            const user = users.find(u => u.username === username && u.password === password);
            if (user) {
                login(user.username);
            } else {
                alert('Invalid credentials');
            }
        } else {
            if (users.find(u => u.username === username)) {
                alert('Username already exists');
                return;
            }
            users.push({ username, password });
            localStorage.setItem('expense_users', JSON.stringify(users));
            alert('Signup successful! You can now log in.');
            
            // Auto switch back to login
            authSwitchLink.click();
            usernameInput.value = username;
            passwordInput.value = '';
        }
    });

    function login(username) {
        currentUser = username;
        localStorage.setItem('expense_currentUser', currentUser);
        
        // Hide auth, show app
        authContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        currentUserNameDisplay.innerText = currentUser;
        
        // Default date to today
        dateInput.valueAsDate = new Date();
        updateCategories();
        
        // Load user-specific transactions
        loadUserTransactions();
        
        // Initialize dashboard
        init();
    }

    logoutBtn.addEventListener('click', () => {
        currentUser = null;
        localStorage.removeItem('expense_currentUser');
        transactions = []; // Wipe RAM cache
        
        // Show auth, hide app
        appContainer.classList.add('hidden');
        authContainer.classList.remove('hidden');
        
        usernameInput.value = '';
        passwordInput.value = '';
    });

    function loadUserTransactions() {
        if (!currentUser) return;
        const key = `transactions_${currentUser}`;
        const stored = JSON.parse(localStorage.getItem(key));
        transactions = stored !== null ? stored : [];
    }

    function updateLocalStorage() {
        if (!currentUser) return;
        const key = `transactions_${currentUser}`;
        localStorage.setItem(key, JSON.stringify(transactions));
    }


    // --- APP LOGIC ---

    function updateCategories() {
        const type = typeIncome.checked ? 'income' : 'expense';
        const categories = type === 'income' ? incomeCategories : expenseCategories;
        
        const datalist = document.getElementById('category-options');
        datalist.innerHTML = '';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            datalist.appendChild(option);
        });

        if (incomeCategories.includes(category.value) || expenseCategories.includes(category.value)) {
            category.value = '';
        }
    }

    typeIncome.addEventListener('change', updateCategories);
    typeExpense.addEventListener('change', updateCategories);

    function getWeek(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
    }

    function updatePeriodicSummary() {
        const filterStr = filterSelect.value;
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const currentWeek = getWeek(now);

        const filtered = transactions.filter(t => {
            if (!t.date) return true; 
            const parts = t.date.split('-');
            const tDate = new Date(parts[0], parts[1] - 1, parts[2]);

            if (filterStr === 'yearly') {
                return tDate.getFullYear() === currentYear;
            } else if (filterStr === 'monthly') {
                return tDate.getFullYear() === currentYear && tDate.getMonth() === currentMonth;
            } else if (filterStr === 'weekly') {
                return tDate.getFullYear() === currentYear && getWeek(tDate) === currentWeek;
            }
            return true;
        });

        const amounts = filtered.map(transaction => transaction.amount);
        const income = amounts.filter(item => item > 0).reduce((acc, item) => (acc += item), 0).toFixed(2);
        const expense = (amounts.filter(item => item < 0).reduce((acc, item) => (acc += item), 0) * -1).toFixed(2);

        periodMoneyPlus.innerText = `+₹${income}`;
        periodMoneyMinus.innerText = `-₹${expense}`;
    }

    function addTransaction(e) {
        e.preventDefault();

        if (amount.value.trim() === '' || +amount.value <= 0) {
            alert('Please enter a valid positive amount');
            return;
        }
        
        if (!dateInput.value) {
            alert('Please select a date');
            return;
        }

        const isIncome = typeIncome.checked;
        const finalAmount = isIncome ? +amount.value : -Math.abs(+amount.value);
        
        const description = text.value.trim();
        const customCategoryClass = category.value.trim();
        
        const transactionText = description ? `${customCategoryClass} (${description})` : customCategoryClass;

        const transaction = {
            id: generateID(),
            text: transactionText,
            amount: finalAmount,
            date: dateInput.value
        };

        transactions.push(transaction);

        updateLocalStorage();
        init(); 

        text.value = '';
        amount.value = '';
        category.value = '';
        amount.focus(); 
    }

    function generateID() {
        return Math.floor(Math.random() * 100000000);
    }

    function addTransactionDOM(transaction) {
        const sign = transaction.amount < 0 ? '-' : '+';
        const item = document.createElement('li');

        item.classList.add(transaction.amount < 0 ? 'minus' : 'plus');

        let dateStr = 'No date';
        if (transaction.date) {
            const parts = transaction.date.split('-');
            const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
            dateStr = dateObj.toLocaleDateString();
        }

        item.innerHTML = `
            <div class="transaction-info">
                <span class="text">${transaction.text}</span>
                <span class="transaction-date">${dateStr}</span>
            </div>
            <span class="amount">${sign}₹${Math.abs(transaction.amount).toFixed(2)}</span>
            <button class="delete-btn" onclick="removeTransaction(${transaction.id})">Delete</button>
        `;

        list.appendChild(item);
    }

    function updateValues() {
        const amounts = transactions.map(transaction => transaction.amount);
        const total = amounts.reduce((acc, item) => (acc += item), 0).toFixed(2);
        const income = amounts.filter(item => item > 0).reduce((acc, item) => (acc += item), 0).toFixed(2);
        const expense = (amounts.filter(item => item < 0).reduce((acc, item) => (acc += item), 0) * -1).toFixed(2);

        balance.innerText = `₹${total}`;
        money_plus.innerText = `+₹${income}`;
        money_minus.innerText = `-₹${expense}`;
    }

    window.removeTransaction = function(id) {
        transactions = transactions.filter(transaction => transaction.id !== id);
        updateLocalStorage();
        init(); 
    };

    function init() {
        list.innerHTML = '';
        
        const sorted = [...transactions].sort((a, b) => {
            const dateA = a.date ? new Date(a.date) : new Date(0);
            const dateB = b.date ? new Date(b.date) : new Date(0);
            return dateB - dateA;
        });

        sorted.forEach(addTransactionDOM);
        
        updateValues();
        updatePeriodicSummary();
    }

    // --- EVENT LISTENERS ---
    filterSelect.addEventListener('change', updatePeriodicSummary);
    form.addEventListener('submit', addTransaction);

    // --- BOOT PROCESS ---
    const activeSession = localStorage.getItem('expense_currentUser');
    if (activeSession) {
        login(activeSession);
    } else {
        appContainer.classList.add('hidden');
        authContainer.classList.remove('hidden');
    }
});