import { makeUpdateItemSyntax } from "./utils";

export const createOrderTable = () =>
  `CREATE TABLE IF NOT EXISTS orders (order_id INTEGER PRIMARY KEY AUTOINCREMENT, customer_email_address TEXT, date_order_placed TEXT, order_status TEXT);`;

export const insertOrder = (customerEmailAddress: string, dateOrderPlaced: string, orderStatus: string) =>
  `INSERT INTO orders (customer_email_address, date_order_placed, order_status) VALUES ("${customerEmailAddress}", "${dateOrderPlaced}", "${orderStatus}");`;

export const selectOrders = (): string =>
  `SELECT orders.*, orders_detail.* FROM orders INNER JOIN orders_detail ON orders.order_id = orders_detail.order_id;`;

export const selectOrder = (id: Number): string =>
  `SELECT orders.*, orders_detail.* FROM orders INNER JOIN orders_detail ON orders.order_id = orders_detail.order_id WHERE orders.order_id = ${id};`;

export const selectOrderNewest = (): string => "SELECT MAX(order_id) as order_id FROM orders";

export const updateOrderItem = (
  id: Number,
  customerEmailAddress: string | null = null,
  dateOrderPlaced: string | null = null,
  orderStatus: string | null = null,
  productId: string | null = null,
  quantity: string | null = null
): string => {
  const items = makeUpdateItemSyntax([
    ["customer_email_address", customerEmailAddress],
    ["date_order_placed", dateOrderPlaced],
    ["order_status", orderStatus],
    ["product_id", productId],
    ["quantity", quantity]
  ]);

  return `UPDATE orders SET ${items} WHERE order_id = ${id};`;
};

export const deleteOrder = (id: Number): string => `DELETE FROM orders WHERE order_id = ${id};`;
