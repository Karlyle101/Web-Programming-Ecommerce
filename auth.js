/* ========================================
   PERSON 1: USER AUTHENTICATION SYSTEM
   Purpose: Register users, validate login, handle lockouts,
   and support password reset with localStorage persistence.
   ======================================== */

const REGISTRATION_KEY = "RegistrationData";
const CURRENT_USER_KEY = "CurrentUser";
const ATTEMPTS_KEY = "LoginAttempts";
const MAX_ATTEMPTS = 3;

function readStorage(key, fallback) {
    const rawValue = localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallback;
}

function writeStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function getUsers() {
    return readStorage(REGISTRATION_KEY, []);
}

function saveUsers(users) {
    writeStorage(REGISTRATION_KEY, users);
}

function formatTrn(trn) {
    const digits = trn.replace(/\D/g, "").slice(0, 9);

    if (digits.length <= 3) {
        return digits;
    }

    if (digits.length <= 6) {
        return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }

    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 9)}`;
}

function isValidTrn(trn) {
    return /^\d{3}-\d{3}-\d{3}$/.test(trn);
}

function calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age -= 1;
    }

    return age;
}

function showMessage(box, message, type) {
    box.className = type === "error" ? "error-box" : "success-box";
    box.textContent = message;
    box.classList.remove("hidden");
}

function hideMessage(box) {
    box.textContent = "";
    box.className = "hidden";
}

function clearForm(form) {
    form.reset();
}

function setTrnFormatter(input) {
    input.addEventListener("input", () => {
        input.value = formatTrn(input.value);
    });
}

function createUserFromForm(formData) {
    return {
        firstName: formData.get("firstName").trim(),
        lastName: formData.get("lastName").trim(),
        dob: formData.get("dob"),
        gender: formData.get("gender"),
        phone: formData.get("phone").trim(),
        email: formData.get("email").trim().toLowerCase(),
        trn: formatTrn(formData.get("trn")),
        password: formData.get("password"),
        dateOfRegistration: new Date().toISOString(),
        cart: [],
        invoices: []
    };
}

function validateRegistration(user, confirmPassword) {
    if (Object.values(user).some((value) => value === "")) {
        return "All fields are required.";
    }

    if (!isValidTrn(user.trn)) {
        return "TRN must follow the format 000-000-000.";
    }

    if (calculateAge(user.dob) < 18) {
        return "User must be at least 18 years old to register.";
    }

    if (user.password.length < 8) {
        return "Password must be at least 8 characters long.";
    }

    if (user.password !== confirmPassword) {
        return "Passwords do not match.";
    }

    const existingUser = getUsers().find((storedUser) => storedUser.trn === user.trn);

    if (existingUser) {
        return "That TRN is already registered.";
    }

    return "";
}

function registerPage() {
    const form = document.getElementById("registerForm");
    if (!form) {
        return;
    }

    const messageBox = document.getElementById("registerMessage");
    const trnInput = document.getElementById("trn");
    setTrnFormatter(trnInput);

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        hideMessage(messageBox);

        const formData = new FormData(form);
        const user = createUserFromForm(formData);
        const validationError = validateRegistration(user, formData.get("confirmPassword"));

        if (validationError) {
            showMessage(messageBox, validationError, "error");
            return;
        }

        const users = getUsers();
        users.push(user);
        saveUsers(users);
        writeStorage(CURRENT_USER_KEY, user);
        showMessage(messageBox, "Registration successful. You can now continue to the product page.", "success");
        form.reset();
    });

    document.getElementById("registerCancel").addEventListener("click", () => {
        clearForm(form);
        hideMessage(messageBox);
    });
}

function getAttempts() {
    return readStorage(ATTEMPTS_KEY, {});
}

function saveAttempts(attempts) {
    writeStorage(ATTEMPTS_KEY, attempts);
}

function loginPage() {
    const form = document.getElementById("loginForm");
    if (!form) {
        return;
    }

    const messageBox = document.getElementById("loginMessage");
    const trnInput = document.getElementById("loginTrn");
    setTrnFormatter(trnInput);

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        hideMessage(messageBox);

        const users = getUsers();
        const attempts = getAttempts();
        const trn = formatTrn(trnInput.value.trim());
        const password = document.getElementById("loginPassword").value;
        const user = users.find((storedUser) => storedUser.trn === trn);

        if (attempts[trn] >= MAX_ATTEMPTS) {
            window.location.href = "locked.html";
            return;
        }

        if (user && user.password === password) {
            attempts[trn] = 0;
            saveAttempts(attempts);
            writeStorage(CURRENT_USER_KEY, user);
            window.location.href = "product.html";
            return;
        }

        attempts[trn] = (attempts[trn] || 0) + 1;
        saveAttempts(attempts);

        if (attempts[trn] >= MAX_ATTEMPTS) {
            window.location.href = "locked.html";
            return;
        }

        showMessage(
            messageBox,
            `Incorrect TRN or password. Attempts remaining: ${MAX_ATTEMPTS - attempts[trn]}.`,
            "error"
        );
    });

    document.getElementById("loginCancel").addEventListener("click", () => {
        clearForm(form);
        hideMessage(messageBox);
    });
}

function resetPasswordPage() {
    const form = document.getElementById("resetForm");
    if (!form) {
        return;
    }

    const messageBox = document.getElementById("resetMessage");
    const trnInput = document.getElementById("resetTrn");
    setTrnFormatter(trnInput);

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        hideMessage(messageBox);

        const trn = formatTrn(trnInput.value.trim());
        const newPassword = document.getElementById("newPassword").value;
        const confirmPassword = document.getElementById("confirmNewPassword").value;
        const users = getUsers();
        const userIndex = users.findIndex((user) => user.trn === trn);

        if (!isValidTrn(trn)) {
            showMessage(messageBox, "Enter a valid TRN in the format 000-000-000.", "error");
            return;
        }

        if (userIndex === -1) {
            showMessage(messageBox, "No account was found with that TRN.", "error");
            return;
        }

        if (newPassword.length < 8) {
            showMessage(messageBox, "New password must be at least 8 characters long.", "error");
            return;
        }

        if (newPassword !== confirmPassword) {
            showMessage(messageBox, "Passwords do not match.", "error");
            return;
        }

        users[userIndex].password = newPassword;
        saveUsers(users);

        const attempts = getAttempts();
        attempts[trn] = 0;
        saveAttempts(attempts);

        const currentUser = readStorage(CURRENT_USER_KEY, null);
        if (currentUser && currentUser.trn === trn) {
            writeStorage(CURRENT_USER_KEY, users[userIndex]);
        }

        showMessage(messageBox, "Password updated successfully. You can return to login.", "success");
        form.reset();
    });

    document.getElementById("resetCancel").addEventListener("click", () => {
        clearForm(form);
        hideMessage(messageBox);
    });
}

function lockedPage() {
    const unlockButton = document.getElementById("goToReset");
    if (!unlockButton) {
        return;
    }

    unlockButton.addEventListener("click", () => {
        window.location.href = "reset-password.html";
    });
}

document.addEventListener("DOMContentLoaded", () => {
    registerPage();
    loginPage();
    resetPasswordPage();
    lockedPage();
});
