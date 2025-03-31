document.addEventListener("DOMContentLoaded", function () {
  const userName = localStorage.getItem("userName");
  const userSurname = localStorage.getItem("userSurname");
  document.getElementById(
    "userDetails"
  ).innerText = `${userName} ${userSurname}`;

  document
    .getElementById("startTestBtn")
    .addEventListener("click", function () {
      startTest();
    });

  document.getElementById("exitTestBtn").addEventListener("click", function () {
    window.location.href = "../index.html";
  });

  document
    .getElementById("finishTestBtn")
    .addEventListener("click", function (event) {
      event.preventDefault(); // Formni yuborilishining oldini olish
      endTest();
    });
});

// Massivni tasodifiy tartibda aralashtirish uchun funksiya
function shuffleArray(array) {
  // Fisher-Yates (Knuth) shuffle algoritmi
  let currentIndex = array.length, temporaryValue, randomIndex;

  // Toki elementlar qolmagunga qadar
  while (0 !== currentIndex) {
    // Qolgan elementlardan birini tanlash
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // Joriy element bilan tanlangan elementni almashtirish
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

let questionsWithOriginalAnswers = []; // Original savol va to'g'ri javoblarni saqlash uchun

function startTest() {
  document.getElementById("startTestBtn").style.display = "none";
  document.getElementById("testContainer").style.display = "block";
  const selectedCategories = Array.from(
    document.querySelectorAll('input[name="category"]:checked')
  ).map((cb) => cb.value);

  // Test savollarini yuklash
  db.collection("test_one")
    .get()
    .then((querySnapshot) => {
      let questions = querySnapshot.docs.map((doc) => doc.data());

      // Savollarni tasodifiy tartibda aralashtirish
      questions = shuffleArray([...questions]);

      // Savollarni ko'rsatish
      displayRandomizedQuestions(questions);
    })
    .catch(error => {
      console.error("Error getting questions:", error);
      alert("Savollarni yuklashda xatolik yuz berdi");
    });

  startTimer(3600, document.getElementById("timer"));
}

function displayRandomizedQuestions(questions) {
  const testQuestionsDiv = document.getElementById("testQuestions");
  testQuestionsDiv.innerHTML = ''; // Oldingi savollarni tozalash

  questionsWithOriginalAnswers = []; // Orginal ma'lumotlarni tozalash

  questions.forEach((question, index) => {
    const questionDiv = document.createElement("div");
    questionDiv.classList.add("form-group");

    // Variantlarni tasodifiy tartibda aralashtirish
    const originalOptions = [...question.options];
    const shuffledOptions = shuffleArray([...originalOptions]);

    // To'g'ri javob indeksini yangi massivda topish
    const originalCorrectOption = question.correctOption;
    const originalCorrectAnswer = originalOptions[originalCorrectOption];
    const newCorrectOption = shuffledOptions.indexOf(originalCorrectAnswer);

    // Original savol va to'g'ri javoblarni saqlash
    questionsWithOriginalAnswers.push({
      questionIndex: index,
      newCorrectOption: newCorrectOption
    });

    // Savolni HTML shaklida yaratish
    questionDiv.innerHTML = `
      <br> <b> <label id="title-text"><h3>
      ${index + 1}. ${question.question} </h3></label></b>
      <hr> <br/>
      ${shuffledOptions
        .map((option, i) => `
          <div class="form-check">
            <input class="form-check-input" type="radio" name="question${index}" value="${i}" required>
            <label class="form-check-label">${option}</label>
          </div>
          <br>
        `)
        .join("")}
    `;

    testQuestionsDiv.appendChild(questionDiv);
  });
}

function selectOption(index) {
  document.getElementById(`option${index}`).checked = true;
}

function endTest() {
  const form = document.getElementById("testForm");
  const formData = new FormData(form);
  let score = 0;
  let totalQuestions = questionsWithOriginalAnswers.length;

  // To'g'ri javoblarni tekshirish
  questionsWithOriginalAnswers.forEach((item) => {
    const userAnswer = formData.get(`question${item.questionIndex}`);
    if (userAnswer !== null && parseInt(userAnswer) === item.newCorrectOption) {
      score++;
    }
  });

  // Natijani hisoblash
  const totalScore = Math.floor((score / totalQuestions) * 100);

  document.getElementById("testContainer").style.display = "none"; // Test konteynerini yashirish
  document.getElementById("resultContainer").style.display = "block"; // Natijani ko'rsatish
  document.getElementById("resultTitle").innerHTML = totalScore;
  document.getElementById("timer").style.display = "none";

  // Natijani Firebase'ga saqlash
  saveTestResult(score, totalQuestions, totalScore);
}

function saveTestResult(score, totalQuestions, totalScore) {
  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("userName");
  const userSurname = localStorage.getItem("userSurname");

  if (db && db.collection) {
    db.collection("testResults")
      .add({
        userId: userId || "anonymous",
        userName: userName || "",
        userSurname: userSurname || "",
        score: score,
        totalQuestions: totalQuestions,
        percentage: totalScore,
        date: new Date().toISOString(),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      })
      .then(() => {
        console.log("Test natijasi saqlandi");
      })
      .catch((error) => {
        console.error("Error saving test result: ", error);
      });
  }
}

// qayta boshlash
document.getElementById("restart").addEventListener("click", function () {
  window.location.href = "../page/test.html";
});

// Timer function
let timer;
function startTimer(duration, display) {
  let timeLeft = duration;
  let minutes, seconds;

  // Oldingi timerni tozalash
  if (timer) {
    clearInterval(timer);
  }

  timer = setInterval(function () {
    minutes = parseInt(timeLeft / 60, 10);
    seconds = parseInt(timeLeft % 60, 10);

    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;

    display.textContent = "Vaqt: " + minutes + ":" + seconds;

    if (timeLeft < 20) {
      document.getElementById("timer").style.color = "red";
    }

    if (--timeLeft < 0) {
      clearInterval(timer);
      alert("Test vaqti tugadi!");
      endTest();
    }
  }, 1000);

  return timer;
}

const getFilteredQuestions = async (categories) => {
  if (!db || !db.collection) {
    console.error("Database is not initialized");
    return [];
  }

  const questionsRef = db.collection("test_one");
  let query = questionsRef;

  if (categories && categories.length > 0) {
    if (categories.length === 1) {
      query = questionsRef.where("category", "==", categories[0]);
    } else if (categories.length > 1) {
      query = questionsRef.where("category", "in", categories);
    }
  }

  try {
    const snapshot = await query.get();
    const questions = snapshot.docs.map((doc) => doc.data());
    return questions;
  } catch (error) {
    console.error("Error getting filtered questions:", error);
    return [];
  }
}

// Test natijalarini ko'rsatish va sertifikat yaratish
function displayScore(score) {
  document.getElementById("testContainer").style.display = "none";
  document.getElementById("resultContainer").style.display = "block";
  document.getElementById("resultTitle").innerHTML = score;
}