## Staff Management API

Feature-complete NestJS backend used to manage internal staff records with PostgreSQL persistence, JWT authentication, and first-class API documentation.

### What’s included

- **Authentication** – signup/signin flows backed by bcrypt-hashed passwords and short-lived JWT access tokens.
- **User management** – CRUD endpoints for staff members (name, email, position, role) protected by the auth guard.
- **PostgreSQL via TypeORM** – auto-loaded entities with sensible defaults for local development.
- **Swagger UI** – live, secured documentation served at `/docs` with the ability to authorize using Bearer tokens.
- **Best-practice bootstrapping** – validation pipe, class-serializer, global route prefix, and configurable environment validation.

### Prerequisites

- Node.js ≥ 20
- PostgreSQL ≥ 14 (local instance or container)

### Environment

Copy `.env` and adapt values as needed:

```bash
cp .env .env.local # edit if you want a separate file
```

Key variables:

| Variable | Description |
| --- | --- |
| `PORT` | HTTP port (defaults to 3000) |
| `DATABASE_*` | Postgres connection settings |
| `JWT_ACCESS_SECRET` | Secret used to sign access tokens |
| `JWT_ACCESS_TTL` | Access token TTL (seconds) |
| `BCRYPT_SALT_ROUNDS` | Salt rounds for bcrypt hashing |

Example Docker command for Postgres:

```bash
docker run --name staff-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=app_internal -p 5432:5432 -d postgres:16
```

### Install & run

```bash
npm install

# development watch mode
npm run start:dev

# production build & run
npm run build
npm run start:prod
```

The API is served under `http://localhost:3000/api`. Swagger UI lives at `http://localhost:3000/docs`.

### Auth workflow

1. `POST /auth/signup` – create a staff account; responds with `{ accessToken, user }`.
2. `POST /auth/signin` – exchange credentials for a JWT token.
3. Supply the token in `Authorization: Bearer <token>` to call protected routes such as:
   - `GET /users`
   - `POST /users`
   - `GET /auth/me`

### Testing

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e
```

### Project structure

```
src
├── config             # env validation & shared configuration
├── modules
│   ├── auth           # DTOs, controller, service, JWT strategy/guard
│   └── user           # User entity, DTOs, controller & service
└── main.ts            # Global pipes, Swagger, bootstrap
```

### Next steps

- Replace `synchronize: true` with migrations before production.
- Add refresh tokens or session revocation if long-lived sessions are needed.
- Harden secrets management (Vault, AWS Parameter Store, etc.).

Happy shipping! 🚀
