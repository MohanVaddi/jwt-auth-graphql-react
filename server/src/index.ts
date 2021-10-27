import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import 'reflect-metadata';
import { createConnection } from 'typeorm';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { UserResolver } from './UserResolver';
import cookieParser from 'cookie-parser';
import { verify } from 'jsonwebtoken';
import { User } from './entity/User';
import { createAccessToken, createRefreshToken } from './auth';
import { sendRefreshToken } from './sendRefreshToken';

const port = process.env.PORT || 4000;

(async () => {
    const app = express();
    app.use(
        cors({
            origin: 'http://localhost:3000',
            credentials: true,
        })
    );
    app.use(cookieParser());
    app.get('/', (_, res) => {
        res.send('Hello World!');
    });
    app.post('/refresh_token', async (req, res) => {
        console.log(req.cookies);
        const token = req.cookies.jid;
        if (!token) {
            return res.json({ ok: false, accessToken: '' });
        }

        let payload: any = null;
        try {
            payload = verify(token, process.env.REFRESH_TOKEM_SECRET!);
        } catch (error) {
            console.log(error);
            return res.json({ ok: false, accessToken: '' });
        }

        // token is valid and we can send back an access token
        const user = await User.findOne({ id: payload.userId });
        if (!user) {
            return res.json({ ok: false, accessToken: '' });
        }
        if (user.tokenVersion !== payload.tokenVersion) {
            return res.json({ ok: false, accessToken: '' });
        }
        sendRefreshToken(res, createRefreshToken(user));
        return res.send({ ok: true, accessToken: createAccessToken(user) });
    });
    await createConnection();

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [UserResolver],
        }),
        context: ({ req, res }) => ({ req, res }),
    });
    await apolloServer.start();
    apolloServer.applyMiddleware({ app, cors: false });
    app.listen(port, () => {
        console.log(`Express server started at port ${port}`);
    });
})();
