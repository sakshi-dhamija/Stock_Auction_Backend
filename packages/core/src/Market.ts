import { Stock, OperationResponse, ID, OperationResponseStatus, Amount } from './util/Datatypes';
import { StockOrderStore } from './Order/StockOrderStore';
import { OrderInput, Order } from './Order/Order';
import { Notification } from './util/Notification';

export type LtpMap = Partial<Record<Stock, Amount>>;
export type MarketResponse = OperationResponse<StockOrderStore>;

export class Market {
    private static nextOrderId: ID = 1;
    private orderStore: Map<Stock, StockOrderStore>;
    private static instance: Market;
    private notification?: Notification;

    private constructor() {
        this.orderStore = new Map<Stock, StockOrderStore>();
    }

    static getInstance(): Market {
        if (!Market.instance) {
            Market.instance = new Market();
        }
        return Market.instance;
    }
    addOrderStore(stock: Stock, lastTradePrice?: Amount): MarketResponse {
        const orderStore = this.orderStore.get(stock);
        if (orderStore) {
            return {
                status: OperationResponseStatus.Error,
                messages: [{ message: 'OrderStore already exists for stock.' }],
            };
        } else {
            const orderStore = new StockOrderStore(lastTradePrice);
            this.orderStore.set(stock, orderStore);
            return {
                data: orderStore,
                status: OperationResponseStatus.Success,
            };
        }
    }

    getOrderStoreForStock(stock: Stock): StockOrderStore {
        const orderStore = this.orderStore.get(stock);
        if (orderStore) {
            return orderStore;
        }
        throw new Error("Order Store for Symbol doesn't exist");
    }
    placeOrder(order: OrderInput): Order {
        return this.getOrderStoreForStock(order.symbol).createOrder(order);
    }

    getMarginRequired(order: OrderInput): Amount {
        return this.getOrderStoreForStock(order.symbol).getMarginRequired(order);
    }

    getNotification(): Notification | undefined {
        return this.notification;
    }

    attachNotification(notification: Notification): void {
        this.notification = notification;
    }

    static getNextOrderId(): ID {
        return this.nextOrderId++;
    }

    getLtpForOrderStores(): LtpMap {
        const ltpMap: LtpMap = {};
        this.orderStore.forEach((orderStore, stock) => {
            ltpMap[stock] = orderStore.getLtp();
        });
        return ltpMap;
    }
}