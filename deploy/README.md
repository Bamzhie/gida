# Gida backend on Oracle Cloud

This Compose stack runs the Spring API, PostgreSQL 17 with PostGIS, and Caddy on the Ubuntu ARM64 VM. PostgreSQL and the API are private to the Docker network. Caddy is the only service that publishes internet-facing ports (80 and 443).

## Before starting

- The VM has Docker Engine and Docker Compose v2 installed.
- The attached block volume is mounted at `/srv/gida-data` after boot, with `/srv/gida-data/postgres` and `/srv/gida-data/media` created.
- OCI ingress allows TCP 22 from your own IP and TCP 80/443 from the internet. The VM public IP is assigned.
- Create an `A` record for the chosen `API_DOMAIN` pointing to the VM public IP before starting Caddy. The example uses `api.gida.tnlbeauty.com`.
- The frontend's production `API_BASE_URL` must later be set to `https://<API_DOMAIN>`, and its origin must be included in `CORS_ALLOWED_ORIGINS`.

## Prepare the VM directories

The official PostgreSQL image runs its database process as UID 999. The API container runs as UID 10001. On the VM, set ownership for the bind-mounted directories:

```sh
sudo mkdir -p /srv/gida-data/postgres /srv/gida-data/media
sudo chown -R 999:999 /srv/gida-data/postgres
sudo chown -R 10001:10001 /srv/gida-data/media
```

Keep `/srv/gida-data` mounted from the block volume through `/etc/fstab` so the data remains available after reboot.

## Get the deployment files

From the repository root on the VM, use your configured GitHub clone URL:

```sh
git clone <repository-url> gida
cd gida
```

For an existing checkout, use `git pull` in that checkout instead. Then create the production environment file:

```sh
cp deploy/.env.example deploy/.env
chmod 600 deploy/.env
```

Edit `deploy/.env` and fill in the blank database password and JWT secret, then confirm the API hostname and CORS origin. Generate secrets on the VM with:

```sh
openssl rand -hex 32
```

Use that output for `DB_PASSWORD`, and generate the JWT secret separately:

```sh
openssl rand -base64 48
```

Paste the command's output into `JWT_SECRET` in the file. Do not put real secrets in `.env.example`, Git, shell command history, or support messages. The repository ignores `deploy/.env`.

`CORS_ALLOWED_ORIGINS` should contain the exact production frontend origin, including `https://` and no trailing slash. For multiple origins, separate them with commas.

## Start the stack

Run these commands from the repository root on the VM:

```sh
sudo docker compose --env-file deploy/.env -f deploy/compose.yaml config --quiet
sudo docker compose --env-file deploy/.env -f deploy/compose.yaml up -d --build
sudo docker compose --env-file deploy/.env -f deploy/compose.yaml ps
sudo docker compose --env-file deploy/.env -f deploy/compose.yaml logs -f api caddy
```

The first build downloads the ARM64 Java build/runtime and PostgreSQL packages, then packages the API and PostGIS image. Flyway runs the existing database migrations when the API starts. Caddy obtains and renews HTTPS certificates after DNS resolves to the VM and ports 80/443 are reachable.

## Updating and stopping

After deploying a code change to the repository:

```sh
git pull
sudo docker compose --env-file deploy/.env -f deploy/compose.yaml up -d --build
```

To stop the services without deleting persistent data:

```sh
sudo docker compose --env-file deploy/.env -f deploy/compose.yaml down
```

Do not use `down --volumes` for routine maintenance. The database and uploaded media live on the attached block volume; Caddy's certificate state lives in named Docker volumes. Set up and verify separate backups before treating this as production-ready.
