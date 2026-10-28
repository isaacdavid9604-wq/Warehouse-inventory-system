# Deploying to Render

Render has **no native Java runtime** – a Spring Boot service runs there through Docker (a `Dockerfile` is included). Render's support has also stated it does **not provide managed MySQL** (it offers PostgreSQL). Check Render's current docs before you start, since offerings change. You therefore need MySQL from one of:

* **A.** a MySQL service you run on Render yourself (private service, `mysql:8` Docker image + persistent disk; this is a paid instance type) – see <https://render.com/deploy-docker/mysql>; or
* **B.** an external MySQL 8 provider (check the provider's current free tier, TLS requirement and connection details).

This backend is written for MySQL (Flyway SQL uses MySQL syntax), so don't point it at Render PostgreSQL without porting the migration.

## 0. Prepare the code
1. Put the **backend** in its own GitHub repo (folder containing `pom.xml` and `Dockerfile`). Make sure `.env` is not committed (it is in `.gitignore`).
2. Put the **frontend** (`SE Project/`, without `node_modules`/`dist`) in a second repo (or the same repo in sub-folders – then set *Root Directory* on each Render service).

## 1. MySQL
**Option B (external provider):** create a MySQL 8 database and note host, port, database, user, password. Build the JDBC URL:
```
jdbc:mysql://HOST:PORT/DATABASE?useSSL=true&serverTimezone=UTC
```
(Some providers require extra parameters; follow their docs.)

**Option A (Render private service):**
1. Render dashboard → **New → Private Service → Existing Image** → `mysql:8`.
2. Environment variables: `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE=warehouse_inventory`, `MYSQL_USER=warehouse_app`, `MYSQL_PASSWORD=<strong password>`.
3. Add a **Disk** mounted at `/var/lib/mysql`.
4. Same region as the backend. The JDBC URL uses the service's internal hostname and port 3306:
   `jdbc:mysql://<internal-host>:3306/warehouse_inventory?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC`

## 2. Backend web service
1. **New → Web Service** → connect the backend repo.
2. **Runtime/Language: Docker** (it finds `Dockerfile`). Pick the **same region** as the database.
3. **Environment variables**

   | Key | Value |
   |---|---|
   | `DB_URL` | the JDBC URL from step 1 |
   | `DB_USERNAME` | DB user |
   | `DB_PASSWORD` | DB password (mark as secret) |
   | `SEED_ENABLED` | `true` for a demo (adds P101–P103 once), otherwise `false` |
   | `CORS_ALLOWED_ORIGINS` | the frontend URL, e.g. `https://wms-frontend.onrender.com` (set after step 3, then redeploy) |
   | `SWAGGER_ENABLED` | `false` if you don't want public API docs |

   Do **not** set `PORT` – Render provides it and the app reads it.
4. **Health Check Path:** `/actuator/health/liveness`
5. **Create Web Service.** The first build downloads Maven dependencies and takes several minutes. Flyway creates the tables on first start.
6. Verify: `https://<backend-name>.onrender.com/actuator/health` → `UP`, then `/api/products`.

## 3. Frontend static site
1. **New → Static Site** → connect the frontend repo.
2. **Build Command:** `npm install && npm run build` · **Publish Directory:** `dist`
3. **Environment variable:** `VITE_API_BASE_URL=https://<backend-name>.onrender.com/api`
   Vite bakes this value in **at build time** – after changing it you must trigger a new deploy.
4. **Redirects/Rewrites** (Redirects/Rewrites tab): source `/*` → destination `/index.html`, action **Rewrite**. Without this, refreshing `/products` or `/orders` returns 404.
5. Deploy, then copy the site's URL.

## 4. Close the loop
1. Backend service → Environment → set `CORS_ALLOWED_ORIGINS` to the exact frontend URL (no trailing path) → it redeploys.
2. Open the frontend → **Settings → Live Backend Mode → Test Connection**. (Or apply the optional one-line `'live'` default from `FRONTEND_INTEGRATION.md` before building, so new visitors start in live mode.)
3. Add a product, update stock, place an order, check Stock History.

## Things to know
* Free web instances sleep after inactivity; the first request can take about a minute (the frontend's 8 s request timeout may fail once – just retry).
* Only the database persists data; the backend container's filesystem is disposable.
* Never put DB passwords in the repo – use Render environment variables.
* Update flow: push to GitHub → Render redeploys automatically.
* Deployment instructions here have not been run by me (no Render access); follow Render's dashboard prompts where labels differ.
