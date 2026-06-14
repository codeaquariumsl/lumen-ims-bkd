# Optical Company Management Information System (OPTICAL MIS) - Backend

This is the production-ready Node.js/Express.js backend for the Multi-Branch Optical Company MIS System, configured with MySQL and utilizing standard security best practices.

## Technology Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL (via `mysql2/promise` connection pool)
- **Security**: Helmet, CORS, password hashing with `bcryptjs`, and input validations with `express-validator`
- **Authentication**: JWT (JSON Web Tokens)
- **Logging**: Morgan
- **File Uploads**: Multer

---

## Folder Structure
```
optical-mis-bkd/
├── src/
│   ├── config/
│   │   ├── database.js     # MySQL Connection Pool
│   │   └── multer.js       # File Upload Engine
│   │
│   ├── controllers/        # Express request-response handlers
│   ├── services/           # Business logic layer
│   ├── repositories/       # Raw MySQL database query execution
│   ├── routes/             # API endpoint routing
│   ├── middlewares/        # Authentication, Validation, and Global Error handlers
│   ├── validations/        # express-validator check schemas
│   ├── utils/              # Token, response formats, and seeder helpers
│   ├── uploads/            # Multipart image file destination
│   │
│   ├── app.js              # Application middleware configurations
│   └── server.js           # Server startup script
│
├── .env                    # Secret keys and configuration
├── db-schema.sql           # MySQL raw tables declaration
├── package.json
└── README.md
```

---

## Getting Started

### 1. Configure the Environment
Create or edit the `.env` file in the root directory:
```env
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=optical_mis
JWT_SECRET=super_secret_optical_mis_jwt_key_123456
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

### 2. Install Dependencies
Run the install command inside the backend folder:
```bash
npm install
```

### 3. Initialize & Seed Database
Run the seeder script. This script connects to your MySQL server, initializes the `optical_mis` database, constructs the tables, and populates mock data:
```bash
npm run seed
```

### 4. Run Development Server
Start the Express server using Nodemon:
```bash
npm run dev
```
The server will start listening on port `5000` and output:
`Server is running on port 5000 in development mode.`
`MySQL Database connection established successfully.`

---

## API Endpoints List

### Authentication & Branches
- `POST /api/auth/register` - Register new system user
- `POST /api/auth/login` - Authenticate user, returns JWT token + user profile
- `GET /api/auth/me` - Get active logged-in user profile (requires Bearer JWT)
- `POST /api/auth/logout` - Terminates session
- `GET /api/branches` - List active branch locations

### Customers
- `GET /api/customers` - Paginated list of customers (supports `?search=`, `?customerType=`, `?page=`, `?limit=`)
- `GET /api/customers/:id` - Retrieve single customer details
- `POST /api/customers` - Create customer record
- `PUT /api/customers/:id` - Update customer record
- `DELETE /api/customers/:id` - Remove customer record

### Products & Stock Levels
- `GET /api/products` - List active products (supports `?search=`, `?category=`, `?page=`)
- `GET /api/products/inventory` - Fetch detailed inventory levels (supports warning checks)
- `GET /api/products/:id` - Get specific product details
- `POST /api/products` - Register new product (initializes stock = 0)
- `PUT /api/products/:id` - Edit product details
- `DELETE /api/products/:id` - Deactivate product (soft-delete)
- `PUT /api/products/:id/stock` - Set stock quantity, batch, serial, and expiry dates

### Sales & Point of Sale (POS)
- `POST /api/sales/checkout` - Processes cart checkout transaction (decrements inventory, increments customer spending in one database transaction)
- `GET /api/sales` - View sales receipt transactions list
- `GET /api/sales/:id` - Fetch invoice line items details

### Optical Prescriptions
- `GET /api/prescriptions` - List customer optical prescriptions
- `GET /api/prescriptions/:id` - Retrieve prescription details
- `POST /api/prescriptions` - Save new prescription (Sphere, Cylinder, Axis, PD metrics)
- `DELETE /api/prescriptions/:id` - Delete prescription

### Lab Orders
- `GET /api/lab-orders` - List lens manufacturing orders (supports `?status=`, `?search=`)
- `GET /api/lab-orders/:id` - Get specific lab order details
- `POST /api/lab-orders` - Add lab manufacturing order
- `PUT /api/lab-orders/:id` - Modify order parameters
- `PUT /api/lab-orders/:id/status` - Transition order state (`Pending` → `In Process` → `Completed` → `Delivered`)
- `DELETE /api/lab-orders/:id` - Remove lab order

### Analytics & Charts
- `GET /api/analytics/dashboard` - Get KPI cards summaries (revenue, total count, active counts)
- `GET /api/analytics/charts` - Fetch category performance, customer segmentation, and 30-day sales charts
