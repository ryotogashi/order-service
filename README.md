# Order Service

## Overview

The company is building a service that allows customers to place orders via a REST API. We would like to be able to model the current inventory, deducting from inventory as orders are created, and adding inventory back if orders are canceled.

Inventory records should include the following attributes:

- Name
- Description
- Price
- Quantity available

Order records should include the following attributes:

- Customer email address
- Date order placed
- Order status

## Requirements

The service should include the following:

1. Support CRUD operations for inventory
2. Support CRUD operations for orders
   - When creating, updating, or canceling an order, inventory should be adjusted accordingly.
   - When a request to create an order is made, it will include a list of inventories to include in the order
   - If inventory levels are insufficient, a request to create an order should be denied.
3. Tests should be included for both the inventory and order endpoints
4. Authorization/authentication is NOT required for this service. It is safe to assume that all calls to the service should be processed
5. Database models should be created based on your assessment of what’s necessary for the service. At minimum, you’ll likely want a model for inventory and a model for orders; you may choose to include additional models as necessary.

## Expected request endpoints

1. Create inventory item
   - POST http://localhost:3000/inventories
2. Read all inventory items
   - GET http://localhost:3000/inventories
3. Read single inventory item
   - GET http://localhost:3000/inventories/1
4. Update inventory item
   - PUT http://localhost:3000/inventories/1
5. Delete inventory item
   - DELETE http://localhost:3000/inventories/1
6. Create order
   - POST http://localhost:3000/orders
7. Read all orders
   - GET http://localhost:3000/orders
8. Read single order
   - GET http://localhost:3000/orders/1
9. Update order
   - PUT http://localhost:3000/orders/1
10. Delete order
    - DELETE http://localhost:3000/orders/1
