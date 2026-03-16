function getSettings() {
  return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
}

function applyTheme() {
  const settings = getSettings();
  const theme = settings.theme || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
}

document.addEventListener('DOMContentLoaded', applyTheme);

function getUsers() {
  const stored = localStorage.getItem(USERS_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return [];
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

async function addUser(username, password) {
  const users = getUsers();
  if (users.find(u => u.username === username)) {
    return false;
  }
  users.push({
    username,
    password,
    createdAt: new Date().toISOString().split('T')[0]
  });
  saveUsers(users);
  return true;
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem('clienti_itpro_user') || 'null');
}

function isLoggedIn() {
  return !!localStorage.getItem('clienti_itpro_user');
}

// Login form handler
let loginSubmitting = false;

document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (loginSubmitting) return;
      loginSubmitting = true;
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      const btnText = document.getElementById('loginBtnText');
      const spinner = document.getElementById('loginSpinner');
      if (btnText) btnText.style.display = 'none';
      if (spinner) spinner.style.display = 'inline-block';
      
      const localAdmins = window.getAdmins();
      const admin = localAdmins.find(a => a.username === username && a.password === password);
      if (admin) {
        const userSession = {
          isAdmin: true,
          name: admin.username,
          username: admin.username,
          createdAt: new Date().toISOString().split('T')[0]
        };
        localStorage.setItem('clienti_itpro_user', JSON.stringify(userSession));
        localStorage.setItem(`last_visit_${userSession.username}`, new Date().toISOString());
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 800);
        loginSubmitting = false;
        return;
      }
      
      const users = getUsers();
      const user = users.find(u => u.username === username && u.password === password);
      if (user) {
        const userSession = {
          isAdmin: false,
          name: user.username,
          username: user.username,
          createdAt: user.createdAt || new Date().toISOString().split('T')[0]
        };
        localStorage.setItem('clienti_itpro_user', JSON.stringify(userSession));
        localStorage.setItem(`last_visit_${userSession.username}`, new Date().toISOString());
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 800);
        loginSubmitting = false;
        return;
      }
      
      if (btnText) {
        btnText.style.display = 'inline';
        btnText.textContent = 'Accedi';
      }
      if (spinner) spinner.style.display = 'none';
      showToast('Credenziali non valide', 'error');
      loginSubmitting = false;
    });
  }

  const carouselTrack = document.getElementById('carouselTrack');
  if (carouselTrack) {
    const slides = Array.from(carouselTrack.children);
    const dots = document.querySelectorAll('.carousel-dot');
    let currentIndex = 0;
    let intervalId;
  
    function updateCarousel() {
      carouselTrack.style.transform = `translateX(-${currentIndex * 100}%)`;
      dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentIndex);
      });
    }
  
    function nextSlide() {
      currentIndex = (currentIndex + 1) % slides.length;
      updateCarousel();
    }
  
    function startCarousel() {
      intervalId = setInterval(nextSlide, 5000);
    }
  
    function stopCarousel() {
      clearInterval(intervalId);
    }
  
    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        stopCarousel();
        currentIndex = parseInt(dot.dataset.index);
        updateCarousel();
        startCarousel();
      });
    });
  
    startCarousel();
  }

  const registerLink = document.getElementById('registerLink');
  const registerModal = document.getElementById('registerModal');
  const closeRegister = document.getElementById('closeRegister');
  const cancelRegister = document.getElementById('cancelRegister');

  if (registerLink && registerModal) {
    registerLink.addEventListener('click', (e) => {
      e.preventDefault();
      registerModal.classList.add('active');
    });
  }

  if (closeRegister && registerModal) {
    closeRegister.addEventListener('click', () => {
      registerModal.classList.remove('active');
    });
  }

  if (cancelRegister && registerModal) {
    cancelRegister.addEventListener('click', () => {
      registerModal.classList.remove('active');
    });
  }
  
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('regUsername').value;
      const password = document.getElementById('regPassword').value;
      
      if (!username || !password) {
        showToast('Compila tutti i campi', 'error');
        return;
      }
      
      const success = await addUser(username, password);
      if (success) {
        showToast('Account creato! Puoi accedere.', 'success');
        registerModal.classList.remove('active');
        registerForm.reset();
      } else {
        showToast('Username già esistente', 'error');
      }
    });
  }

  const togglePasswordBtn = document.getElementById('togglePassword');
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', () => {
      const passwordInput = document.getElementById('password');
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        togglePasswordBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-eye-off"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
      } else {
        passwordInput.type = 'password';
        togglePasswordBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-eye"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
      }
    });
  }
});

function togglePassword(inputId, button) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-eye-off"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
  } else {
    input.type = 'password';
    button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-eye"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
  }
}
