import { Response } from 'express';
import { UserStore } from '../models/User';
import { Req, Res, NextFn } from '../util/Datatypes';

function fillUserData(req: Req, res: Response, next: NextFn): void {
    if (req.session?.userId) {
        const user = UserStore.findUserByUsername(req.session.userId);
        if (user) {
            req.user = user;
        }
    }
    return next();
}

function isAuthenticated(req: Req, res: Res, next: NextFn): void {
    if (!req.user) {
        return next(new Error('Not logged in'));
    }
    return next();
}

async function authenticate(req: Req, res: Res, next: NextFn): Promise<void> {
    const username = req.body.username;
    const password = req.body.password;
    try {
        const user = await UserStore.findUserByUsernameAndAuthenticate(username, password);
        if (req.session) {
            req.session.userId = user.username;
        }
        return next();
    } catch (ex) {
        return next(ex);
    }
}

export { isAuthenticated, authenticate, fillUserData };