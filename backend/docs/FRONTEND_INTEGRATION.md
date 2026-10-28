# Connecting the backend to your existing React frontend

The frontend (`SE Project/`) is React 18 + Vite + TypeScript + Tailwind. It talks to the backend through `src/services/*.ts` using `VITE_API_BASE_URL` (already `http://localhost:8080/api` in its `.env`). **No frontend source changes are required.** The backend JSON matches `src/types/*.ts` (see `API_CONTRACT.md`, "Differences").

## Local run – step by step

1. **Start MySQL** and create the database/user (README §1).
   - Windows: start the *MySQL80* service (Services app) or `net start MySQL80` in an admin terminal.
   - macOS: `brew services start mysql` · Linux: `sudo systemctl start mysql`
2. **Set the backend variables** (PowerShell):
   ```powershell
   $env:DB_USERNAME = "warehouse_app"
   $env:DB_PASSWORD = "your_password"
   ```
3. **Run the backend on port 8080** from the backend folder:
   ```bash
   mvn spring-boot:run
   ```
   Check: <http://localhost:8080/actuator/health> → `{"status":"UP"}` and <http://localhost:8080/api/products> → P101, P102, P103.
4. **Run the frontend on 5173** from the `SE Project` folder:
   ```bash
   npm install
   npm run dev
   ```
   `vite.config.ts` pins port **5173** (`strictPort: true`), which is the origin the backend allows by default.
5. **Check the API URL.** `SE Project/.env` should contain `VITE_API_BASE_URL=http://localhost:8080/api`. If you edit `.env`, restart `npm run dev`.
6. **Switch the website to Live mode.** Open <http://localhost:5173> → **Settings** → *Live Backend Mode* → **Test Connection**. (The frontend defaults to *Interactive Demo Mode*, which only uses browser localStorage, so nothing reaches MySQL until you switch.)
7. **Test through the website**
   - *Add Product*: add `P104` / `Laptop` → then confirm in MySQL: `SELECT * FROM products;`
   - Add `P104` again → "already exists" error (409).
   - *Update Stock*: set P101 to `25`, then `0`; try `-5`, `2.5`, `abc` (frontend and backend both reject).
   - *Availability*: P101, quantity 10 → available; quantity 500 → not available.
   - *Orders*: order 5 × P101 → stock drops by 5, a row appears in *Stock History*.
   - Stop and restart the backend → data is still there (persistent).

### Optional one-line frontend tweak (not applied)
So that visitors of a *deployed* site don't land in demo mode, in `src/services/productService.ts` change
```ts
return (localStorage.getItem('wms_connection_mode') as ConnectionMode) || 'demo';
```
to
```ts
return (localStorage.getItem('wms_connection_mode') as ConnectionMode) || 'live';
```
Everything else works unchanged either way.

## If something fails
* CORS error in the browser console → add the exact origin to `CORS_ALLOWED_ORIGINS`, restart the backend.
* "Unable to connect to backend server" → backend not running / wrong URL (Settings → API Base URL).
* Product list empty → `SEED_ENABLED=false` or you pointed at a different database.
