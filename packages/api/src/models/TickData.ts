import { Market, Stock, TradeTick } from '../../../core';

export class TickData {
    static getTickDataForSymbol(stock: Stock): TradeTick[] {
        return Market.getInstance().getOrderStoreForStock(stock).tickStore.getTickData();
    }
}