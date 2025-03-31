document.addEventListener("DOMContentLoaded", function () {
  // DataTable inizializatsiyasi uchun tekshirish
  if ($.fn.DataTable && $("#studentsTable").length && $("#testsTable").length) {
    const studentsTable = $("#studentsTable").DataTable();
    const testsTable = $("#testsTable").DataTable();

    // O'quvchilar ro'yxatini yuklash
    if (db && db.collection) {
      db.collection("students").onSnapshot((querySnapshot) => {
        studentsTable.clear();
        querySnapshot.forEach((doc) => {
          const student = doc.data();
          studentsTable.row
            .add([
              student.name || "",
              student.surname || "",
              student.phone || "",
              student.age || "",
              `<button class="btn btn-primary btn-sm" onclick="editStudent('${doc.id}')">Taxrirlash</button>
               <button class="btn btn-danger btn-sm" onclick="deleteStudent('${doc.id}')">O'chirish</button>`,
            ])
            .draw();
        });
      }, (error) => {
        console.error("Students snapshot error:", error);
        showToast("Ma'lumotlarni yuklashda xatolik", "#dc3545");
      });

      // Testlar ro'yxatini yuklash
      db.collection("tests").onSnapshot((querySnapshot) => {
        testsTable.clear();
        querySnapshot.forEach((doc) => {
          const test = doc.data();
          
          // correctOption raqam ekanligini tekshirish
          const correctOptionIndex = parseInt(test.correctOption);
          const correctAnswer = test.options && test.options[correctOptionIndex] ? 
            test.options[correctOptionIndex] : "Noma'lum";

          testsTable.row
            .add([
              test.question || "",
              test.category || "",
              test.options && Array.isArray(test.options) ? test.options.join(", ") : "",
              correctAnswer,
              `<button class="btn btn-primary btn-sm" onclick="editTest('${doc.id}')">Taxrirlash</button>
               <button class="btn btn-danger btn-sm" onclick="deleteTest('${doc.id}')">O'chirish</button>`,
            ])
            .draw();
        });
      }, (error) => {
        console.error("Tests snapshot error:", error);
        showToast("Ma'lumotlarni yuklashda xatolik", "#dc3545");
      });
    } else {
      console.error("Database not initialized");
      showToast("Ma'lumotlar bazasi ulanmagan", "#dc3545");
    }
  }

  // Test qo'shish formasini tekshirish va tinglovchini qo'shish
  const addTestForm = document.getElementById("addTestForm");
  if (addTestForm) {
    addTestForm.addEventListener("submit", function (e) {
      e.preventDefault();
      
      const category = document.getElementById("category").value.trim();
      const question = document.getElementById("question").value.trim();
      const options = [
        document.getElementById("option1").value.trim(),
        document.getElementById("option2").value.trim(),
        document.getElementById("option3").value.trim(),
        document.getElementById("option4").value.trim(),
      ];
      const correctOption = parseInt(document.getElementById("correctOption").value);

      // Validatsiya
      if (!category || !question || options.some(opt => !opt) || isNaN(correctOption) || correctOption < 0 || correctOption > 3) {
        showToast("Barcha maydonlarni to'g'ri to'ldiring", "#dc3545");
        return;
      }

      if (db && db.collection) {
        db.collection("tests")
          .add({
            category: category,
            question: question,
            options: options,
            correctOption: correctOption,
          })
          .then(() => {
            showToast("Test muvaffaqiyatli qo'shildi!", "#28a745");
            // Formani tozalash
            addTestForm.reset();
          })
          .catch((error) => {
            console.error("Error adding document: ", error);
            showToast("Test qo'shishda xatolik yuz berdi", "#dc3545");
          });
      } else {
        showToast("Ma'lumotlar bazasi ulanmagan", "#dc3545");
      }
    });
  }

  // JSON faylni yuklash uchun form
  const uploadJsonForm = document.getElementById("uploadJsonForm");
  if (uploadJsonForm) {
    uploadJsonForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const fileInput = document.getElementById("jsonFileInput");
      
      if (!fileInput.files || fileInput.files.length === 0) {
        showToast("Fayl tanlanmagan", "#dc3545");
        return;
      }
      
      const file = fileInput.files[0];
      if (file.type !== "application/json" && !file.name.endsWith('.json')) {
        showToast("Faqat JSON fayl yuklashingiz mumkin", "#dc3545");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const jsonData = JSON.parse(e.target.result);
          uploadTests(jsonData);
        } catch (error) {
          console.error("JSON parsing error:", error);
          showToast("JSON faylni o'qishda xatolik", "#dc3545");
        }
      };
      
      reader.readAsText(file);
    });
  }

  // Log out tugmasi
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      window.location.href = "../index.html";
    });
  }

  // "Yuqoriga qaytish" tugmasi
  const backToTopBtn = document.getElementById("btn-back-to-top");
  if (backToTopBtn) {
    window.onscroll = function () {
      if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        backToTopBtn.style.display = "block";
      } else {
        backToTopBtn.style.display = "none";
      }
    };

    backToTopBtn.addEventListener("click", function() {
      document.body.scrollTop = 0; // Safari uchun
      document.documentElement.scrollTop = 0; // Chrome, Firefox, IE va Opera uchun
    });
  }
});

