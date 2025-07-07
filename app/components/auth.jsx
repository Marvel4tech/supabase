'use client';

import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient';

const Auth = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (isSignUp) {
            const { error: signingUpError } = await supabase.auth.signUp({email, password});
            if (signingUpError) {
                console.error("Error signing up", signingUpError.message);
                return;
            }
        } else {
            const {error: signingInError } = await supabase.auth.signInWithPassword({email, password});
            if (signingInError) {
                console.error("Error signing In", signingInError.message);
                return;
            }
        }

        setEmail("")
        setPassword("")
    }

  return (
    <div className=' flex flex-col items-center pb-8'>
        <h2 className=' font-bold text-2xl mb-5'>
            {isSignUp ? "Sign Up" : "Sign In"}
        </h2>

        <form onSubmit={handleSubmit} className=' flex flex-col w-full items-center space-y-2 mb-3 text-sm'>
            <input 
                type="email"
                placeholder='Email'
                value={"email"}
                onChange={(e) => setEmail(e.target.value)}
                className=' border-1 border-gray-500 rounded-sm py-1.5 px-4 w-3/4'
            />
            <input 
                type="password"
                placeholder='Password'
                value={"password"}
                onChange={(e) => setPassword(e.target.value)}
                className=' border-1 border-gray-500 rounded-sm py-1.5 px-4 w-3/4'
            />
            <button type='submit' className=' py-2 px-4 bg-blue-500 rounded-sm hover:bg-blue-600 transition-normal'>
                {isSignUp ? "Sign Up" : "Sign In"}
            </button>
        </form>
        <button onClick={() => setIsSignUp(!isSignUp)} className=' text-gray-300 text-sm hover:border-1 hover:border-blue-400 
        hover:py-1.5 hover:px-4 hover:rounded-sm'>
            {isSignUp ? "Already have an accout, Sign In" : "Don,t have an account, Sign Up"}
        </button>
    </div>
  )
}

export default Auth