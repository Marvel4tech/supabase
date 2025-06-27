import React from 'react'

const Auth = () => {

  return (
    <div className=' flex flex-col items-center space-y-5'>
        <h2 className=' font-bold text-2xl'>
            Sign In
        </h2>

        <form className=' flex flex-col w-full items-center space-y-2'>
            <input 
                type="email"
                placeholder='Email'
                className=' border-1 border-gray-500 rounded-sm py-2 px-4 w-3/4'
            />
            <input 
                type="password"
                placeholder='Password'
                className=' border-1 border-gray-500 rounded-sm py-2 px-4 w-3/4'
            />
            <button className=' py-2 px-4 bg-blue-500 rounded-sm hover:bg-blue-600 transition-normal'>
                Sign In
            </button>
        </form>
    </div>
  )
}

export default Auth