# Handoff Report — Explorer M4-2
## Feature 17: My Account & Student Verification (`#miCuentaModal`)

- **Author**: Explorer M4-2
- **Milestone**: Milestone 4 (Secondary Views, Modals & Operations Panel)
- **Role**: Teamwork Explorer (Read-only Investigation)
- **Working Directory**: `.agents/teamwork/explorer_m4_2/`
- **Handoff Type**: Hard (Task Complete)
- **Date**: 2026-10-31

---

### 1. Observation

1. **Current Modal DOM Implementation**:
   - Location: `frontend/index.html:1177–1209`.
   - Exact markup:
     ```html
     <div class="modal fade" id="miCuentaModal" tabindex="-1" aria-labelledby="miCuentaModalLabel" aria-hidden="true">
         <div class="modal-dialog">
             <div class="modal-content">
                 <div class="modal-header">
                     <h5 class="modal-title" id="miCuentaModalLabel"><i class="bi bi-person-circle me-2"></i>Mi Cuenta</h5>
                     <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                 </div>
                 <div class="modal-body">
                     <div class="mb-4">
                         <h6>Estado de Estudiante</h6>
                         <div id="studentStatusContainer" class="alert alert-secondary" role="alert">
                             Cargando...
                         </div>
                     </div>
                     <div id="verifyStudentFormContainer" style="display: none;">
                         <h6>Verificar Carnet Universitario</h6>
                         <p class="text-muted small">Sube una foto de tu carnet para acceder a descuentos exclusivos.</p>
                         <form id="verifyStudentForm">
                             <div class="mb-3">
                                 <label for="carnetImage" class="form-label">Foto del Carnet</label>
                                 <input class="form-control" type="file" id="carnetImage" accept="image/*" required>
                             </div>
                             <button type="submit" class="btn btn-primary w-100" id="verifyStudentSubmitBtn">
                                 <span class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
                                 Verificar
                             </button>
                         </form>
                     </div>
                 </div>
             </div>
         </div>
     </div>
     ```
2. **Current Event Handlers & ClassName Trap**:
   - In `frontend/js/app.js:844–920`:
     - Line 844: `document.getElementById('miCuentaBtn')?.addEventListener('click', (e) => { ... })`.
     - Lines 855–863:
       ```javascript
       if (window.currentUser.es_estudiante) {
           statusContainer.className = 'alert alert-success';
           statusContainer.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i><strong>Verificado</strong> - Disfrutas de descuentos para estudiantes.';
           formContainer.style.display = 'none';
       } else {
           statusContainer.className = 'alert alert-secondary';
           statusContainer.innerHTML = '<i class="bi bi-info-circle-fill me-2"></i>No verificado';
           formContainer.style.display = 'block';
       }
       ```
     - Line 870: `document.getElementById('verifyStudentForm')?.addEventListener('submit', async (e) => { ... })`.
     - Line 886: `const result = await api.verifyStudentAPI(fileInput.files[0], window.authToken);`.
     - Lines 899–901:
       ```javascript
       document.getElementById('studentStatusContainer').className = 'alert alert-success';
       document.getElementById('studentStatusContainer').innerHTML = '<i class="bi bi-check-circle-fill me-2"></i><strong>Verificado</strong> - Disfrutas de descuentos para estudiantes.';
       document.getElementById('verifyStudentFormContainer').style.display = 'none';
       ```
     - Notice that `statusContainer.className` is directly overwritten via `=`, which destroys any custom utility classes written on `#studentStatusContainer` unless CSS rules are explicitly bound to `#studentStatusContainer.alert-success` and `#studentStatusContainer.alert-secondary`.
3. **Dual Entry Point Desynchronization**:
   - In `frontend/js/ui.js:164–167`:
     ```javascript
     addressBar.addEventListener('click', () => {
         if (window.authToken && typeof bootstrap !== 'undefined') {
             const modalEl = document.getElementById('miCuentaModal');
             if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).show();
         }
     ```
     When clicking `#headerAddressBar`, the modal is displayed directly without triggering `#miCuentaBtn.click()`. Because there is currently no `show.bs.modal` listener, opening the modal via the address bar left the status uninitialized ("Cargando...").
