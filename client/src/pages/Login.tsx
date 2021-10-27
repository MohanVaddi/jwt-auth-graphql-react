import React, { useState } from 'react';
import { RouteChildrenProps } from 'react-router';
import { setAccessToken } from '../accessToken';
import { MeDocument, MeQuery, useLoginMutation } from '../generated/graphql';

export const Login: React.FC<RouteChildrenProps> = ({ history }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [login] = useLoginMutation();
    const formSubmitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log('form submitted');
        const response = await login({
            variables: {
                email: email,
                password: password,
            },
            update: (store, { data }) => {
                if (!data) {
                    return null;
                }
                store.writeQuery<MeQuery>({
                    query: MeDocument,
                    data: { 
                        me: data.login.user,
                    },
                });
            },
        });
        console.log(response);
        if (response && response.data) {
            setAccessToken(response.data.login.accessToken);
        }
        history.push('/');
    };
    return (
        <form onSubmit={formSubmitHandler}>
            <div>
                <input
                    value={email}
                    type='email'
                    placeholder='email'
                    onChange={e => {
                        setEmail(e.target.value);
                    }}
                />
            </div>
            <div>
                <input
                    value={password}
                    type='password'
                    placeholder='password'
                    onChange={e => {
                        setPassword(e.target.value);
                    }}
                />
            </div>
            <button type='submit'>Login</button>
        </form>
    );
};
