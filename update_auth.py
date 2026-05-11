import re

file_path = "backend/src/controllers/authController.js"
with open(file_path, "r") as f:
    content = f.read()

search_text = """        // Verificar si el usuario ya existe
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'El email ya está registrado.' });
        }"""

replace_text = """        // Verificar si el usuario ya existe
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ error: 'El email ya está registrado.', code: 'EMAIL_ALREADY_EXISTS' });
        }"""

new_content = content.replace(search_text, replace_text)

with open(file_path, "w") as f:
    f.write(new_content)