// JSON fayl orqali testlarni yuklash
function uploadTests(jsonData) {
  if (!db || !db.collection) {
    showToast("Ma'lumotlar bazasi ulanmagan", "#dc3545");
    return;
  }
  
  // JSON massiv bo'lmasa, uni massivga o'zgartirish
  const testsArray = Array.isArray(jsonData) ? jsonData : [jsonData];
  
  let successCount = 0;
  let errorCount = 0;
  let totalCount = testsArray.length;
  let processedCount = 0;
  
  // Har bir test uchun
  testsArray.forEach((testData) => {
    try {
      if (!testData.question || !testData.options || !Array.isArray(testData.options) || !testData.answer) {
        console.error("Invalid test data:", testData);
        errorCount++;
        processedCount++;
        checkCompletion();
        return;
      }
      
      // To'g'ri javobni topish
      let correctOption = -1;
      for (let i = 0; i < testData.options.length; i++) {
        if (testData.options[i] === testData.answer) {
          correctOption = i;
          break;
        }
      }
      
      if (correctOption === -1) {
        console.error("Correct answer not found in options:", testData);
        errorCount++;
        processedCount++;
        checkCompletion();
        return;
      }
      
      // Firebase Firestore'ga saqlash
      db.collection("test_one").add({
        question: testData.question,
        options: testData.options,
        correctOption: correctOption,
        category: testData.category || "Umumiy"
      })
      .then(() => {
        successCount++;
        processedCount++;
        checkCompletion();
      })
      .catch((error) => {
        console.error("Error adding test to Firebase:", error);
        errorCount++;
        processedCount++;
        checkCompletion();
      });
      
    } catch (error) {
      console.error("Error processing test:", error);
      errorCount++;
      processedCount++;
      checkCompletion();
    }
  });
  
  // Barcha testlar yuklangandan so'ng xabarni ko'rsatish
  function checkCompletion() {
    if (processedCount === totalCount) {
      if (errorCount === 0) {
        showToast(`${successCount} ta test muvaffaqiyatli yuklandi!`, "#28a745");
      } else {
        showToast(`${successCount} ta test yuklandi, ${errorCount} ta testda xatolik`, "#ffc107");
      }
      // Formani tozalash
      document.getElementById("jsonFileInput").value = "";
    }
  }
  
  // Agar massiv bo'sh bo'lsa
  if (totalCount === 0) {
    showToast("JSON faylda testlar topilmadi", "#dc3545");
  }
}

// Qo'shimcha funksiyalar
function showToast(message, backgroundColor) {
  if (typeof Toastify === 'function') {
    Toastify({
      text: message,
      duration: 3000,
      gravity: "top",
      position: "right",
      backgroundColor: backgroundColor,
    }).showToast();
  } else {
    alert(message);
  }
}

