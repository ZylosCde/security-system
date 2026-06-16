DC := docker compose -f docker-compose.yml

.PHONY: help build up up-detach down down-volumes logs app-logs db-logs app-shell db-shell migrate migrate-dev seed restart clean

help:
	@echo "Docker helpers for Catalyst development"
	@echo "Usage: make <target>"
	@echo ""
	@echo "Targets:"
	@echo "  build         - Build all Docker images"
	@echo "  up            - Start all services (foreground, with logs)"
	@echo "  up-detach     - Start all services (detached)"
	@echo "  down          - Stop and remove containers"
	@echo "  down-volumes  - Stop and remove containers + volumes"
	@echo "  restart       - Restart all services"
	@echo "  logs          - Tail logs from all services"
	@echo "  app-logs      - Tail Next.js app logs"
	@echo "  db-logs       - Tail PostgreSQL logs"
	@echo "  app-shell     - Open shell in app container"
	@echo "  db-shell      - Open shell in database container"
	@echo "  migrate       - Apply Prisma migrations in app container"
	@echo "  migrate-dev   - Create/apply a Prisma dev migration (set NAME=your_migration)"
	@echo "  seed          - Seed database in app container"
	@echo "  clean         - Remove all containers, volumes, and images"
	@echo "  ps            - Show running containers"

build:
	@echo "Building Docker images..."
	$(DC) build --no-cache

up:
	@echo "Starting all services..."
	$(DC) up --build --remove-orphans

up-detach:
	@echo "Starting all services (detached)..."
	$(DC) up -d --build --remove-orphans
	@echo "Services started. Use 'make logs' to view logs"

down:
	@echo "Stopping services..."
	$(DC) down

down-volumes:
	@echo "Stopping services and removing volumes..."
	$(DC) down -v

restart:
	@echo "Restarting services..."
	$(DC) restart

logs:
	@echo "Tailing logs from all services (Ctrl+C to exit)..."
	$(DC) logs -f

app-logs:
	@echo "Tailing Next.js app logs..."
	$(DC) logs -f web

db-logs:
	@echo "Tailing MySQL logs..."
	$(DC) logs -f database

shell:
	@echo "Opening shell in app container..."
	$(DC) exec web sh

app-shell:
	@echo "Opening shell in app container..."
	$(DC) exec web sh

db-shell:
	@echo "Opening MySQL shell..."
	$(DC) exec database mysql -u$${MYSQL_USER:-app_user} -p$${MYSQL_PASSWORD:-app_password} $${MYSQL_DATABASE:-app_db}

migrate:
	@echo "Applying Prisma migrations..."
	$(DC) exec web npx prisma migrate deploy

migrate-dev:
	@echo "Running Prisma migrate dev..."
	$(DC) exec web npx prisma migrate dev --name $${NAME:-dev_changes} --schema /app/prisma/schema.prisma

seed:
	@echo "Seeding database..."
	$(DC) exec web npm run db:seed

clean:
	@echo "Removing all containers, volumes, and images..."
	$(DC) down -v
	$(DC) system prune -f

ps:
	$(DC) ps
	$(DC) logs -f frontend

backend-logs:
	@echo "Tail backend logs"
	$(DC) logs -f backend

frontend-shell:
	@echo "Open a shell in the frontend service"
	$(DC) exec frontend sh

backend-shell:
	@echo "Open a shell in the backend service"
	$(DC) exec backend sh

network-prune:
	@echo "Clean up unused networks"
	docker network prune -f