# Order Service System Design

## 1. Checkout & Order Flow

### Why decouple Price Calculation from Order Creation?
- **Security:** Never trust frontend prices. The backend must independently calculate totals.
- **Clean DB:** Prevents cluttering the database with abandoned, unpaid, or invalid orders.
- **Payment Gateways:** Processors (like Stripe) require a pre-calculated amount to generate a "Payment Intent" before collecting card details.

### Flow Diagram

```mermaid
sequenceDiagram
    participant Client
    participant OrderService
    participant PaymentGateway
    
    Client->>OrderService: 1. Send Cart (Calculate Total)
    OrderService->>OrderService: 2. Calculate true price (Taxes, Discounts)
    OrderService->>PaymentGateway: 3. Create Payment Intent
    PaymentGateway-->>OrderService: 4. Return Intent ID (e.g., client_secret)
    OrderService-->>Client: 5. Return Intent ID
    
    Client->>PaymentGateway: 6. Submit Card Details securely
    PaymentGateway-->>Client: 7. Payment Success
    
    PaymentGateway->>OrderService: 8. Webhook: Payment Confirmed
    OrderService->>OrderService: 9. CREATE ORDER in Database
```
