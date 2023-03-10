import { OrderStatus, OrderType, Order, AdditionalOrderType } from './Order';
import { Amount } from '../util/Datatypes';

class OrderMatcher {
    static buySettlesSell(buy: Order, sell: Order): boolean {
        if (
            buy.getAdditionalOrderType() === AdditionalOrderType.Market ||
            sell.getAdditionalOrderType() === AdditionalOrderType.Market
        ) {
            return true;
        }
        if (
            buy.getAmountSettled() + buy.getQuantityToSettle() * sell.getPrice() <=
            buy.getPrice() * buy.getQuantity()
        ) {
            return true;
        }
        return false;
    }

    private static settlementPossible(order1: Order, order2: Order): boolean {
        const order1Quantity = order1.getQuantityToSettle();
        const order2Quantity = order2.getQuantityToSettle();
        if (
            order2Quantity >= order1Quantity &&
            (order1.getOrderType() === OrderType.Buy
                ? order2.getOrderType() === OrderType.Sell && this.buySettlesSell(order1, order2)
                : order2.getOrderType() === OrderType.Buy && this.buySettlesSell(order2, order1))
        ) {
            return true;
        } else {
            return false;
        }
    }

    private static getSettlementPrice(order1: Order, order2: Order, lastTradePrice: Amount): Amount {
        if (
            order1.getAdditionalOrderType() === AdditionalOrderType.Market &&
            order2.getAdditionalOrderType() === AdditionalOrderType.Market
        ) {
            return lastTradePrice;
        } else if (
            order1.getAdditionalOrderType() === AdditionalOrderType.Market &&
            order2.getAdditionalOrderType() === AdditionalOrderType.Limit
        ) {
            return order2.getPrice();
        } else if (
            order1.getAdditionalOrderType() === AdditionalOrderType.Limit &&
            order2.getAdditionalOrderType() === AdditionalOrderType.Market
        ) {
            return order1.getPrice();
        } else {
            return (order1.getPrice() + order2.getPrice()) / 2;
        }
    }
    static settleOrders(order1: Order, order2: Order, lastTradePrice: Amount): void {
        const order1Quantity = order1.getQuantityToSettle();
        const order2Quantity = order2.getQuantityToSettle();
        if (this.settlementPossible(order1, order2)) {
            const time = new Date();
            const price = this.getSettlementPrice(order1, order2, lastTradePrice);
            order1.addSettledBy(order2, order1Quantity, time, price);
            order1.setStatus(OrderStatus.Confirmed);
            order1.user.notifyOrderUpdate(order1);
            order2.addSettledBy(order1, order1Quantity, time, price);
            if (order2Quantity === order1Quantity) {
                order2.setStatus(OrderStatus.Confirmed);
            } else if (order2.getStatus() === OrderStatus.Placed) {
                order2.setStatus(OrderStatus.PartiallyFilled);
            }
            order2.user.notifyOrderUpdate(order2);
        } else throw new Error('Preconditions not met to settle order.');
    }
}

export { OrderMatcher };