window.addEventListener('DOMContentLoaded', () => {
    const balance = document.getElementById('balance');
    const money_plus = document.getElementById('money-plus');
    const money_minus = document.getElementById('money-minus');
    const list = document.getElementById('list');
    const form = document.getElementById('form');
    const text = document.getElementById('text');
    const amount = document.getElementById('amount');
    const category = document.getElementById('category');
    const typeIncome = document.getElementById('type-income');
    const typeExpense = document.getElementById('type-expense');

    const incomeCategories = ['Salary', 'Pocket Money', 'Other'];
    const expenseCategories = ['Food', 'Travel', 'Other'];

    // Load data from LocalStorage
    const localStorageTransactions = JSON.parse(
        localStorage.getItem('transactions')
    );

    let transactions =
        localStorage.getItem('transactions') !== null ? localStorageTransactions : [];

    // Dynamically update categories based on type selection
    function updateCategories() {
        const type = typeIncome.checked ? 'income' : 'expense';
        const categories = type === 'income' ? incomeCategories : expenseCategories;
        
        category.innerHTML = '';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.innerText = cat;
            category.appendChild(option);
        });
    }

    typeIncome.addEventListener('change', updateCategories);
    typeExpense.addEventListener('change', updateCategories);
    
    // Add transaction logic
    function addTransaction(e) {
        e.preventDefault();

        if (amount.value.trim() === '' || +amount.value <= 0) {
            // Apply error shake class
            form.classList.add('error-state');
            setTimeout(() => form.classList.remove('error-state'), 400);
            return;
        }

        const isIncome = typeIncome.checked;
        const finalAmount = isIncome ? +amount.value : -Math.abs(+amount.value);
        
        const description = text.value.trim();
        const transactionText = description ? `${category.value} (${description})` : category.value;

        const transaction = {
            id: generateID(),
            text: transactionText,
            amount: finalAmount
        };

        transactions.push(transaction);

        addTransactionDOM(transaction);
        updateValues();
        updateLocalStorage();

        // Reset fields
        text.value = '';
        amount.value = '';
        amount.focus(); // Focus back to amount since it's the primary input
    }

    // Generate random internal ID
    function generateID() {
        return Math.floor(Math.random() * 100000000);
    }

    // Insert transaction into DOM
    function addTransactionDOM(transaction) {
        // Determine minus or plus sign
        const sign = transaction.amount < 0 ? '-' : '+';
        const item = document.createElement('li');

        // Add class based on value
        item.classList.add(transaction.amount < 0 ? 'minus' : 'plus');

        // Render HTML content for the item
        item.innerHTML = `
      <span class="text">${transaction.text}</span> 
      <span class="amount">${sign}₹${Math.abs(transaction.amount).toFixed(2)}</span>
      <button class="delete-btn" onclick="removeTransaction(${transaction.id})">×</button>
    `;

        list.appendChild(item);
    }

    // Update balances and UI totals
    function updateValues() {
        const amounts = transactions.map(transaction => transaction.amount);

        const total = amounts.reduce((acc, item) => (acc += item), 0).toFixed(2);

        const income = amounts
            .filter(item => item > 0)
            .reduce((acc, item) => (acc += item), 0)
            .toFixed(2);

        const expense = (
            amounts.filter(item => item < 0).reduce((acc, item) => (acc += item), 0) *
            -1
        ).toFixed(2);

        balance.innerText = `₹${total}`;
        money_plus.innerText = `+₹${income}`;
        money_minus.innerText = `-₹${expense}`;
    }

    // Remove transaction via History Button
    window.removeTransaction = function(id) {
        transactions = transactions.filter(transaction => transaction.id !== id);
        updateLocalStorage();
        init(); // Refresh UI list
    };

    // Keep LocalStorage synced with transactions array
    function updateLocalStorage() {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }

    // Master initialize function
    function init() {
        // Clear current list elements
        list.innerHTML = '';
        
        // Loop through all data to rebuild list
        transactions.forEach(addTransactionDOM);
        updateValues();
        updateCategories();
    }

    // Initial Load function call
    init();

    // Attach Submission Event Listener
    form.addEventListener('submit', addTransaction);
});