import re

file_path = "frontend/js/legacy.js"
with open(file_path, "r") as f:
    content = f.read()

search_text = """    e.preventDefault();
    const nombre = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const telefono = document.getElementById('registerPhone').value.trim();
    const password = document.getElementById('registerPassword').value;"""

replace_text = """    e.preventDefault();

    // Ocultar mensaje de error de email previo
    const emailErrorElement = document.getElementById('registerEmailError');
    if (emailErrorElement) emailErrorElement.style.display = 'none';

    const nombre = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const telefono = document.getElementById('registerPhone').value.trim();
    const password = document.getElementById('registerPassword').value;"""

content = content.replace(search_text, replace_text)

search_text_error = """        if (response.ok) {
            showToast('Usuario registrado exitosamente. Por favor, inicia sesión.');

            const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
            if (registerModal) registerModal.hide();

            setTimeout(() => {
                const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
                loginModal.show();
            }, 500);

            document.getElementById('registerForm').reset();
        } else {
            showToast(data.error || 'Error al registrar el usuario', 'warning');
        }"""

replace_text_error = """        if (response.ok) {
            showToast('Usuario registrado exitosamente. Por favor, inicia sesión.');

            const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
            if (registerModal) registerModal.hide();

            setTimeout(() => {
                const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
                loginModal.show();
            }, 500);

            document.getElementById('registerForm').reset();
        } else if (response.status === 409 || data.code === 'EMAIL_ALREADY_EXISTS') {
            const emailErrorElement = document.getElementById('registerEmailError');
            if (emailErrorElement) {
                emailErrorElement.style.display = 'block';
            } else {
                showToast(data.error || 'El email ya está registrado.', 'warning');
            }
        } else {
            showToast(data.error || 'Error al registrar el usuario', 'warning');
        }"""

content = content.replace(search_text_error, replace_text_error)

with open(file_path, "w") as f:
    f.write(content)
