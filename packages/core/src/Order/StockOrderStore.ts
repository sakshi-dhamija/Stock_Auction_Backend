import { Order, OrderType, OrderStatus, OrderInput, AdditionalOrderType } from './Order';
import { Amount, SortOrder } from '../util/Datatypes';
import { OrderStore } from './OrderStore';
import { OrderMatcher } from './OrderMatcher';
import { Market } from '../Market';
import { TickDataStore } from './TickDataStore';

export class StockOrderStore extends OrderStore {
    private lastTradePrice: Amount;
    tickStore: TickDataStore;

    constructor(lastTradePrice?: Amount) {
        super();
        this.lastTradePrice = lastTradePrice || 0;
        this.tickStore = new TickDataStore();
        if (lastTradePrice) {
            this.tickStore.addTick(new Date(), lastTradePrice, 0);
        }
    }

    createOrder(order: OrderInput): Order {
        const newOrder = new Order(order);
        this.addOrder(newOrder);
        newOrder.user.notifyOrderAdd(newOrder);
        this.findMatchingOrdersAndSettle(newOrder);
        return newOrder;
    }

     // Main logic to match orders.
    
    private findMatchingOrdersAndSettle(order: Order): void {
        if (order.getOrderType() === OrderType.Buy) {

            while (
                this.placedSellOrders[0] &&
                OrderMatcher.buySettlesSell(order, this.placedSellOrders[0]) &&
                order.getStatus() !== OrderStatus.Confirmed
            ) {
                this.settleOrders(order, this.placedSellOrders[0]);
            }
        } else {
            while (
                this.placedBuyOrders[0] &&
                OrderMatcher.buySettlesSell(this.placedBuyOrders[0], order) &&
                order.getStatus() !== OrderStatus.Confirmed
            ) {
                this.settleOrders(this.placedBuyOrders[0], order);
            }
        }
    }

    private static sortOrders(orders: Order[], priceSortOrder: SortOrder): Order[] {
        orders.sort((a, b) => {
            if (
                a.getAdditionalOrderType() === AdditionalOrderType.Market &&
                b.getAdditionalOrderType() === AdditionalOrderType.Limit
            ) {
                return -1;
            }
            if (
                a.getAdditionalOrderType() === AdditionalOrderType.Limit &&
                b.getAdditionalOrderType() === AdditionalOrderType.Market
            ) {
                return 1;
            }
            return 0;
        });
        if (priceSortOrder === SortOrder.Ascending) {
            return orders.sort((a, b) => a.getPrice() - b.getPrice());
        } else {
            return orders.sort((a, b) => b.getPrice() - a.getPrice());
        }
    }

    addOrder(order: Order): void {
        super.addOrder(order);
        if (order.getOrderType() === OrderType.Buy) {
            StockOrderStore.sortOrders(this.placedBuyOrders, SortOrder.Descending);
        } else {
            StockOrderStore.sortOrders(this.placedSellOrders, SortOrder.Ascending);
        }
    }

    private settleOrders(buy: Order, sell: Order): void {
        const buyQuantity = buy.getQuantityToSettle();
        const sellQuantity = sell.getQuantityToSettle();

        if (buyQuantity > sellQuantity) {
            OrderMatcher.settleOrders(sell, buy, this.lastTradePrice);
            this.confirmOrder(sell);
        } else if (sellQuantity > buyQuantity) {
            OrderMatcher.settleOrders(buy, sell, this.lastTradePrice);
            this.confirmOrder(buy);
        } else {

            OrderMatcher.settleOrders(buy, sell, this.lastTradePrice);
            this.confirmOrder(buy);
            this.confirmOrder(sell);
        }

        const sellLatestSettlement = sell.getLatestSettlement();
        if (this.lastTradePrice !== sellLatestSettlement.price) {
            this.lastTradePrice = sellLatestSettlement.price;
            Market.getInstance()
                .getNotification()
                ?.notifyLtpUpdate(
                    sell.getSymbol(),
                    this.lastTradePrice,
                    sellLatestSettlement.time,
                    sellLatestSettlement.quantity,
                );
            this.tickStore.addTick(
                sellLatestSettlement.time,
                sellLatestSettlement.price,
                sellLatestSettlement.quantity,
            );
        }

        if (buyQuantity > sellQuantity) {
            this.findMatchingOrdersAndSettle(buy);
        } else if (sellQuantity > buyQuantity) {
            this.findMatchingOrdersAndSettle(sell);
        }
    }

    getMarginRequired(order: OrderInput): Amount {
        if (order.type === OrderType.Sell) {
            return 0;
        }
        if (order.additionalType === AdditionalOrderType.Limit) {

            return order.price * order.quantity;
        } else {
            return this.lastTradePrice * order.quantity;
        }
    }

    getLtp(): Amount {
        return this.lastTradePrice;
    }
}