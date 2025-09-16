

# GlobalBooks: A Service-Oriented Architecture Implementation

This repository contains the source code for a university project demonstrating the migration of a legacy monolithic application to a modern, distributed Service-Oriented Architecture (SOA) using microservices. The project fulfills the requirements for the CCS3341 SOA & Microservices module.

## Project Overview

The GlobalBooks application simulates a global e-commerce platform for books. The original monolithic system suffered from poor scalability and high-risk deployments. This project decomposes that monolith into four independent, single-purpose microservices that communicate both synchronously via APIs and asynchronously via a message broker.

The architecture is designed to be resilient, scalable, and loosely coupled, demonstrating key SOA principles.

## Core Concepts Demonstrated

*   **Service-Oriented Architecture (SOA):** Decomposing a system into distinct, reusable services.
*   **Microservice Principles:** Each service is autonomous, independently deployable, and owns its own data (in-memory for this project).
*   **Hybrid Communication Models:**
    *   **Synchronous:** Using REST and SOAP APIs for real-time client interactions that require immediate responses.
    *   **Asynchronous:** Using a RabbitMQ message broker for background tasks (payment, shipping) to decouple services and improve resilience.
*   **API Diversity:** Implementation of both modern **REST** APIs (with JSON) and legacy-compatible **SOAP** web services (with XML/WSDL).
*   **Containerization:** Using **Docker** to easily run and manage infrastructure components like RabbitMQ.

## Architecture Diagram

The following diagram illustrates the complete, event-driven workflow of the system.

![RabbitMQ Architecture Diagram](path/to/your/rabbitmq_diagram.png)
_**(Note: You must upload the diagram image to your repo and change the path here!)**_

---

## Services Overview

| Service | Protocol / Type | Technology | Key Responsibilities |
| :--- | :--- | :--- | :--- |
| **`CatalogService`** | SOAP API | Java, Spring Boot | Manages book inventory; provides `getBook` and `searchBooks` endpoints. |
| **`OrdersService`** | REST API | Node.js, Express | Manages the order lifecycle (`POST`, `GET`, `PATCH`); acts as the main Producer for RabbitMQ. |
| **`PaymentsService`** | Asynchronous Worker | Node.js | Consumes `order.created` messages from a dedicated queue to process payments. |
| **`ShippingService`** | Asynchronous Worker | Node.js | Consumes `order.paid` messages from a dedicated queue to arrange shipping. |

---

## Technology Stack

*   **Backend:** Java 17, Spring Boot, Node.js, Express.js
*   **Messaging:** RabbitMQ 3-Management
*   **Build Tools:** Apache Maven, npm
*   **Containerization:** Docker Desktop
*   **API Testing:** Postman (for REST), SoapUI (for SOAP)

---

## Getting Started: Setup and Running

Follow these steps to run the entire distributed system on your local machine.

### Prerequisites

Ensure you have the following software installed:
*   [Node.js](https://nodejs.org/) (LTS version recommended)
*   [Java Development Kit (JDK)](https://adoptium.net/) (Version 17+)
*   [Apache Maven](https://maven.apache.org/download.cgi)
*   [Docker Desktop](https://www.docker.com/products/docker-desktop/)
*   [Postman](https://www.postman.com/downloads/)
*   [SoapUI](https://www.soapui.org/downloads/soapui/)

### Running the Application

**1. Clone the Repository**
```bash
git clone [your-repository-url]
cd [your-repository-folder]
```

**2. Start RabbitMQ via Docker**
Make sure Docker Desktop is running. Then, open a terminal and run:
```bash
# This command will download and start the RabbitMQ container in the background
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```
> You can access the RabbitMQ dashboard at `http://localhost:15672` (user: `guest`, pass: `guest`).

**3. Install Dependencies**
You will need to run `npm install` in each of the three Node.js service directories.
```bash
cd orders-service && npm install && cd ..
cd payments-service && npm install && cd ..
cd shipping-service && npm install && cd ..
```

**4. Run All Four Services**
You will need **four separate terminals** to run all the services simultaneously.

*   **Terminal 1: Start the `CatalogService` (Java SOAP)**
    ```bash
    cd catalog-service
    mvn spring-boot:run
    ```

*   **Terminal 2: Start the `OrdersService` (Node.js REST)**
    ```bash
    cd orders-service
    npm start
    ```

*   **Terminal 3: Start the `PaymentsService` (Node.js Worker)**
    ```bash
    cd payments-service
    npm start
    ```

*   **Terminal 4: Start the `ShippingService` (Node.js Worker)**
    ```bash
    cd shipping-service
    npm start
    ```

At this point, the entire system is live and running on your local machine.

---

## Testing the System (Usage)

### 1. Test the `CatalogService` (SOAP)

*   **Tool:** SoapUI
*   **Action:** Create a new SOAP project with the WSDL URL: `http://localhost:8080/ws/catalog.wsdl`
*   **Request:** Send a `GetBookRequest` with the following body:
    ```xml
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:cat="http://globalbooks.com/catalog">
       <soapenv:Header/>
       <soapenv:Body>
          <cat:GetBookRequest>
             <cat:isbn>978-0134685991</cat:isbn>
          </cat:GetBookRequest>
       </soapenv:Body>
    </soapenv:Envelope>
    ```
*   **Expected Result:** A SOAP response containing the details for the "Effective Java" book.

### 2. Test the Full Order Lifecycle

*   **Tool:** Postman

**Step A: Create a New Order**
*   **Method:** `POST`
*   **URL:** `http://localhost:3000/orders`
*   **Body (raw, JSON):**
    ```json
    {
      "customerId": "CUST001",
      "items": [{"isbn": "978-0134685991", "quantity": 1, "price": 45.99}],
      "shippingAddress": {"street": "123 Main St", "city": "Boston", "country": "USA", "zipCode": "02101"}
    }
    ```
*   **Result:** You will get a `201 Created` response. **Copy the `id`** from the response body. Check the `PaymentsService` terminal to see the "Processing payment" log.

**Step B: Mark the Order as Paid**
*   **Method:** `PATCH`
*   **URL:** `http://localhost:3000/orders/[COPIED_ORDER_ID]/status`
*   **Body (raw, JSON):**
    ```json
    { "status": "PAID" }
    ```
*   **Result:** You will get a `200 OK` response. Check the `OrdersService` terminal to see the "Published 'order.paid' event" log, and check the `ShippingService` terminal to see the "Processing shipping" log.

