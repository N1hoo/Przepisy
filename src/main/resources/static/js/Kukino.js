document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ Frontend załadowany!");
    checkLoginStatus();
    checkLoginStatus();
    loadPopularRecipes(); // Ładowanie najpopularniejszych przepisów
});

function register() {
    const username = document.getElementById("register-username").value.trim();
    const password = document.getElementById("register-password").value.trim();
    
    if (!username || !password) {
        document.getElementById("register-message").innerText = "⚠️ Podaj nazwę użytkownika i hasło!";
        return;
    }

    fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.text())
    .then(message => {
        document.getElementById("register-message").innerText = message;
    })
    .catch(error => console.error("❌ Błąd rejestracji", error));
}

function login() {
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value.trim();

    if (!username || !password) {
        document.getElementById("login-message").innerText = "⚠️ Podaj nazwę użytkownika i hasło!";
        return;
    }

    fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    })
    .then(response => {
        if (!response.ok) throw new Error("Błędne dane logowania!");
        return response.text();
    })
    .then(message => {
        document.getElementById("login-message").innerText = message;
        checkLoginStatus();
    })
    .catch(error => {
        document.getElementById("login-message").innerText = "❌ Niepoprawne dane!";
        console.error("❌ Błąd logowania", error);
    });
}

function checkLoginStatus() {
    fetch("/api/auth/status")
    .then(response => {
        if (!response.ok) throw new Error("Nie zalogowano");
        return response.text();
    })
    .then(username => {
        document.getElementById("user-panel").style.display = "block";
        document.getElementById("login-container").style.display = "none";
        document.getElementById("register-container").style.display = "none";
        document.getElementById("user-name").innerText = username.replace("✅ Zalogowany jako: ", "");
        
        console.log("🔄 Wczytywanie moich przepisów...");
        loadUserRecipes(); // 🔥 AUTOMATYCZNE WYCZYTANIE PRZEPISÓW PO ZALOGOWANIU!
    })
    .catch(() => {
        document.getElementById("user-panel").style.display = "none";
        document.getElementById("login-container").style.display = "block";
        document.getElementById("register-container").style.display = "block";
    });
}


function logout() {
    fetch("/api/auth/logout", { method: "POST" })
    .then(() => {
        document.getElementById("login-message").innerText = "👋 Wylogowano!";
        checkLoginStatus();
    })
    .catch(error => console.error("❌ Błąd wylogowania", error));
}
function changePassword() {
    const newPassword = document.getElementById("new-password").value.trim();
    if (!newPassword) {
        document.getElementById("password-message").innerText = "⚠️ Podaj nowe hasło!";
        return;
    }

    fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword })
    })
    .then(response => response.text())
    .then(message => {
        document.getElementById("password-message").innerText = message;
    })
    .catch(error => console.error("❌ Błąd zmiany hasła", error));
}

function deleteAccount() {
    if (!confirm("⚠️ Na pewno chcesz usunąć konto? Tej operacji nie można cofnąć!")) {
        return;
    }

    fetch("/api/user/delete", { method: "DELETE" })
    .then(response => response.text())
    .then(message => {
        document.getElementById("delete-message").innerText = message;
        setTimeout(() => logout(), 2000); // Wylogowanie po usunięciu konta
    })
    .catch(error => console.error("❌ Błąd usuwania konta", error));
}

function addRecipe() {
    const title = document.getElementById("recipe-title").value.trim();
    const ingredients = document.getElementById("recipe-ingredients").value.trim().split(",");
    const instructions = document.getElementById("recipe-instructions").value.trim();

    if (!title || ingredients.length === 0 || !instructions) {
        document.getElementById("recipe-message").innerText = "⚠️ Uzupełnij wszystkie pola!";
        return;
    }

    fetch("/api/recipes/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, ingredients, instructions })
    })
    .then(response => response.text())
    .then(message => {
        document.getElementById("recipe-message").innerText = message;
        loadUserRecipes(); // Odśwież listę przepisów
    })
    .catch(error => console.error("❌ Błąd dodawania przepisu", error));
}

