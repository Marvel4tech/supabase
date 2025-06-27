'use client';

import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";

export default function Home() {
  const [newTask, setNewTask] = useState({title: "", description: ""});
  const [tasks, setTasks] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault()

    const { error } = await supabase.from('tasks').insert(newTask).single();

    if (error) {
      console.error("Error adding Task", error.message);
      return;
    }

    setNewTask({title: "", description: ""});
  }

  const fetchTasks = async () => {
   const {error, data} = await supabase.from("tasks").select('*').order("created_at", {ascending: false})

   if (error) {
    console.error("Error fetching Tasks", error.message);
    return;
   }

   setTasks(data);
  }

  useEffect(() => {
    fetchTasks();
  }, [])

  return (
    <div className=" max-w-2xl h-svh m-auto flex flex-col items-center space-y-5 py-8">
      <h2 className=" font-bold text-2xl">
        Task Manager CRUD
      </h2>

      <form onSubmit={handleSubmit} className=" w-full flex flex-col items-center">
        <input
          type="text"
          placeholder="Task Title"
          value={newTask.title}
          onChange={(e) => 
            setNewTask((prev) => ({...prev, title: e.target.value}))
          }
          className=" w-full border-1 rounded-xs bg-gray-900 outline-0 py-1 px-4 mb-2"
        />
        <textarea
          type="text"
          placeholder="Task Description"
          value={newTask.description}
          onChange={(e) => 
            setNewTask((prev) => ({...prev, description: e.target.value}))
          }
          className=" w-full border-1 rounded-xs bg-gray-900 outline-0 py-1 px-4"
        />
        <button type="submit" className=" text-sm mt-4 bg-blue-950 py-1 px-2 rounded-sm hover:bg-green-300 hover:text-black">
          Add Task
        </button>
      </form>

      <ul className=" w-full mt-5">
        {
          tasks.map((task) => (
            <li key={task.id}>
              <div className=" border-1 border-white rounded-xs p-4 flex flex-col items-center space-y-4">
                <h2 className=" font-bold">
                  {task.title}
                </h2>
                <p className=" text-gray-200">
                  {task.description}
                </p>
                <div className=" space-x-2">
                  <button className=" text-sm bg-blue-950 py-1 px-2 rounded-sm hover:bg-amber-300 hover:text-black">
                    Edit
                  </button>
                  <button className=" text-sm bg-blue-950 py-1 px-2 rounded-sm hover:bg-red-300 hover:text-black">
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))
        }
      </ul>
    </div>
  );
}