4. **Backend Contract Verification**:
   - In `backend/src/controllers/userController.js:3–31`:
     - Method `verifyStudent` expects `image` upload via `multipart/form-data`.
     - If `user.es_estudiante === true`, returns `400 { error: 'Su estado de estudiante ya está verificado' }`.
     - After 1.5s delay, updates DB: `prisma.user.update({ where: { id: userId }, data: { es_estudiante: true } })`.
     - Returns `200 { message: 'Estudiante verificado exitosamente', es_estudiante: true }`.
   - In `backend/src/routes/userRoutes.js:6`:
     - Only `POST /verify-student` exists. **There is no profile edit or password update endpoint in `userRoutes.js`.**
5. **Compose Mobile Prototype (`Modals.kt:538–665`)**:
   - `MiCuentaDialog`:
     - Card with `shape = RoundedCornerShape(20.dp)`, `colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)`.
     - 60dp circular avatar in `FoodJetPrimary.copy(alpha = 0.2f)` with `Icons.Default.Person` in `FoodJetPrimaryDark`.
     - User name (bold 18sp) and user email (13sp).
     - Student status `Surface` with `RoundedCornerShape(12.dp)`: Green `FoodJetSuccess` with school icon if verified; neutral surface with info icon if unverified.
     - "Verificar Estudiante" button (`Icons.Default.School`) when unverified.
     - "Panel de Operaciones Admin" button (`Icons.Default.Settings`) when `isAdmin == true`.
     - "Cerrar Sesión" button in red outline (`Icons.AutoMirrored.Filled.ExitToApp`).
6. **Test Suite Baseline**:
   - Execution of `npm run test:unit`: 25 passing, 0 failing.
   - Execution of `node --test tests/unit/e2e_acceptance_tiers.test.mjs`: 68 passing, 0 failing.
   - Execution of `node --test tests/unit/challenger_m3_1_empirical.test.mjs tests/unit/challenger_m3_2_empirical.test.mjs`: 56 passing, 0 failing.

---

### 2. Logic Chain

1. **DOM ID Invariance (Observation 1 & 2)**:
   - Because `app.js` attaches listeners to `#miCuentaBtn`, `#verifyStudentForm`, `#carnetImage`, and `#verifyStudentSubmitBtn`, and manipulates `#studentStatusContainer` and `#verifyStudentFormContainer`, modifying or removing any of these 7 IDs breaks the core student verification flow.
   - Therefore, all 7 baseline IDs must remain intact with identical tag semantics and nesting capabilities.
2. **Styling Robustness against Overwrites (Observation 2)**:
   - Because `app.js` performs `statusContainer.className = 'alert alert-success'` and `statusContainer.className = 'alert alert-secondary'`, any CSS class added strictly in HTML will be wiped on the first click.
   - Therefore, styling for the student status banner must be specified on `#studentStatusContainer.alert-success` and `#studentStatusContainer.alert-secondary` in `frontend/styles.css`, ensuring permanent resilience regardless of class re-assignment.
3. **Dual Entry Point Synchronization (Observation 3)**:
   - Because users can open `#miCuentaModal` via either `#miCuentaBtn` or `#headerAddressBar`, binding population logic only to `#miCuentaBtn` causes an inconsistent, unpopulated modal when accessed via `#headerAddressBar`.
   - Therefore, attaching a `show.bs.modal` event listener to `#miCuentaModal` ensures that user name, email, phone, role badge, student status, and form visibility are synchronized whenever the modal is shown, regardless of trigger.
4. **Honest Profile Information Scope (Observation 4)**:
   - Because the backend does not expose an endpoint to edit user profiles (`userRoutes.js` only contains `POST /verify-student`), presenting editable input fields with "Save" buttons would violate **Rule R4 (Honest Behavior)**.
   - Therefore, `#accountNombre`, `#accountEmail`, `#accountTelefono`, and `#accountRol` must be rendered as clean, high-fidelity read-only text/badge displays, faithfully reflecting `window.currentUser` as set during login or session restore.
