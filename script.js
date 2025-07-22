let totalIncome = 0;
let totalExpenses = 0;
let salaryList = [];
let monthlyData = {};
let categoryTotals = {
    "Home": 0,
    "Transportation": 0,
    "Daily Living": 0,
    "Entertainment": 0,
    "Health": 0,
    "Vacation": 0
};

const expenseOptions = {
    "Home": ["Lot Rent", "PLDT WIFI", "Electricity", "Water", "Maintenance/Improvements", "Appliances/Furnishing", "Other"],
    "Transportation": ["Motor Installment", "Fuel", "Parking", "Repairs/Maintenance", "Public Transportation", "Registration/License", "Other"],
    "Daily Living": ["Groceries", "Child Care", "Dining Out", "Clothing", "Salon/Barber", "Water Refills", "Gas Tank", "Rice", "Other"],
    "Entertainment": ["Netflix", "Disney", "Youtube", "Other"],
    "Health": ["GYM Membership", "Doctors/Dentist Visits", "Medicines", "Other"],
    "Vacation": ["Accomodation", "Food", "Fare", "Other"]
};

function updateExpenseOptions() {
    const category = document.getElementById('expenseCategory').value;
    const expenseDropdown = document.getElementById('expenseName');
    expenseDropdown.innerHTML = '<option value="">Select Expense</option>';
    if (expenseOptions[category]) {
        expenseOptions[category].forEach(item => {
            const option = document.createElement('option');
            option.value = item;
            option.textContent = item;
            expenseDropdown.appendChild(option);
        });
    }
}

function addSalary() {
    const amount = parseFloat(document.getElementById('salaryAmount').value);
    const owner = document.getElementById('salaryOwner').value;
    const date = document.getElementById('salaryDate').value;
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid salary amount.');
        return;
    }
    if (!date) {
        alert('Please select a date.');
        return;
    }
    salaryList.push({
        id: Date.now(),
        owner,
        date,
        amount
    });
    totalIncome += amount;
    const monthKey = date.slice(0, 7);
    if (!monthlyData[monthKey]) monthlyData[monthKey] = {
        salary: 0,
        expenses: 0
    };
    monthlyData[monthKey].salary += amount;
    updateSalaryTable();
    updateMonthlyTable();
    updateRemaining();
    document.getElementById('salaryAmount').value = '';
    document.getElementById('salaryDate').value = '';
}

