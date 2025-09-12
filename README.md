# Playwright TS Framework - Docker

This repository contains Playwright tests and a Docker setup to run them in containers.

Files added
- [`Dockerfile`](Dockerfile:1)
- [`docker-compose.yml`](docker-compose.yml:1)
- [`.dockerignore`](.dockerignore:1)

Prerequisites
- Docker (Engine) installed
- docker-compose (or use Docker CLI v20+ with compose support)

Build the image
```
docker build -t playwright-ts-framework .
```

Run tests in a container (headless, CI mode)
```
docker run --rm -e BASE_URL=https://www.flipkart.com -v "$(pwd)":/app playwright-ts-framework
```

Run using docker-compose (recommended for development)
```
docker-compose up --build
```
This runs the default service which executes `npm run test`.

Run a single command or headed mode via docker-compose
- Headed (display on host X11):
```
docker-compose run --service-ports playwright-debug
```
- Or run a specific npm script:
```
docker-compose run --service-ports playwright-debug npm run test:headed
```

Headed / GUI notes (Linux)
- The `playwright-debug` service mounts the host X11 socket: `/tmp/.X11-unix`.
- On the host permit connections: `xhost +local:root` (security tradeoff).
- Ensure your DISPLAY env is available when running docker-compose (usually inherited).

Headed / GUI notes (macOS / Windows)
- Native X11 forwarding is not supported out-of-the-box. Use one of:
  - Run tests headed locally instead of in Docker: `npm run test:headed`
  - Use a VNC-enabled container image and connect with a VNC client (not included by default).

Persisting artifacts (screenshots, videos, traces)
- Mount the `test-results` folder to the host to keep artifacts:
```
docker run --rm -e BASE_URL=https://www.flipkart.com -v "$(pwd)/test-results":/app/test-results playwright-ts-framework
```
- When using docker-compose, add a volume mapping for `./test-results:/app/test-results`.

CI usage example
- Build and run in CI without mounting volumes:
```
docker build -t ci-playwright .
docker run --rm -e CI=true -e BASE_URL=${BASE_URL} ci-playwright
```

Troubleshooting
- Browser crashes or "no usable sandbox": use the official Playwright image which includes deps.
- X11 display issues: verify `DISPLAY` and run `xhost +local:root`.
- Permissions: run `docker-compose run --user "$(id -u):$(id -g)" ...` if files are created with root.
- Increase shared memory if you see renderer crashes: `shm_size: 1gb` is already set in compose.

Security notes
- `xhost +local:root` relaxes X server access; prefer other debugging methods when possible.

Next steps / enhancements
- Add a VNC-enabled image for GUI debugging (can be added if needed).
- Add a CI job template (GitHub Actions / GitLab) that builds the image and archives test artifacts.

Useful commands recap
- Build image: `docker build -t playwright-ts-framework .`
- Run tests with compose: `docker-compose up --build`
- Run headed debug (Linux + X11): `docker-compose run --service-ports playwright-debug npm run test:headed`

If you want, I can also add a VNC-based debug image and an example GitHub Actions workflow.