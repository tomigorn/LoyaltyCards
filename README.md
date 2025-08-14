# Loyalty Cards Management API

A **loyalty cards management system**, developed entirely by me, designed with a clean, scalable architecture. This project demonstrates modern **.NET 8** development practices, **layered architecture**, and secure handling of sensitive user data. For me it's a learning experience and a showcase/portfolio project.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Security](#security)

---

## Project Overview

This project is a loyalty cards application. Users can register, log in, and manage their loyalty cards. While the frontend is not yet implemented, the backend is designed to be platform independent.

---

## Architecture

The project uses **Onion / Layered Architecture** for clear separation of concerns:

- **API**: Handles HTTP requests, routing, and serialization. Provides OpenAPI 3.0 (Swagger) documentation.  
- **Application**: Contains business logic and services for use cases like user registration, login, and card management.  
- **Domain**: Defines the core entities, value objects, and interfaces. This layer is independent and framework-agnostic.
- **Infrastructure**: Manages database access, SQLite storage, and external dependencies.

This architecture makes the project **maintainable, testable, and scalable**.

---

## Tech Stack

- **.NET 8** (C#)  
- **SQLite** for lightweight, file-based data storage  
- **Entity Framework Core** for ORM / database access
- **ASP.NET Core Web API**  
- **OpenAPI 3.0 / Swagger UI** for interactive API documentation  
- **Argon2id** for secure password hashing  
- **Cross-platform development** with VS Code on Ubuntu and Visual Studio on Windows  
- **GitHub** for source control

---

## Security

- **Passwords** are hashed using **Argon2id**, a modern, secure password hashing algorithm.  
- Sensitive information is never stored in plain text.  
- Database and API endpoints are designed with security best practices in mind.

---