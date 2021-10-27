import { sign } from 'jsonwebtoken';
import { User } from './entity/User';

export const createAccessToken = (user: User) => {
    return sign({ userId: user.id }, process.env.ACCCESS_TOKEN_SECRET!, {
        expiresIn: '15m',
    });
};

export const createRefreshToken = (user: User) => {
    return sign(
        { userId: user.id, tokenVersion: user.tokenVersion },
        process.env.REFRESH_TOKEM_SECRET!,
        {
            expiresIn: '7d',
        }
    );
};
