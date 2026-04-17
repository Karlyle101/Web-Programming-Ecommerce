function getCurrentUserForNav() {
    const rawValue = localStorage.getItem("CurrentUser");
    return rawValue ? JSON.parse(rawValue) : null;
}

function updateNavigationState() {
    const currentUser = getCurrentUserForNav();
    const guestLinks = document.querySelectorAll("[data-guest-link]");
    const userLinks = document.querySelectorAll("[data-user-link]");
    const userNames = document.querySelectorAll("[data-user-name]");
    const logoutLinks = document.querySelectorAll("[data-logout]");

    guestLinks.forEach((element) => {
        element.style.display = currentUser ? "none" : "";
    });

    userLinks.forEach((element) => {
        element.style.display = currentUser ? "" : "none";
    });

    userNames.forEach((element) => {
        if (currentUser) {
            element.textContent = `${currentUser.firstName} ${currentUser.lastName}`;
            element.style.display = "";
        } else {
            element.textContent = "";
            element.style.display = "none";
        }
    });

    logoutLinks.forEach((element) => {
        element.addEventListener("click", (event) => {
            event.preventDefault();
            localStorage.removeItem("CurrentUser");
            window.location.href = "index.html";
        });
    });
}

document.addEventListener("DOMContentLoaded", updateNavigationState);
