import {
    Arg,
    Ctx,
    Field,
    Int,
    Mutation,
    ObjectType,
    Query,
    Resolver,
    UseMiddleware,
} from 'type-graphql';
import { User } from './entity/User';
import { hash, compare } from 'bcryptjs';
import { MyContext } from './MyContext';
import { createAccessToken, createRefreshToken } from './auth';
import { isAuth } from './isAuth';
import { sendRefreshToken } from './sendRefreshToken';
import { getConnection } from 'typeorm';
import { verify } from 'jsonwebtoken';

@ObjectType()
class LoginResponse {
    @Field()
    accessToken: string;
    @Field(() => User)
    user: User;
}

@Resolver()
export class UserResolver {
    @Query(() => String)
    hello() {
        return 'hii!';
    }

    @Query(() => String)
    @UseMiddleware(isAuth)
    bye(@Ctx() { payload }: MyContext) {
        console.log(payload);
        return `Your user id is: ${payload!.userId}`;
    }

    @Query(() => [User])
    users() {
        return User.find();
    }

    @Query(() => User, { nullable: true })
    me(@Ctx() context: MyContext) {
        const authorization = context.req.headers['authorization'];

        if (!authorization) {
            return null;
        }
        try {
            const token = authorization.split(' ')[1];
            const payload: any = verify(
                token,
                process.env.ACCCESS_TOKEN_SECRET!
            );
            return User.findOne(payload.userId);
        } catch (err) {
            console.log(err);
            return null;
        }
    }
    @Mutation(() => Boolean)
    async register(
        @Arg('email') email: string,
        @Arg('password') password: string
    ) {
        try {
            const user = await User.findOne({ email });
            if (user) {
                throw new Error('User already exists');
            }
            const hashedPassword = await hash(password, 12);
            await User.insert({
                email,
                password: hashedPassword,
            });
            return true;
        } catch (err) {
            console.log(err);
            return false;
        }
    }

    @Mutation(() => LoginResponse)
    async login(
        @Arg('email') email: string,
        @Arg('password') password: string,
        @Ctx() { res }: MyContext
    ): Promise<LoginResponse> {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            throw new Error('Could not find user.');
        }
        const valid = await compare(password, user.password);
        if (!valid) {
            throw new Error('Invalid password!');
        }

        sendRefreshToken(res, createRefreshToken(user));

        // * login successful
        return {
            accessToken: createAccessToken(user),
            user: user,
        };
    }

    @Mutation(() => Boolean)
    async revokeRefreshTokensForUser(@Arg('userId', () => Int) userId: number) {
        await getConnection()
            .getRepository(User)
            .increment({ id: userId }, 'tokenVersion', 1);
        return true;
    }

    @Mutation(() => Boolean)
    async logout(@Ctx() { res }: MyContext) {
        sendRefreshToken(res, '');
        return true;
    }
}
