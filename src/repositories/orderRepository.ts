import { RunResult } from "sqlite3";

import dBSqlite3 from "../db/dbSqlite3";
import {
  q_insertOrderDetail,
  q_createOrderDetailTable,
  q_selectOrderDetail,
  q_updateOrderDetail,
  q_deleteOrderDetails
} from "../db/orderDetailQueries";
import {
  q_createOrderTable,
  q_selectOrders,
  q_selectOrder,
  q_selectOrderNewest,
  q_insertOrder,
  q_updateOrderItem,
  q_deleteOrder
} from "../db/orderQueries";
import {
  ORDERS,
  ORDERS_DETAIL,
  INVENTORIES,
  INVALID_INVENTORY_ID_ERROR,
  AVAILABLE_QUANTITY_ERROR,
  INVALID_ORDER_ID_ERROR
} from "../constants";
import InventoryTable from "./inventoryRepository";

class OrderTable {
  static createOrdersTable(): Promise<void> {
    const db = dBSqlite3();
    return new Promise((resolve, reject) =>
      db.run(q_createOrderTable(), (err: Error | null) => (err ? reject(err) : resolve()))
    );
  }

  static createOrderDetailTable(): Promise<void> {
    const db = dBSqlite3();
    return new Promise((resolve, reject) =>
      db.run(q_createOrderDetailTable(), (err: Error | null) => (err ? reject(err) : resolve()))
    );
  }

  static insertOrder(customerEmailAddress: string, dateOrderPlaced: string, orderStatus: string): Promise<void> {
    const db = dBSqlite3();
    return new Promise((resolve, reject) =>
      db.run(q_insertOrder(customerEmailAddress, dateOrderPlaced, orderStatus), (err: Error | null) =>
        err ? reject(err) : resolve()
      )
    );
  }

  static selectNewestOrder(): Promise<any> {
    const db = dBSqlite3();
    return new Promise((resolve, reject) =>
      db.get(q_selectOrderNewest(), (err, row) => (err ? reject(err) : resolve(row)))
    );
  }

  static insertOrderDetail(orderId: number, inventoryId: number, quantity: number): Promise<any> {
    const db = dBSqlite3();
    return new Promise((resolve, reject) =>
      db.run(q_insertOrderDetail(orderId, inventoryId, quantity), (err: Error | null) =>
        err ? reject(err) : resolve()
      )
    );
  }

  static async postOrder(
    customerEmailAddress: string,
    dateOrderPlaced: string,
    orderStatus: string,
    orderItems: any[]
  ): Promise<void> {
    const db = dBSqlite3();
    new Promise((resolve, reject) => {
      db.serialize(async () => {
        await this.createOrdersTable();
        await this.createOrderDetailTable();
        await this.insertOrder(customerEmailAddress, dateOrderPlaced, orderStatus);

        const order = await this.selectNewestOrder();

        orderItems.forEach(async orderItem => {
          const [inventoryId, quantity] = [orderItem[ORDERS_DETAIL.INVNETORY_ID], orderItem[ORDERS_DETAIL.QUANTITY]];
          const inventory: any = await InventoryTable.getInventory(inventoryId);

          if (inventory === undefined) reject(INVALID_INVENTORY_ID_ERROR.type);
          if (inventory[INVENTORIES.QUANTITY_AVAILABLE] < quantity) reject(AVAILABLE_QUANTITY_ERROR.type);

          await InventoryTable.updateInventory(
            orderItem[INVENTORIES.INVNETORY_ID],
            null,
            null,
            null,
            inventory[INVENTORIES.QUANTITY_AVAILABLE] - quantity
          );

          await this.insertOrderDetail(order[ORDERS.ORDER_ID], inventoryId, quantity);
        });

        return resolve();
      });
    });
  }

  static getOrders(): Promise<any> {
    const db = dBSqlite3();
    return new Promise((resolve, reject) =>
      db.all(q_selectOrders(), (err, orders) => (err ? reject(err) : resolve(orders)))
    );
  }

  static getOrder(id: number): Promise<any[]> {
    const db = dBSqlite3();
    return new Promise((resolve, reject) =>
      db.all(q_selectOrder(id), (err, orders) => (err ? reject(err) : resolve(orders)))
    );
  }

  static getOrderDetail(orderId: number, inventoryId: number): Promise<any> {
    const db = dBSqlite3();
    return new Promise((resolve, reject) => {
      db.get(q_selectOrderDetail(orderId, inventoryId), (err: Error | null, orderDetail: any) =>
        err ? reject(err) : resolve(orderDetail)
      );
    });
  }