5. **Compose Visual Parity (Observation 5)**:
   - Incorporating the peach circular avatar (`#accountAvatar`), student status dual-state card (`#studentStatusContainer`), document upload zone (`#carnetImage`), admin shortcut (`#accountAdminBtn`), and logout shortcut (`#accountLogoutBtn`) achieves 1:1 design alignment with the Compose prototype.

---

### 3. Caveats

- **No Profile Editing in Backend**: The database schema possesses fields for `nombre`, `email`, `telefono`, and `password`, but no REST endpoint exists for a user to update their phone or name. If profile editing is requested in the future, it would require backend controller and route additions which are strictly prohibited under Rule R2 for this frontend modernization task.
- **Client-Side File Simulation**: The backend mock controller simulates a 1.5-second verification delay without performing actual OCR on the carnet image. The frontend must continue sending the image file via `FormData` as required by `api.verifyStudentAPI()`.
- **Session Expiration**: If the JWT token expires while `#miCuentaModal` is open, calling `verifyStudentAPI` will return a 401/403. This is properly captured by `api.js` and displayed via `ui.showToast()`.

---

### 4. Conclusion

Feature 17 (`#miCuentaModal`) can be upgraded to complete Compose fidelity with zero regression risk by implementing the blueprint specified in `report.md`:
1. Keep all 7 preserved DOM IDs (`#miCuentaModal`, `#miCuentaModalLabel`, `#studentStatusContainer`, `#verifyStudentFormContainer`, `#verifyStudentForm`, `#carnetImage`, `#verifyStudentSubmitBtn`).
2. Add profile display elements (`#accountAvatar`, `#accountNombre`, `#accountEmail`, `#accountTelefono`, `#accountRol`, `#accountEstudianteBadge`, `#accountAdminBtn`, `#accountLogoutBtn`).
3. Apply design token CSS rules in `frontend/styles.css` targeting `#studentStatusContainer.alert-success` and `.alert-secondary`.
4. Add a `show.bs.modal` listener in `frontend/js/app.js` to ensure 100% consistent population from both `#miCuentaBtn` and `#headerAddressBar`.

---

### 5. Verification Method

1. **Unit Test Regression Suite**:
   ```bash
   npm run test:unit
   node --test tests/unit/e2e_acceptance_tiers.test.mjs
   node --test tests/unit/challenger_m3_1_empirical.test.mjs tests/unit/challenger_m3_2_empirical.test.mjs
   ```
   *Expected result*: All suites pass with 0 failures and 0 regressions.
2. **DOM ID Integrity Inspection**:
   Verify in `frontend/index.html` that:
   - `#miCuentaModal` exists with `tabindex="-1"` and `aria-labelledby="miCuentaModalLabel"`.
   - `#studentStatusContainer` exists inside modal body.
   - `#verifyStudentFormContainer` wraps `#verifyStudentForm`.
   - `#carnetImage` is `<input type="file" ...>`.
   - `#verifyStudentSubmitBtn` contains `.spinner-border`.
3. **Interactive Visual Flow (Local Server `http://localhost:8081`)**:
   - Log in as regular customer (`cliente2@mail.com` / `Cliente123!`).
   - Click user dropdown -> "Mi Cuenta". Verify circular avatar, user name, "Cuenta Regular" alert card, and visible carnet upload form.
   - Select a carnet image and click "Verificar Carnet". Verify loading spinner, 1.5s delay, success toast, status transition to "Estudiante Verificado", and modal auto-close.
   - Verify that catalog products with student discount now display `PRECIO ESTUDIANTE` badges with strikethrough prices.
   - Open `#miCuentaModal` again (or click `#headerAddressBar`). Verify that the modal opens with "Estudiante Verificado" and the upload form remains hidden.
   - Log in as admin (`admin@foodjet.com` / `Admin123!`). Open "Mi Cuenta" and verify `#accountAdminBtn` ("Panel de Operaciones Admin") is visible and functional.
