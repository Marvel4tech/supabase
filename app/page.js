'use client';

import { useEffect, useState } from "react";
import Auth from "./components/auth";
import TaskManager from "./components/taskManager";
import { supabase } from "./lib/supabaseClient";


export default function Home() {
  const [session, setSession] = useState(null);

  const fetchSession = async () => {
    const currentSession = await supabase.auth.getSession();
    console.log(currentSession)
    setSession(currentSession.data.session);
  }

  useEffect(() => {
    fetchSession();

    const {data: authListener} = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };

  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  }

  return (
    <main className=" max-w-2xl m-auto">
      {
        session ? 
          (<>
            <button onClick={handleLogout} className=" hover:bg-gray-800 border-1 rounded-sm py-1 px-4 mt-8">Log Out</button>
            <TaskManager /> 
          </>) :
          (<Auth />)
      }
    </main>
  );
}
