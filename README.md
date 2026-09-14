# 🏫 Jamia Arabia Lilbanat — Admin Management System

A full-stack web-based administration panel for **Jamia Arabia Lilbanat Madrasa**, built with Node.js and MongoDB. It provides a secure, single-admin dashboard to manage students, teachers, fees, exams, results, and the school calendar.

---

## ✨ Features

| Module | Capabilities |
|---|---|
| 🔐 **Authentication** | JWT-based login, password change, 24-hour session tokens |
| 🧑‍🎓 **Students** | Add, view, update, and delete student records |
| 👩‍🏫 **Teachers** | Manage teacher profiles and information |
| 💰 **Fees** | Track fee payments and generate reports |
| 📝 **Exams** | Manage date sheets and upload result files |
| 📅 **Calendar** | Upload and manage the academic calendar |
| ⚙️ **Settings** | Admin account and system configuration |

---

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose)
- **Authentication**: JWT (`jsonwebtoken`) + bcrypt password hashing
- **File Uploads**: Multer
- **Frontend**: Vanilla HTML / CSS / JavaScript (served as static files)
- **Deployment**: Render.com

---

## 📁 Project Structure

```
School-System/
├── config/
│   └── db.js               # MongoDB connection
├── middleware/
│   ├── auth.js             # JWT authentication middleware
│   └── security.js         # Security headers, rate limiting, NoSQL sanitizer
├── models/
│   ├── Admin.js
│   ├── Student.js
│   ├── Teacher.js
│   ├── Fee.js
│   ├── DateSheet.js
│   ├── Result.js
│   └── Calendar.js
├── routes/
│   ├── auth.js
│   ├── students.js
│   ├── teachers.js
│   ├── fees.js
│   ├── exams.js
│   ├── calendar.js
│   └── settings.js
├── public/                 # Frontend static files
│   ├── index.html
│   ├── css/
│   └── js/
├── uploads/                # Uploaded files (results, calendar)
│   ├── results/
│   └── calendar/
├── server.js               # Application entry point
├── render.yaml             # Render.com deployment config
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v16+
- A [MongoDB](https://www.mongodb.com/) instance (Atlas or local)





### Running the Server

```bash
# Development
npm run dev

# Production
npm start
```

The app will be available at `http://localhost:3000`.




## 📡 API Endpoints

All API routes are prefixed with `/api` and require a `Bearer <token>` Authorization header, except for the login endpoint.

### Auth — `/api/auth`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/login` | ❌ | Login and receive a JWT |
| `POST` | `/change-password` | ✅ | Change admin password |

### Students — `/api/students`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | ✅ | Get all students |
| `POST` | `/` | ✅ | Add a new student |
| `PUT` | `/:id` | ✅ | Update a student |
| `DELETE` | `/:id` | ✅ | Delete a student |

### Teachers — `/api/teachers`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | ✅ | Get all teachers |
| `POST` | `/` | ✅ | Add a new teacher |
| `DELETE` | `/:id` | ✅ | Delete a teacher |

### Fees — `/api/fees`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | ✅ | Get all fee records |
| `POST` | `/` | ✅ | Add a fee record |
| `PUT` | `/:id` | ✅ | Update a fee record |
| `DELETE` | `/:id` | ✅ | Delete a fee record |

### Exams — `/api/exams`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/datesheet` | ✅ | Get date sheets |
| `POST` | `/datesheet` | ✅ | Upload a date sheet |
| `POST` | `/results` | ✅ | Upload result files |
| `DELETE` | `/:id` | ✅ | Delete an exam record |

### Calendar — `/api/calendar`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | ✅ | Get calendar entries |
| `POST` | `/` | ✅ | Upload calendar file |
| `DELETE` | `/:id` | ✅ | Delete a calendar entry |

---

## 🔒 Security

This project implements several security best practices out of the box:

- **OWASP HTTP Security Headers** — `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Content-Security-Policy`, `Referrer-Policy`
- **NoSQL Injection Prevention** — All incoming `req.body`, `req.query`, and `req.params` are sanitized to strip MongoDB operators (`$`, `.`)
- **Rate Limiting** (in-memory, zero dependencies):
  - Auth endpoints: **10 requests / 15 minutes** per IP (brute-force protection)
  - All API endpoints: **400 requests / 15 minutes** per IP
- **JWT Authentication** — All protected routes require a valid, non-expired token
- **Password Hashing** — bcrypt with salt rounds
- **Payload Size Limit** — JSON/URL bodies capped at **1 MB** to prevent DoS
- **Tech Stack Concealment** — `X-Powered-By` header disabled

---

## ☁️ Deployment (Render.com)

The project includes a `render.yaml` for one-click deployment on [Render](https://render.com):

```yaml
services:
  - type: web
    name: college-manage-system
    env: node
    plan: free
    buildCommand: npm install
    startCommand: node server.js
    envVars:
      - key: MONGO_URI
        sync: false
      - key: JWT_SECRET
        generateValue: true
```

1. Push the repository to GitHub.
2. Connect your GitHub repo on [Render.com](https://render.com).
3. Set the `MONGO_URI` environment variable in the Render dashboard.
4. Deploy — `JWT_SECRET` is auto-generated by Render.

---

## 📄 License

This project is intended for private institutional use by **Jamia Arabia Lilbanat Madrasa**.
