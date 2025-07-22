import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    onSnapshot,
    query,
    orderBy,
    getDocs,
    writeBatch
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
    totalIncome = 0;
    const tbody = document.querySelector('#salaryTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

snapshot.forEach(docSnap => {
    const salary = { id: docSnap.id, ...docSnap.data() };
    totalIncome += Number(salary.amount) || 0;


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
    });

    document.getElementById('totalIncome').innerText = totalIncome.toLocaleString();
    updateMonthlyTable();
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

    const categoryExpenses = {
        "Home": [],
        "Transportation": [],
        "Daily Living": [],
        "Entertainment": [],
        "Health": [],
        "Vacation": []
    };

snapshot.forEach(docSnap => {
    const exp = docSnap.data();
    totalExpenses += Number(exp.amount) || 0;
    categoryTotals[exp.category] += Number(exp.amount) || 0;


        if (categoryExpenses[exp.category]) {
            categoryExpenses[exp.category].push(`${exp.name} (₱${exp.amount.toLocaleString()} - Deducted on ${exp.payDate})`);
        }
    });

    for (let cat in categoryExpenses) {
        const detailsCell = document.getElementById(idMap[cat] + 'Details');
        detailsCell.innerHTML = categoryExpenses[cat].join('<br>');
        document.getElementById(idMap[cat] + 'Total').innerText = `₱${categoryTotals[cat].toLocaleString()}`;
    }

    document.getElementById('totalExpenses').innerText = totalExpenses.toLocaleString();
    updateMonthlyTable();
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

function updateMonthlyTable() {
    const tbody = document.querySelector('#monthlyTable tbody');
    tbody.innerHTML = '';

    const income = Number(totalIncome) || 0;
    const expenses = Number(totalExpenses) || 0;
    const remaining = income - expenses;

    const row = document.createElement('tr');
    row.innerHTML = `
        <td>Combined Total</td>
        <td>₱${income.toLocaleString()}</td>
        <td>₱${expenses.toLocaleString()}</td>
        <td style="color:${remaining >= 0 ? 'green' : 'red'}; font-weight:bold;">
            ₱${remaining.toLocaleString()}
        </td>
    `;
    tbody.appendChild(row);
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
    const remainingEl = document.getElementById('remaining');
    remainingEl.innerText = remaining.toLocaleString();

    if (remaining > 0) {
        remainingEl.style.color = 'green';
    } else if (remaining < 0) {
        remainingEl.style.color = 'red';
    } else {
        remainingEl.style.color = 'black';
    }
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

window.addSalary = addSalary;
window.addExpense = addExpense;
window.updateExpenseOptions = updateExpenseOptions;
window.deleteSalary = deleteSalary;
window.editSalary = editSalary;

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
// --- Edit Salary Modal Logic ---
let currentEditId = null;

function editSalary(id, currentAmount, currentDate) {
    currentEditId = id;
    document.getElementById('editAmount').value = currentAmount;
    document.getElementById('editDate').value = currentDate;
    document.getElementById('editModal').style.display = 'flex';
}

document.getElementById('saveEditBtn').addEventListener('click', async () => {
    const newAmount = parseFloat(document.getElementById('editAmount').value);
    const newDate = document.getElementById('editDate').value;

    if (isNaN(newAmount) || newAmount <= 0 || !newDate) {
        alert("Please enter valid data.");
        return;
    }

    await updateDoc(doc(db, "salaries", currentEditId), { amount: newAmount, date: newDate });
    document.getElementById('editModal').style.display = 'none';
});

document.getElementById('cancelEditBtn').addEventListener('click', () => {
    document.getElementById('editModal').style.display = 'none';
});
window.editSalary = editSalary;
window.deleteAllSalaries = deleteAllSalaries;
window.deleteAllExpenses = deleteAllExpenses;
