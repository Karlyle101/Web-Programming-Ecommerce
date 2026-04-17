// ================= LOAD USERS =================
let attempts = 3;

// ================= REGISTER FUNCTION =================
function registerUser() {
  let fname = document.getElementById("fname").value;
  let lname = document.getElementById("lname").value;
  let dob = document.getElementById("dob").value;
  let gender = document.getElementById("gender").value;
  let phone = document.getElementById("phone").value;
  let email = document.getElementById("email").value;
  let trn = document.getElementById("trn").value.trim();
  let password = document.getElementById("password").value;

  let users = JSON.parse(localStorage.getItem("RegistrationData")) || [];

  // AGE CHECK
  let age = calculateAge(dob);
  if (age < 18) {
    return showMsg("msg", "Must be 18+");
  }

  // PASSWORD CHECK
  if (password.length < 8) {
    return showMsg("msg", "Password must be at least 8 characters");
  }

  // TRN FORMAT
  let trnPattern = /^\d{3}-\d{3}-\d{3}$/;
  if (!trnPattern.test(trn)) {
    return showMsg("msg", "Invalid TRN format");
  }

  // UNIQUE TRN
  let exists = users.find(u => u.trn === trn);
  if (exists) {
    return showMsg("msg", "TRN already exists");
  }

  // CREATE USER
  let user = {
    fname,
    lname,
    dob,
    gender,
    phone,
    email,
    trn,
    password,
    dateRegistered: new Date().toLocaleDateString(),
    cart: [],
    invoices: []
  };

  users.push(user);
  localStorage.setItem("RegistrationData", JSON.stringify(users));

  showMsg("msg", "Registration Successful!");
}

// ================= LOGIN FUNCTION =================
function loginUser() {
  let trn = document.getElementById("loginTRN").value.trim();
  let password = document.getElementById("loginPassword").value;

  // ALWAYS GET FRESH USERS
  let users = JSON.parse(localStorage.getItem("RegistrationData")) || [];

  let user = users.find(u => u.trn === trn && u.password === password);

  if (user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
    window.location.href = "product.html";
  } else {
    attempts--;
    showMsg("loginMsg", "Invalid login. Attempts left: " + attempts);

    if (attempts === 0) {
      window.location.href = "error.html";
    }
  }
}

// ================= RESET PASSWORD =================
function resetPassword() {
  let trn = prompt("Enter your TRN:");

  let users = JSON.parse(localStorage.getItem("RegistrationData")) || [];

  let user = users.find(u => u.trn === trn);

  if (!user) {
    alert("TRN not found");
    return;
  }

  let newPass = prompt("Enter new password (min 8 chars):");

  if (!newPass || newPass.length < 8) {
    alert("Password too short");
    return;
  }

  user.password = newPass;

  localStorage.setItem("RegistrationData", JSON.stringify(users));

  alert("Password updated!");
}

// ================= AGE FUNCTION =================
function calculateAge(dob) {
  let birthDate = new Date(dob);
  let diff = Date.now() - birthDate.getTime();
  let ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

// ================= MESSAGE FUNCTION =================
function showMsg(id, msg) {
  document.getElementById(id).innerText = msg;
}