function updateSalaryTable() {
    const tbody = document.querySelector('#salaryTable tbody');
    tbody.innerHTML = '';
    salaryList.forEach(salary => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${salary.owner}</td>
            <td>${formatDate(salary.date)}</td>
            <td>₱${salary.amount.toLocaleString()}</td>
            <td>
                <button onclick="editSalary(${salary.id})" class="btn-edit">Edit</button>
                <button onclick="deleteSalary(${salary.id})" class="btn-delete">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    document.getElementById('totalIncome').innerText = totalIncome.toLocaleString();
}

function updateMonthlyTable() {
    const tbody = document.querySelector('#monthlyTable tbody');
    tbody.innerHTML = '';
    const sortedMonths = Object.keys(monthlyData).sort();
    sortedMonths.forEach(monthKey => {
        const data = monthlyData[monthKey];
        const remaining = data.salary - data.expenses;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatMonth(monthKey)}</td>
            <td>₱${data.salary.toLocaleString()}</td>
            <td>₱${data.expenses.toLocaleString()}</td>
            <td>₱${remaining.toLocaleString()}</td>
        `;
        tbody.appendChild(row);
    });
}

function editSalary(id) {
    const salary = salaryList.find(s => s.id === id);
    if (!salary) return;
    const newAmount = parseFloat(prompt('Enter new salary amount:', salary.amount));
    if (isNaN(newAmount) || newAmount <= 0) return;
    const newDate = prompt('Enter new date (YYYY-MM-DD):', salary.date);
    if (!newDate || isNaN(Date.parse(newDate))) return;
    totalIncome -= salary.amount;
    const oldMonth = salary.date.slice(0, 7);
    monthlyData[oldMonth].salary -= salary.amount;
    salary.amount = newAmount;
    salary.date = newDate;
    totalIncome += newAmount;
    const newMonth = newDate.slice(0, 7);
    if (!monthlyData[newMonth]) monthlyData[newMonth] = {
        salary: 0,
        expenses: 0
    };
    monthlyData[newMonth].salary += newAmount;
    updateSalaryTable();
    updateMonthlyTable();
    updateRemaining();
}

function deleteSalary(id) {
    const index = salaryList.findIndex(s => s.id === id);
    if (index === -1) return;
    const salary = salaryList[index];
    totalIncome -= salary.amount;
    const monthKey = salary.date.slice(0, 7);
    monthlyData[monthKey].salary -= salary.amount;
    salaryList.splice(index, 1);
    updateSalaryTable();
    updateMonthlyTable();
    updateRemaining();
}

function clearAllSalaries() {
    if (!confirm('Are you sure you want to clear all salary records?')) return;
    salaryList = [];
    monthlyData = {};
    totalIncome = 0;
    updateSalaryTable();
    updateMonthlyTable();
    updateRemaining();
}

function formatDate(dateString) {
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function formatMonth(monthKey) {
    const [year, month] = monthKey.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleString('en-US', {
        month: 'long',
        year: 'numeric'
    });
}

function addExpense() {
    const category = document.getElementById('expenseCategory').value;
    const name = document.getElementById('expenseName').value;
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const payDate = document.getElementById('expensePayDate').value;
    if (!category || !name || isNaN(amount) || amount <= 0) {
        alert('Please select a category, expense, and enter a valid amount.');
        return;
    }
    totalExpenses += amount;
    categoryTotals[category] += amount;
    const idMap = {
        "Home": "home",
        "Transportation": "transportation",
        "Daily Living": "dailyliving",
        "Entertainment": "entertainment",
        "Health": "health",
        "Vacation": "vacation"
    };
    const detailsCell = document.getElementById(idMap[category] + 'Details');
    const totalCell = document.getElementById(idMap[category] + 'Total');
    detailsCell.innerHTML += `${name} (₱${amount.toLocaleString()} - Deducted on ${payDate})<br>`;
    totalCell.innerText = `₱${categoryTotals[category].toLocaleString()}`;
    document.getElementById('totalExpenses').innerText = totalExpenses.toLocaleString();
    updateRemaining();
    const expenseMonthKey = new Date().toISOString().slice(0, 7);
    if (!monthlyData[expenseMonthKey]) monthlyData[expenseMonthKey] = {
        salary: 0,
        expenses: 0
    };
    monthlyData[expenseMonthKey].expenses += amount;
    updateMonthlyTable();
    document.getElementById('expenseAmount').value = '';
    document.getElementById('expenseName').innerHTML = '<option value="">Select Expense</option>';
}

function updateRemaining() {
    const remaining = totalIncome - totalExpenses;
    document.getElementById('remaining').innerText = remaining.toLocaleString();
}
let editingSalaryId = null;

function editSalary(id) {
    const salary = salaryList.find(s => s.id === id);
    if (!salary) return;

    editingSalaryId = id;
    document.getElementById('editSalaryAmount').value = salary.amount;
    document.getElementById('editSalaryDate').value = salary.date;
    document.getElementById('editSalaryModal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('editSalaryModal').style.display = 'none';
    editingSalaryId = null;
}

function saveEditedSalary() {
    const newAmount = parseFloat(document.getElementById('editSalaryAmount').value);
    const newDate = document.getElementById('editSalaryDate').value;
    if (isNaN(newAmount) || newAmount <= 0 || !newDate) {
        alert('Please enter valid values.');
        return;
    }

    const salary = salaryList.find(s => s.id === editingSalaryId);
    if (!salary) return;

    totalIncome -= salary.amount;
    const oldMonth = salary.date.slice(0, 7);
    monthlyData[oldMonth].salary -= salary.amount;

    salary.amount = newAmount;
    salary.date = newDate;

    totalIncome += newAmount;
    const newMonth = newDate.slice(0, 7);
    if (!monthlyData[newMonth]) monthlyData[newMonth] = {
        salary: 0,
        expenses: 0
    };
    monthlyData[newMonth].salary += newAmount;

    updateSalaryTable();
    updateMonthlyTable();
    updateRemaining();
    closeEditModal();
}
