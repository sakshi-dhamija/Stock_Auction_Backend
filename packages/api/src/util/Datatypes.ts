import { Request, Response, NextFunction } from 'express';
import { UserStoreItem, UserStoreItemDetails } from '../models/User';
import { OrderDetails } from '../models/Order';

export class ErrorResponse extends Error {
    errors?: string[];

    constructor(message: string, errors?: string[]) {
        super(message);
        if (errors) {
            this.errors = errors;
        }
    }
}

interface SuccessResponseObject<T> {
    data: T;
}

export type UserResponse = SuccessResponseObject<UserStoreItemDetails>;

export type OrderResponse = SuccessResponseObject<OrderDetails>;

export interface Req extends Request {
    user?: UserStoreItem;
}

export type ResponseBody = ErrorResponse | UserResponse | OrderResponse;

export type Res = Response<ResponseBody>;

export interface NextFn extends Omit<NextFunction, 'err'> {
    (err?: ErrorResponse): void;
}