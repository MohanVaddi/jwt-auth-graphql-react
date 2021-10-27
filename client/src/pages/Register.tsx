import React, { useState } from 'react';
import { RouteComponentProps } from 'react-router';
import { useRegisterMutation } from '../generated/graphql';

export const Register: React.FC<RouteComponentProps> = ({ history }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [register] = useRegisterMutation();

    const formSubmitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log('form submitted');
        const response = await register({
            variables: {
                email: email,
                password: password,
            },
        });
        console.log(response);
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
            <button type='submit'>Register</button>
        </form>
    );
};
