import express from 'express';
import compression from 'compression';
import bodyParser from 'body-parser';
import expressSession from 'express-session';
import path from 'path';
import methodOverride from 'method-override';

import routes from './routes';

import { errorHandler } from './middlewares/errorHandler';
import { fillUserData } from './middlewares/authenticator';

const app = express();

app.set('port', process.env.PORT || 3001);
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const session = expressSession({
    resave: true,
    saveUninitialized: true,
    secret: '12345678',
});
app.use(session);

app.use(fillUserData);

app.use('/', routes);

app.use(methodOverride());
app.use(errorHandler);

export default app;
export { session };