  static updateOrder(
    orderId: number,
    customerEmailAddres: string | null,
    dateOrderPlaced: string | null,
    orderStatus: string | null
  ): Promise<void> {
    const db = dBSqlite3();
    return new Promise((resolve, reject) =>
      db.run(
        q_updateOrderItem(orderId, customerEmailAddres, dateOrderPlaced, orderStatus),
        (err: Error | null, _: RunResult) => {
          return err ? reject(err) : resolve();
        }
      )
    );
  }

  static updateOrderDetail(orderId: number, inventoryId: number, quantity: number): Promise<void> {
    const db = dBSqlite3();
    return new Promise<void>((resolve, reject) =>
      db.run(q_updateOrderDetail(orderId, inventoryId, quantity), (_: RunResult, err: Error | null) =>
        err ? reject(err) : resolve()
      )
    );
  }

  static putOrder(
    orderId: number,
    customerEmailAddress: string | null,
    dateOrderPlaced: string | null,
    orderStatus: string | null,
    inputOrderDetails: any[] | null
  ): Promise<void> {
    const db = dBSqlite3();
    return new Promise((resolve, reject) => {
      db.serialize(async () => {
        const order = await this.getOrder(orderId);
        if (order === undefined) reject(INVALID_ORDER_ID_ERROR.type);

        await this.updateOrder(orderId, customerEmailAddress, dateOrderPlaced, orderStatus);

        if (!inputOrderDetails) return resolve();

        inputOrderDetails.forEach(async inputOrderDetail => {
          const inventory = await InventoryTable.getInventory(inputOrderDetail[ORDERS_DETAIL.INVNETORY_ID]);

          if (!inputOrderDetail[ORDERS_DETAIL.ORDER_DETAIL_ID]) {
            if (inventory[INVENTORIES.QUANTITY_AVAILABLE] < inputOrderDetail[ORDERS_DETAIL.QUANTITY])
              reject(AVAILABLE_QUANTITY_ERROR.type);

            await InventoryTable.updateInventory(
              inventory[INVENTORIES.INVNETORY_ID],
              null,
              null,
              null,
              inventory[INVENTORIES.QUANTITY_AVAILABLE] - inputOrderDetail[ORDERS_DETAIL.QUANTITY]
            );

            await this.insertOrderDetail(
              orderId,
              inputOrderDetail[ORDERS_DETAIL.INVNETORY_ID],
              inputOrderDetail[ORDERS_DETAIL.QUANTITY]
            );

            return;
          }
          const orderDetail = await this.getOrderDetail(orderId, inputOrderDetail[ORDERS_DETAIL.INVNETORY_ID]);

          await InventoryTable.updateInventory(
            inputOrderDetail[ORDERS_DETAIL.INVNETORY_ID],
            null,
            null,
            null,
            inventory[INVENTORIES.QUANTITY_AVAILABLE] +
              inputOrderDetail[ORDERS_DETAIL.QUANTITY] -
              orderDetail[ORDERS_DETAIL.QUANTITY]
          );

          await this.updateOrderDetail(
            inputOrderDetail[ORDERS_DETAIL.ORDER_ID],
            inputOrderDetail[ORDERS_DETAIL.INVNETORY_ID],
            inputOrderDetail[ORDERS_DETAIL.QUANTITY]
          );
        });

        return resolve();
      });
    });
  }

  static deleteOrderItem(orderId: number): Promise<void> {
    const db = dBSqlite3();
    return new Promise((resolve, reject) =>
      db.run(q_deleteOrder(orderId), (err: Error | null, _: RunResult) => (err ? reject(err) : resolve()))
    );
  }
  static deleteOrderItemDetails(orderId: number): Promise<void> {
    const db = dBSqlite3();
    return new Promise((resolve, reject) =>
      db.run(q_deleteOrderDetails(orderId), (err: Error | null, _: RunResult) => (err ? reject(err) : resolve()))
    );
  }

  static deleteOrder(orderId: number): Promise<void> {
    const db = dBSqlite3();
    return new Promise((resolve, reject) =>
      db.serialize(async () => {
        const order = await this.getOrder(orderId);

        if (order === undefined) reject(INVALID_ORDER_ID_ERROR.type);

        await new Promise(async (resolve, _) => {
          order.forEach(async orderDetail => {
            const inventory = await InventoryTable.getInventory(orderDetail[ORDERS_DETAIL.INVNETORY_ID]);

            await InventoryTable.updateInventory(
              orderDetail[ORDERS_DETAIL.INVNETORY_ID],
              null,
              null,
              null,
              inventory[INVENTORIES.QUANTITY_AVAILABLE] + orderDetail[ORDERS_DETAIL.QUANTITY]
            );
          });
          resolve();
        });

        await this.deleteOrderItem(orderId);

        await this.deleteOrderItemDetails(orderId);

        return resolve();
      })
    );
  }
}

export default OrderTable;
