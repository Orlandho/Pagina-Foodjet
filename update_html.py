import re

file_path = "frontend/index.html"
with open(file_path, "r") as f:
    content = f.read()

search_text = """                        <div class="mb-3">
                            <label for="registerEmail" class="form-label">Email</label>
                            <input type="email" class="form-control" id="registerEmail" placeholder="tu@email.com" required>
                        </div>"""

replace_text = """                        <div class="mb-3">
                            <label for="registerEmail" class="form-label">Email</label>
                            <input type="email" class="form-control" id="registerEmail" placeholder="tu@email.com" required>
                            <div id="registerEmailError" class="text-danger mt-1" style="display: none; font-size: 0.875em;">Una cuenta con este correo ya existe</div>
                        </div>"""

new_content = content.replace(search_text, replace_text)

with open(file_path, "w") as f:
    f.write(new_content)