function loadUserRecipes() {
    fetch("/api/recipes/my")
    .then(response => response.json())
    .then(recipes => {
        const list = document.getElementById("user-recipes");
        list.innerHTML = ""; // 🔄 Wyczyść poprzednie wyniki

        if (!recipes || recipes.length === 0) {
            list.innerHTML = "<li class='list-group-item text-danger'>🚫 Brak przepisów</li>";
            return;
        }

        recipes.forEach(recipe => {
            const listItem = document.createElement("li");
            listItem.className = "list-group-item";
            listItem.innerHTML = `
                <strong>${recipe.title}</strong><br>
                🥘 Składniki: ${recipe.ingredients.join(", ")}<br>
                📜 Instrukcje: ${recipe.instructions}<br>
                <button onclick="editRecipe('${recipe.id}')" class="btn btn-primary">✏️ Edytuj</button>
                <button onclick="deleteRecipe('${recipe.id}')" class="btn btn-danger">❌ Usuń</button>
            `;
            list.appendChild(listItem);
        });
    })
    .catch(error => console.error("❌ Błąd ładowania moich przepisów", error));
}

function deleteRecipe(recipeId) {
    if (!confirm("⚠️ Na pewno chcesz usunąć ten przepis?")) return;

    fetch(`/api/recipes/delete/${recipeId}`, { method: "DELETE" })
    .then(response => response.text())
    .then(message => {
        alert(message);
        loadUserRecipes(); // Odśwież listę przepisów
    })
    .catch(error => console.error("❌ Błąd usuwania przepisu", error));
}

function loadPopularRecipes() {
    fetch("/api/recipes/popular")
        .then(response => {
            console.log("Status: " + response.status);
            return response.text();
        })
        .then(text => {
            console.log("Surowa odpowiedź: '" + text + "'");
            return JSON.parse(text || "[]");  // jeśli text jest pusty, parsujemy "[]"
        })
        .then(recipes => {
            // przetwarzanie listy przepisów
            const list = document.getElementById("popularRecipesList");
            list.innerHTML = ""; // Wyczyść listę
            if (!recipes || recipes.length === 0) {
                list.innerHTML = "<li class='list-group-item text-danger'>🚫 Brak popularnych przepisów</li>";
                return;
            }
            recipes.forEach(recipe => {
                const listItem = document.createElement("li");
                listItem.className = "list-group-item";
                listItem.innerHTML = `
                    <strong>${recipe.title}</strong><br> 
                    🥘 Składniki: ${recipe.ingredients.join(", ")}<br>
                    📜 Instrukcje: ${recipe.instructions}
                `;
                list.appendChild(listItem);
            });
        })
        .catch(error => {
            console.error("❌ Błąd pobierania popularnych przepisów", error);
            alert("🚨 Błąd połączenia z serwerem!");
        });
}

function searchRecipes() {
    const query = document.getElementById("searchInput").value.trim();
    if (!query) {
        alert("❗ Wpisz nazwę przepisu lub składnik!");
        return;
    }

    console.log(`🔍 Wyszukiwanie przepisów dla: ${query}`);

    axios.get(`/api/recipes/search?query=${encodeURIComponent(query)}`)
        .then(response => {
            console.log("📡 Odpowiedź API:", response.data);
            const recipes = response.data;
            const recipesList = document.getElementById("recipesList");
            recipesList.innerHTML = ""; // Wyczyść poprzednie wyniki

            if (recipes.length === 0) {
                recipesList.innerHTML = "<li class='list-group-item text-danger'>🚫 Brak wyników</li>";
            } else {
                recipes.forEach(recipe => {
                    const listItem = document.createElement("li");
                    listItem.className = "list-group-item";
                    listItem.innerHTML = `
                        <strong>${recipe.title}</strong><br> 
                        🥘 Składniki: ${recipe.ingredients.join(", ")}<br>
                        📜 Instrukcje: ${recipe.instructions}<br>
                    `;
                    recipesList.appendChild(listItem);
                });
            }
        })
        .catch(error => {
            console.error("❌ Błąd pobierania przepisów", error);
            alert("🚨 Błąd połączenia z serwerem!");
        });
}

window.searchRecipes = searchRecipes;