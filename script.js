// === 1. PENGATURAN TEMA (DARK / LIGHT MODE) ===
const themeToggleBtn = document.getElementById('theme-toggle');
const htmlElement = document.documentElement;

// Cek tema tersimpan di browser
const savedTheme = localStorage.getItem('theme') || 'light';
htmlElement.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

themeToggleBtn.addEventListener('click', () => {
    const currentTheme = htmlElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    htmlElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
});

function updateThemeIcon(theme) {
    const icon = themeToggleBtn.querySelector('i');
    if (theme === 'dark') {
        icon.className = 'fas fa-sun';
    } else {
        icon.className = 'fas fa-moon';
    }
}

// === 2. SISTEM LOGIN & REGISTER (LOCALSTORAGE) ===
const authSection = document.getElementById('auth-section');
const loginModal = document.getElementById('login-modal');
const closeLoginModal = document.getElementById('close-login-modal');
const authForm = document.getElementById('auth-form');
const toggleAuthMode = document.getElementById('toggle-auth-mode');

let isRegisterMode = false;

// Render status login saat halaman dimuat
function checkAuthStatus() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        authSection.innerHTML = `
            <div class="user-badge">
                <span><i class="fas fa-user-circle"></i> Halo, ${currentUser.name}</span>
                <button onclick="logout()" class="btn-logout">Keluar</button>
            </div>
        `;
    } else {
        authSection.innerHTML = `<button id="open-login-btn" class="btn-primary">Masuk</button>`;
        document.getElementById('open-login-btn').addEventListener('click', () => {
            loginModal.classList.remove('hidden');
        });
    }
}

closeLoginModal.addEventListener('click', () => loginModal.classList.add('hidden'));

// Pindah antara mode Masuk dan Daftar
toggleAuthMode.addEventListener('click', (e) => {
    e.preventDefault();
    isRegisterMode = !isRegisterMode;
    
    document.getElementById('auth-title').textContent = isRegisterMode ? 'Buat Akun Baru' : 'Masuk ke Akun';
    document.getElementById('auth-submit-btn').textContent = isRegisterMode ? 'Daftar' : 'Masuk';
    document.getElementById('name-group').style.display = isRegisterMode ? 'block' : 'none';
    document.getElementById('toggle-text').textContent = isRegisterMode ? 'Sudah punya akun?' : 'Belum punya akun?';
    toggleAuthMode.textContent = isRegisterMode ? 'Masuk di sini' : 'Daftar sekarang';
});

// Proses Submit Form Login / Register
authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const name = document.getElementById('username').value.trim();

    let users = JSON.parse(localStorage.getItem('users')) || [];

    if (isRegisterMode) {
        if (!name) return alert('Nama lengkap wajib diisi!');
        const exists = users.some(u => u.email === email);
        if (exists) return alert('Email sudah terdaftar!');

        const newUser = { name, email, password };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        alert('Pendaftaran berhasil! Anda otomatis masuk.');
    } else {
        const user = users.find(u => u.email === email && u.password === password);
        if (!user) {
            // Jika belum pernah daftar, izinkan login demo jika email & password diisi
            return alert('Email atau kata sandi salah! Silakan daftar akun terlebih dahulu.');
        }
        localStorage.setItem('currentUser', JSON.stringify(user));
    }

    authForm.reset();
    loginModal.classList.add('hidden');
    checkAuthStatus();
});

window.logout = function() {
    localStorage.removeItem('currentUser');
    checkAuthStatus();
};

// === 3. PENCARIAN RESEP MAKANAN (API THEMEALDB) ===
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const recipeGrid = document.getElementById('recipe-grid');
const loader = document.getElementById('loader');
const sectionTitle = document.getElementById('section-title');
const recipeModal = document.getElementById('recipe-modal');
const closeRecipeModal = document.getElementById('close-recipe-modal');

async function fetchRecipes(query) {
    loader.classList.remove('hidden');
    recipeGrid.innerHTML = '';
    
    try {
        const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`);
        const data = await res.json();
        loader.classList.add('hidden');

        if (!data.meals) {
            recipeGrid.innerHTML = `<p>Resep "${query}" tidak ditemukan. Coba kata kunci bahasa Inggris seperti <b>Chicken</b>, <b>Soup</b>, atau <b>Cake</b>.</p>`;
            return;
        }

        data.meals.forEach(meal => {
            const card = document.createElement('div');
            card.className = 'recipe-card';
            card.innerHTML = `
                <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
                <div class="recipe-info">
                    <div>
                        <h3>${meal.strMeal}</h3>
                        <p class="recipe-meta"><i class="fas fa-tag"></i> ${meal.strCategory} • ${meal.strArea}</p>
                    </div>
                    <button class="btn-primary full-width" onclick="showRecipeDetail('${meal.idMeal}')">Lihat Resep</button>
                </div>
            `;
            recipeGrid.appendChild(card);
        });
    } catch (error) {
        loader.classList.add('hidden');
        recipeGrid.innerHTML = `<p>Terjadi kesalahan jaringan saat mengambil data resep.</p>`;
    }
}

// Lihat Detail Resep
window.showRecipeDetail = async function(id) {
    // Wajib login untuk melihat resep penuh (opsional, bisa dihapus jika ingin bebas)
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        alert('Silakan masuk (Login) terlebih dahulu untuk melihat detail takaran & cara memasak!');
        loginModal.classList.remove('hidden');
        return;
    }

    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
    const data = await res.json();
    const meal = data.meals[0];

    // Kumpulkan daftar bahan & takaran
    let ingredientsHTML = '';
    for (let i = 1; i <= 20; i++) {
        const ingredient = meal[`strIngredient${i}`];
        const measure = meal[`strMeasure${i}`];
        if (ingredient && ingredient.trim() !== '') {
            ingredientsHTML += `<li>${measure} <strong>${ingredient}</strong></li>`;
        }
    }

    document.getElementById('recipe-detail-body').innerHTML = `
        <h2>${meal.strMeal}</h2>
        <p class="recipe-meta">Kategori: ${meal.strCategory} | Asal: ${meal.strArea}</p>
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="detail-img">
        <h3>Bahan-bahan:</h3>
        <ul class="ingredients-list">${ingredientsHTML}</ul>
        <h3>Cara Membuat:</h3>
        <p style="white-space: pre-line; margin-top: 0.5rem;">${meal.strInstructions}</p>
    `;

    recipeModal.classList.remove('hidden');
};

closeRecipeModal.addEventListener('click', () => recipeModal.classList.add('hidden'));

// Event Listener Pencarian
searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
        sectionTitle.textContent = `Hasil Pencarian: "${query}"`;
        fetchRecipes(query);
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchBtn.click();
});

// Event Listener Tombol Kategori Cepat
document.querySelectorAll('.tag-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const query = btn.getAttribute('data-query');
        searchInput.value = query;
        sectionTitle.textContent = `Kategori: ${btn.textContent}`;
        fetchRecipes(query);
    });
});

// Jalankan saat pertama kali dibuka
checkAuthStatus();
fetchRecipes('Chicken'); // Tampilkan resep default saat awal buka