function editStudent(studentId) {
  if (!db || !db.collection) {
    showToast("Ma'lumotlar bazasi ulanmagan", "#dc3545");
    return;
  }

  const studentDoc = db.collection("students").doc(studentId);
  studentDoc
    .get()
    .then((doc) => {
      if (doc.exists) {
        const student = doc.data();
        const newName = prompt("Yangi ism:", student.name || "");
        const newSurname = prompt("Yangi familya:", student.surname || "");
        const newPhone = prompt("Yangi telefon:", student.phone || "");
        const newAge = prompt("Yangi yosh:", student.age || "");

        if (newName && newSurname) {
          studentDoc
            .update({
              name: newName,
              surname: newSurname,
              phone: newPhone || "",
              age: newAge || "",
            })
            .then(() => {
              showToast("O'quvchi muvaffaqiyatli taxrirlandi!", "#28a745");
            })
            .catch((error) => {
              console.error("Error updating document: ", error);
              showToast("Xatolik yuz berdi!", "#dc3545");
            });
        } else {
          showToast("Ism va familya bo'sh bo'lishi mumkin emas", "#dc3545");
        }
      } else {
        showToast("O'quvchi topilmadi!", "#dc3545");
      }
    })
    .catch((error) => {
      console.error("Error getting document:", error);
      showToast("Xatolik yuz berdi!", "#dc3545");
    });
}

function deleteStudent(studentId) {
  if (!db || !db.collection) {
    showToast("Ma'lumotlar bazasi ulanmagan", "#dc3545");
    return;
  }

  if (confirm("Haqiqatan ham bu o'quvchini o'chirmoqchimisiz?")) {
    db.collection("students").doc(studentId)
      .delete()
      .then(() => {
        showToast("O'quvchi o'chirildi", "#28a745");
      })
      .catch((error) => {
        console.error("Error removing document: ", error);
        showToast("O'chirishda xatolik yuz berdi", "#dc3545");
      });
  }
}

function editTest(testId) {
  if (!db || !db.collection) {
    showToast("Ma'lumotlar bazasi ulanmagan", "#dc3545");
    return;
  }

  const testDoc = db.collection("tests").doc(testId);
  testDoc
    .get()
    .then((doc) => {
      if (doc.exists) {
        const test = doc.data();
        const newQuestion = prompt("Yangi savol:", test.question || "");
        
        if (!newQuestion) {
          showToast("Savol bo'sh bo'lishi mumkin emas", "#dc3545");
          return;
        }
        
        const newOptions = [];
        for (let i = 0; i < 4; i++) {
          const optionValue = prompt(`Variant ${i + 1}:`, test.options && test.options[i] ? test.options[i] : "");
          if (!optionValue) {
            showToast("Variantlar bo'sh bo'lishi mumkin emas", "#dc3545");
            return;
          }
          newOptions.push(optionValue);
        }
        
        const newCorrectOption = prompt("To'g'ri variant (0-3):", test.correctOption || "0");
        const correctOptionIndex = parseInt(newCorrectOption);
        
        if (isNaN(correctOptionIndex) || correctOptionIndex < 0 || correctOptionIndex > 3) {
          showToast("To'g'ri variant 0 dan 3 gacha bo'lishi kerak", "#dc3545");
          return;
        }

        testDoc
          .update({
            question: newQuestion,
            options: newOptions,
            correctOption: correctOptionIndex,
          })
          .then(() => {
            showToast("Test muvaffaqiyatli taxrirlandi!", "#28a745");
          })
          .catch((error) => {
            console.error("Error updating document: ", error);
            showToast("Xatolik yuz berdi!", "#dc3545");
          });
      } else {
        showToast("Test topilmadi!", "#dc3545");
      }
    })
    .catch((error) => {
      console.error("Error getting document:", error);
      showToast("Xatolik yuz berdi!", "#dc3545");
    });
}

function deleteTest(testId) {
  if (!db || !db.collection) {
    showToast("Ma'lumotlar bazasi ulanmagan", "#dc3545");
    return;
  }
  
  if (confirm("Haqiqatan ham bu testni o'chirmoqchimisiz?")) {
    db.collection("tests").doc(testId)
      .delete()
      .then(() => {
        showToast("Test o'chirildi", "#28a745");
      })
      .catch((error) => {
        console.error("Error removing document: ", error);
        showToast("O'chirishda xatolik yuz berdi", "#dc3545");
      });
  }
}