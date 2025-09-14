Goal
Create a robust, env-driven workflow for stage → uat → prod where you can easily switch the runtime environment and run the test suite or Docker services for that environment.

Overview (recommended approach)
1. Keep separate env files for each environment in a single folder (eg. `envs/`):
   - [`envs/.env.stage`](envs/.env.stage:1)
   - [`envs/.env.uat`](envs/.env.uat:1)
   - [`envs/.env.prod`](envs/.env.prod:1)

2. Do not commit secrets to the repo. Put only non-sensitive defaults in the env files. Use secret management for real secrets (vault, GitHub secrets, etc.).

3. Use one of these runtime strategies:
   - Runtime env-file with Docker Compose (recommended when running inside containers).
   - Copy a chosen env file to the repo root as `.env` (simple local workflow).
   - Use a small Node script to switch envs (cross-platform), then run existing commands.

Files and commands (examples)
1) Minimal env file samples (place in `envs/`):
   - [`envs/.env.stage`](envs/.env.stage:1)
     BASE_URL=https://www.flipkart.com/
     NODE_ENV=stage
     CI=false
     PLAYWRIGHT_HEADLESS=true

   - [`envs/.env.uat`](envs/.env.uat:1)
     BASE_URL=https://uat.example.com
     NODE_ENV=uat
     CI=false
     PLAYWRIGHT_HEADLESS=true

   - [`envs/.env.prod`](envs/.env.prod:1)
     BASE_URL=https://www.example.com
     NODE_ENV=production
     CI=true
     PLAYWRIGHT_HEADLESS=true

2) Run using docker-compose with an env-file (no repo changes required)
   - Unix / Linux / macOS (docker-compose v1.28+ or `docker compose` v2):
     docker-compose --env-file ./envs/.env.stage up --build --abort-on-container-exit --exit-code-from playwright
   - Windows (PowerShell):
     docker-compose --env-file .\envs\.env.stage up --build --abort-on-container-exit --exit-code-from playwright

   Notes:
   - This runs the service using values from the selected env file. You can substitute `.env.stage` with `.env.uat` or `.env.prod`.
   - For interactive runs replace `up` with `run --rm playwright` or `up` w/ `-d` then `docker-compose logs -f`.

3) Simple copy-and-run (cross-platform)
   - Unix:
     cp envs/.env.stage .env && docker-compose up --build
   - Windows CMD:
     copy envs\.env.stage .env && docker-compose up --build
   - Cross-platform Node wrapper (recommended to avoid OS-specific commands) — example script below.

4) Example Node switcher script (cross-platform)
   - Create a script at [`scripts/switch-env.js`](scripts/switch-env.js:1) that copies `envs/.env.<name>` to `.env` (this avoids shell differences).
   - Usage:
     node ./scripts/switch-env.js stage    # copies envs/.env.stage -> .env
     node ./scripts/switch-env.js uat
     node ./scripts/switch-env.js prod
   - After switching: docker-compose up --build (or npm run test inside Docker)

5) Example npm scripts to add to [`package.json`](package.json:1)
   - "env:stage": "node ./scripts/switch-env.js stage"
   - "env:uat": "node ./scripts/switch-env.js uat"
   - "env:prod": "node ./scripts/switch-env.js prod"
   - "dc:stage": "docker-compose --env-file ./envs/.env.stage up --build"
   - "dc:uat": "docker-compose --env-file ./envs/.env.uat up --build"
   - "dc:prod": "docker-compose --env-file ./envs/.env.prod up --build"

Robust promotion flow (stage → uat → prod)
1. Developer creates feature branch and tests locally against `stage`:
   - git checkout feature/stage
   - node ./scripts/switch-env.js stage
   - docker-compose --env-file ./envs/.env.stage up --build
   - Run tests and verify behavior.

2. After stage verification, merge feature branch and create/push branch for UAT or tag:
   - git checkout feature/uat (or create it)
   - node ./scripts/switch-env.js uat
   - docker-compose --env-file ./envs/.env.uat up --build
   - Run tests in UAT, run smoke checks.

3. After UAT sign-off, promote to prod:
   - node ./scripts/switch-env.js prod
   - docker-compose --env-file ./envs/.env.prod up --build
   - Run final verification steps.

Safe practices & notes
- Do not store credentials in repo. Use placeholders or reference secrets from CI/CD.
- Use `--env-file` where supported to avoid copying `.env`.
- In CI/CD pipelines (GitHub Actions / Jenkins / etc.) inject the target env as secrets or use built-in env injection rather than copying files.
- Use `--abort-on-container-exit --exit-code-from playwright` for test containers so CI gets test exit code.
- Prefer `--force-with-lease` for any forced pushes when rewriting history.

Next steps I can take for you (I will modify repository files if you approve)
- Create `envs/.env.stage`, `envs/.env.uat`, `envs/.env.prod` files with example values.
- Add `scripts/switch-env.js` (Node) in `scripts/` that copies the selected env file to `.env`.
- Add the npm scripts in [`package.json`](package.json:1) for switching & docker-compose runs.
- Update `docker-compose.yml` (optionally) to include `env_file: .env` so `docker-compose up` picks `.env` automatically.

If you want me to modify the repo now, tell me which of the next steps to run and I will apply them one at a time.