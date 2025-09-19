# Zoom Clone - Authentication System

A React-based Zoom-like application with authentication and user management features.

## Features

- **Authentication System**
  - Login form with email and password
  - Signup form with name, email, and password
  - Form validation with error messages
  - Loading states during API calls
  - JWT token management with localStorage

- **Route Protection**
  - Protected routes (dashboard) - requires authentication
  - Public routes (login/signup) - redirects to dashboard if already authenticated
  - Automatic token validation on app load

- **UI/UX**
  - Responsive design with Tailwind CSS
  - Centered, modern form layouts
  - Error handling and user feedback
  - Loading spinners and disabled states

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **State Management**: React Context API

## Project Structure

```
src/
├── components/
│   ├── LoginForm.tsx          # Login form component
│   ├── SignupForm.tsx         # Signup form component
│   ├── ProtectedRoute.tsx     # Route protection wrapper
│   └── PublicRoute.tsx        # Public route wrapper
├── contexts/
│   └── AuthContext.tsx        # Authentication context provider
├── pages/
│   ├── Auth.tsx               # Auth page (login/signup)
│   └── Dashboard.tsx          # Protected dashboard page
├── services/
│   └── api.ts                 # API service with axios configuration
├── types/
│   └── auth.ts                # TypeScript type definitions
└── App.tsx                    # Main app component with routing
```

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   ```

3. **Start Development Server**
   ```bash
   npm start
   ```

4. **Backend Integration**
   The app expects a Node.js/Express backend with the following endpoints:
   - `POST /api/auth/login` - User login
   - `POST /api/auth/signup` - User registration

   Expected request/response format:
   ```typescript
   // Login/Signup Request
   {
     "email": "user@example.com",
     "password": "password123"
   }
   
   // Signup Request (additional field)
   {
     "name": "John Doe",
     "email": "user@example.com", 
     "password": "password123"
   }
   
   // Response
   {
     "token": "jwt_token_here",
     "user": {
       "id": "user_id",
       "name": "John Doe",
       "email": "user@example.com"
     }
   }
   ```

## Usage

1. **Access the Application**
   - Navigate to `http://localhost:3000`
   - You'll be redirected to `/login` if not authenticated

2. **User Registration**
   - Click "create a new account" on login page
   - Fill in name, email, and password
   - Form validates required fields and password length

3. **User Login**
   - Enter email and password
   - Successful login redirects to dashboard

4. **Dashboard**
   - Protected route accessible only when authenticated
   - Shows welcome message and user name
   - Logout functionality available

## Form Validation

- **Required Fields**: All form fields are required
- **Email Validation**: Proper email format validation
- **Password Length**: Minimum 6 characters for signup
- **Name Length**: Minimum 2 characters for signup
- **Real-time Validation**: Errors clear as user types

## Security Features

- JWT tokens stored in localStorage
- Automatic token validation on app load
- Request interceptor adds Authorization header
- Response interceptor handles 401 errors (token expiration)
- Automatic logout and redirect on token expiration

## Development Notes

- All components are TypeScript with proper type definitions
- Responsive design works on mobile and desktop
- Error handling includes both client-side validation and API errors
- Loading states provide good user feedback
- Clean separation of concerns with services and contexts