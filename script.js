import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
    getFirestore, collection, addDoc, deleteDoc, doc, updateDoc,
    onSnapshot, query, orderBy, getDocs, writeBatch
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


const firebaseConfig = {
    apiKey: "AIzaSyDxMntRJN5gNGB9OmCDbSSdZbWCWxAH1UY",
    authDomain: "finance-6fc35.firebaseapp.com",
    projectId: "finance-6fc35",
    storageBucket: "finance-6fc35.appspot.com",
    messagingSenderId: "1060399666538",
    appId: "1:1060399666538:web:6d49bc5f6735e4b5940113",
    measurementId: "G-31364MQLWH"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const salariesRef = collection(db, "salaries");
const expensesRef = collection(db, "expenses");

let totalIncome = 0;
let totalExpenses = 0;
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

const salaryQuery = query(salariesRef, orderBy("date", "desc"));
onSnapshot(salaryQuery, (snapshot) => {
    console.log("✅ Salaries snapshot triggered!");
    totalIncome = 0;
    const tbody = document.querySelector('#salaryTable tbody');
    if (!tbody) {
        console.error("❌ salaryTable tbody not found!");
        return;
    }

    tbody.innerHTML = '';
    let monthlySummary = {};

    snapshot.forEach(docSnap => {
        const salary = { id: docSnap.id, ...docSnap.data() };
        console.log("📌 Salary:", salary);
        totalIncome += salary.amount;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${salary.owner}</td>
            <td>${formatDate(salary.date)}</td>
            <td>₱${salary.amount.toLocaleString()}</td>
            <td>
                <button onclick="editSalary('${salary.id}', ${salary.amount}, '${salary.date}')" class="btn-edit">Edit</button>
                <button onclick="deleteSalary('${salary.id}')" class="btn-delete">Delete</button>
            </td>
        `;
        tbody.appendChild(row);

        const monthKey = salary.date.slice(0, 7);
        if (!monthlySummary[monthKey]) monthlySummary[monthKey] = { salary: 0, expenses: 0 };
        monthlySummary[monthKey].salary += salary.amount;
    });

    document.getElementById('totalIncome').innerText = totalIncome.toLocaleString();
    updateMonthlyTable(monthlySummary);
    updateRemaining();
});

onSnapshot(expensesRef, (snapshot) => {
    totalExpenses = 0;
    categoryTotals = { "Home": 0, "Transportation": 0, "Daily Living": 0, "Entertainment": 0, "Health": 0, "Vacation": 0 };

    const idMap = {
        "Home": "home",
        "Transportation": "transportation",
        "Daily Living": "dailyliving",
        "Entertainment": "entertainment",
        "Health": "health",
        "Vacation": "vacation"
    };

    for (let key in idMap) {
        document.getElementById(idMap[key] + 'Details').innerHTML = '';
        document.getElementById(idMap[key] + 'Total').innerText = '₱0';
    }

    let monthlySummary = {};

    snapshot.forEach(docSnap => {
        const exp = docSnap.data();
        totalExpenses += exp.amount;
        categoryTotals[exp.category] += exp.amount;

        const detailsCell = document.getElementById(idMap[exp.category] + 'Details');
        if (detailsCell.innerHTML.includes(`${exp.name} (₱${exp.amount.toLocaleString()}`) === false) {
    detailsCell.innerHTML += `${exp.name} (₱${exp.amount.toLocaleString()} - Deducted on ${exp.payDate})<br>`;
}


        const monthKey = new Date().toISOString().slice(0, 7);
        if (!monthlySummary[monthKey]) monthlySummary[monthKey] = { salary: 0, expenses: 0 };
        monthlySummary[monthKey].expenses += exp.amount;
    });

    for (let cat in categoryTotals) {
        document.getElementById(idMap[cat] + 'Total').innerText = `₱${categoryTotals[cat].toLocaleString()}`;
    }

    document.getElementById('totalExpenses').innerText = totalExpenses.toLocaleString();
    updateMonthlyTable(monthlySummary);
    updateRemaining();
});

async function addSalary() {
    const amount = parseFloat(document.getElementById('salaryAmount').value);
    const owner = document.getElementById('salaryOwner').value;
    const date = document.getElementById('salaryDate').value;

    if (isNaN(amount) || amount <= 0 || !date) {
        alert("Please enter valid salary details.");
        return;
    }

    await addDoc(salariesRef, { owner, amount, date });
    document.getElementById('salaryAmount').value = '';
    document.getElementById('salaryDate').value = '';
}

async function addExpense() {
    const category = document.getElementById('expenseCategory').value;
    const name = document.getElementById('expenseName').value;
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const payDate = document.getElementById('expensePayDate').value;

    if (!category || !name || isNaN(amount) || amount <= 0) {
        alert("Please fill in all expense details.");
        return;
    }

    await addDoc(expensesRef, { category, name, amount, payDate });
    document.getElementById('expenseAmount').value = '';
    document.getElementById('expenseName').innerHTML = '<option value="">Select Expense</option>';
}

async function deleteSalary(id) {
    await deleteDoc(doc(db, "salaries", id));
}

function editSalary(id, currentAmount, currentDate) {
    const newAmount = parseFloat(prompt("Enter new salary amount:", currentAmount));
    const newDate = prompt("Enter new date (YYYY-MM-DD):", currentDate);
    if (isNaN(newAmount) || newAmount <= 0 || !newDate) return;

    updateDoc(doc(db, "salaries", id), { amount: newAmount, date: newDate });
}

function updateMonthlyTable(summary) {
    const tbody = document.querySelector('#monthlyTable tbody');
    tbody.innerHTML = '';
    const months = Object.keys(summary).sort();
    months.forEach(monthKey => {
        const data = summary[monthKey];
        const remaining = (data.salary || 0) - (data.expenses || 0);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatMonth(monthKey)}</td>
            <td>₱${(data.salary || 0).toLocaleString()}</td>
            <td>₱${(data.expenses || 0).toLocaleString()}</td>
            <td>₱${remaining.toLocaleString()}</td>
        `;
        tbody.appendChild(row);
    });
}

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

function updateRemaining() {
    const remaining = totalIncome - totalExpenses;
    document.getElementById('remaining').innerText = remaining.toLocaleString();
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function formatMonth(monthKey) {
    const [year, month] = monthKey.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

window.addSalary = addSalary;
window.addExpense = addExpense;
window.updateExpenseOptions = updateExpenseOptions;
window.deleteSalary = deleteSalary;
window.editSalary = editSalary;


// ✅ Delete All Salaries
async function deleteAllSalaries() {
    if (!confirm("Are you sure you want to delete ALL salary records? This cannot be undone.")) return;

    const snapshot = await getDocs(salariesRef);
    if (snapshot.empty) {
        alert("No salary records to delete.");
        return;
    }

    const batch = writeBatch(db);
    snapshot.forEach(docSnap => batch.delete(docSnap.ref));

    await batch.commit();
    alert("All salary records deleted.");
}


// ✅ Delete All Expenses
async function deleteAllExpenses() {
    if (!confirm("Are you sure you want to delete ALL expense records? This cannot be undone.")) return;

    const snapshot = await getDocs(expensesRef);
    if (snapshot.empty) {
        alert("No expense records to delete.");
        return;
    }

    const batch = writeBatch(db);
    snapshot.forEach(docSnap => batch.delete(docSnap.ref));

    await batch.commit();
    alert("All expense records deleted.");
}


