#!/bin/bash
cat << 'INNER_EOF' > patch.diff
<<<<<<< SEARCH
        // Verificar si el usuario ya existe
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'El email ya está registrado.' });
        }
=======
        // Verificar si el usuario ya existe
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ error: 'El email ya está registrado.', code: 'EMAIL_ALREADY_EXISTS' });
        }
>>>>>>> REPLACE
INNER_EOF
patch backend/src/controllers/authController.js < patch.diff
