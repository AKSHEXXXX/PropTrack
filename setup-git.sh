#!/bin/bash
set -e
echo "==> Cleaning lock..."
rm -f .git/index.lock

echo "==> Staging files..."
git add .gitignore
git add *.md
git add backend/.gitignore backend/.env.example backend/docker-compose.yml
git add backend/package.json backend/tsconfig.json backend/tsconfig.build.json
git add backend/nest-cli.json backend/.prettierrc backend/eslint.config.mjs
git add backend/src/
git add backend/test/ 2>/dev/null || true

echo "==> Committing..."
git commit -m "feat: initial PropTrack CRM backend

- NestJS v10 + TypeORM + PostgreSQL
- Auth module with JWT (bcrypt, 7d expiry)
- 10 feature modules: agencies, agents, clients, properties,
  leads, appointments, deals, contracts, payments, tags
- Dashboard module with 5 complex query endpoints
- SQL: 3 triggers, 2 stored procedures, 2 functions
- SQL: 3 nested queries + 2 correlated queries
- Seed data: 1 agency, 3 agents, 10 clients, 15 properties, 20 leads
- Swagger docs at /api/docs
- Docker Compose for local dev"

echo ""
echo "==> Done! Now run:"
echo "    gh repo create PropTrack --public --source=. --push"
echo "    OR:"
echo "    git remote add origin https://github.com/YOUR_USERNAME/PropTrack.git"
echo "    git push -u origin main"
