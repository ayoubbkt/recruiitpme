# RecrutPME

Application moderne pour la gestion des recrutements

## Structure du projet

- `frontend/` : Application React + TypeScript avec Tailwind CSS
- `backend/` : API Node.js + Express avec PostgreSQL via Prisma

## Installation

### Prérequis

- Node.js 18+
- PostgreSQL
- npm ou yarn

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Configurez les variables d'environnement dans .env
npx prisma migrate dev
npm run dev