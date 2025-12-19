# TicketHub 

TicketHub is a high-performance, real-time seat booking system. It demonstrates how to handle race conditions in a distributed environment using Redis locks and provides an instant UI experience via WebSockets.

## Features

* **Distributed Locking**: Uses Redisson to ensure a seat can never be double-booked, even across multiple server instances.
* **Real-Time Sync**: All users see seat updates instantly thanks to WebSocket (STOMP) integration.
* **Containerized Services**: One-command setup for Database (PostgreSQL) and Cache (Redis) using Docker Compose.
* **Modern Tech Stack**: Built with Java 21, Spring Boot 3.4, and React 19.

## Tech Stack

**Backend:**
* Java 21 & Spring Boot 3.4
* Spring Data JPA (PostgreSQL)
* Redis & Redisson (Distributed Locking)
* Spring WebSocket & STOMP

**Frontend:**
* React 19 (Vite)
* Axios (API Requests)
* SockJS & StompJS (WebSockets)
