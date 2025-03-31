// Firebase konfiguratsiyasi
var firebaseConfig = {
  apiKey: "AIzaSyCGPz-2xZiaQDHwpCfToxp4CzirthEisAQ",
  authDomain: "test-app-6211f.firebaseapp.com",
  databaseURL: "https://test-app-6211f-default-rtdb.firebaseio.com",
  projectId: "test-app-6211f",
  storageBucket: "test-app-6211f.appspot.com",
  messagingSenderId: "595776029290",
  appId: "1:595776029290:web:fb6f1407c3054fd10f0013",
};
// Firebase'ni boshlash
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

document.addEventListener("DOMContentLoaded", function () {
  const settingsButton = document.getElementById("settingsButton");
  const settingsModal = document.getElementById("settingsModal");
  const closeModal = document.getElementById("closeModal");
  const themeInputs = document.querySelectorAll('input[name="theme"]');

  // Sozlamalar modalini ochish
  settingsButton.addEventListener("click", function () {
    settingsModal.style.display = "block";
  });

  // Sozlamalar modalini yopish
  closeModal.addEventListener("click", function () {
    settingsModal.style.display = "none";
  });

  // Tashqi joyga bosilsa modalni yopish
  window.addEventListener("click", function (event) {
    if (event.target === settingsModal) {
      settingsModal.style.display = "none";
    }
  });

  // Rang rejimini o'zgartirish
  themeInputs.forEach((input) => {
    input.addEventListener("change", function () {
      if (this.value === "light") {
        document.body.classList.remove("dark-mode");
        document.body.classList.add("light-mode");
      } else if (this.value === "dark") {
        document.body.classList.remove("light-mode");
        document.body.classList.add("dark-mode");
      }
    });
  });
});
// Rang rejimini o'zgartirish va local storage'ga saqlash
function changeTheme(theme) {
  document.body.className = theme + "-mode";
  localStorage.setItem("theme", theme);
}

// Local storage'dan oxirgi rang rejimini olish va qo'llash
function applySavedTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    document.body.className = savedTheme + "-mode";
    document.querySelector(`input[value=${savedTheme}]`).checked = true;
  } else {
    document.body.className = "light-mode";
  }
}

// Modalni ochish va yopish funksiyalari
document
  .getElementById("settingsButton")
  .addEventListener("click", function () {
    document.getElementById("settingsModal").style.display = "block";
  });

document.getElementById("closeModal").addEventListener("click", function () {
  document.getElementById("settingsModal").style.display = "none";
});

// Rang rejimini o'zgartirishni boshqarish
document.querySelectorAll('input[name="theme"]').forEach(function (input) {
  input.addEventListener("change", function (event) {
    changeTheme(event.target.value);
  });
});

// Sahifa yuklanganda oxirgi tanlangan rang rejimini qo'llash
document.addEventListener("DOMContentLoaded", function () {
  applySavedTheme();
});
//  chiqish  bosh saxifaga
document.getElementById("logoutBtn").addEventListener("click", function () {
  window.location.href = "../index.html";
});
