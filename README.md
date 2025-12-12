## Staff Management API - HR Internal System

Complete NestJS backend for HR internal management system with PostgreSQL persistence, JWT authentication, role-based access control, and comprehensive API documentation.

### What's included

#### Authentication & Authorization
- **Authentication** – signup/signin flows backed by bcrypt-hashed passwords and short-lived JWT access tokens.
- **Role-based Access Control** – Admin and Staff roles with protected endpoints.
- **Password Reset** – Admin can reset user passwords.

#### User Management (Admin)
- CRUD operations for staff members
- Activate/Deactivate users
- Update salary, position, and leave days
- View leave balance

#### Registration Period Management (Admin)
- Create registration periods (weekly/monthly)
- Configure registration deadlines
- View registration status (registered/not registered)
- Lock/Close registration periods

#### Work Schedule (User)
- Register work schedule (WFO/Remote/Off) for each period
- View personal schedule in calendar format
- Update schedule within deadline

#### Leave Requests (User/Admin)
- Submit leave requests: Annual leave, Sick leave, Late arrival, Early departure, Overtime, Business trip, Remote work, Compensatory leave, Unpaid leave
- Upload attachments as evidence
- Track request status
- Admin: Approve/Reject requests with notes
- Automatic notification on status change

#### Salary Management (Admin)
- Create monthly salary records
- Configure: Base salary, Allowance, Bonus, OT pay, Deductions, Penalties, Insurance, Tax
- Track work days, leave days, overtime hours
- Finalize and mark as paid
- Export to Excel

#### Regulations (Admin/User)
- Manage company regulations
- Categorize regulations
- Activate/Deactivate regulations
- Users can view active regulations

#### Notifications
- System notifications
- Leave request status notifications
- Salary notifications
- Schedule reminders
- Broadcast to all users

#### Dashboard & Statistics
- **Admin Dashboard**: Total employees, pending requests, approved/rejected this month, late arrivals, OT hours, total salary
- **Monthly Statistics**: Charts for late arrivals, OT, leaves, remote by month
- **User Statistics**: Work days, remote days, leaves, late arrivals, OT by period
- Request history with pagination

#### File Management
- Upload single/multiple files
- Support: Images (JPEG, PNG, GIF, WebP), PDF, Word, Excel
- Max file size: 10MB
- Download/Delete files

### API Endpoints Summary

| Module | Endpoints | Access |
| --- | --- | --- |
| Auth | `/auth/signup`, `/auth/signin` | Public |
| Users | `/users/*` | Admin (CRUD), User (profile) |
| Registration Periods | `/registration-periods/*` | Admin |
| Work Schedules | `/work-schedules/*` | Admin/User |
| Leave Requests | `/leave-requests/*` | Admin/User |
| Salaries | `/salaries/*` | Admin (CRUD), User (view) |
| Regulations | `/regulations/*` | Admin (CRUD), User (view) |
| Notifications | `/notifications/*` | Admin/User |
| Dashboard | `/dashboard/*` | Admin/User |
| Files | `/files/*` | All authenticated |

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
