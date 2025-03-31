document.getElementById('registrationForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const name = document.getElementById('name').value;
  const surname = document.getElementById('surname').value;
  const age = document.getElementById('age').value;
  const phone = document.getElementById('phone').value;
  
  // Firebase-ga foydalanuvchi ma'lumotlarini qo'shish
  db.collection('students').add({
      name: name,
      surname: surname,
      age: age,
      phone: phone
  }).then(() => {
      localStorage.setItem('userName', name);
      localStorage.setItem('userSurname', surname);
      window.location.href = 'page/test.html';
  }).catch(error => {
      console.error('Error adding document: ', error);
  });
});

document.getElementById('adminLoginForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const username = document.getElementById('adminUsername').value;
  const password = document.getElementById('adminPassword').value;

  // Admin login tekshiruvi (bu yerda siz haqiqiy tekshiruv kodini qo'shishingiz mumkin)
  if (username === 'admin' && password === 'admin123') {
      window.location.href = 'page/admin.html';
  } else {
      alert('Login yoki parol xato!');
  }
  console.log('Tekshirish uchun qiymat:',preventDefault());
});

