import { Order } from '../Order/Order';
import { User } from '../User/User';
import { Amount, Quantity, Stock } from './Datatypes';

export interface Notification {

    notifyLtpUpdate(stock: Stock, lastTradePrice: Amount, time: Date, quantity: Quantity): void;
    notifyOrderUpdate(user: User, order: Order): void;
}