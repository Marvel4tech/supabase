'use client';

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

const TaskManager = ({session}) => {
    const [newTask, setNewTask] = useState({title: "", description: ""});
    const [tasks, setTasks] = useState([]);
    const [newDescription, setNewDescription] = useState("");
    const [taskImage, setTaskImage] = useState(null)

    // for image
    const handleFileChange = (e) => {
      if (e.target.files && e.target.files.length > 0) {
        setTaskImage(e.target.files[0])
      }
    }

    // file image
    const uploadImage = async (file) => {
      const filePath = `${file.name}-${Date.now()}`

      const { error } = await supabase.storage.from("tasks-images").upload(filePath, file);

      if (error) {
        console.log("Error uploading Image: ", error.message);
        return;
      }

      const { data } = await supabase.storage.from("tasks-images").getPublicUrl(filePath);
      return data.publicUrl;
    }

    // Submit or add Task
    const handleSubmit = async (e) => {
        e.preventDefault()

        let imageUrl; // for image
        if (taskImage) {
          imageUrl = await uploadImage(taskImage);
        }

        const { error } = await supabase.from('tasks').insert({...newTask, email: session.user.email, image_url: imageUrl}).single();

        if (error) {
            console.error("Error adding Task", error.message);
            return;
        }

        setNewTask({title: "", description: ""});
    }

    // Get all tasks
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

    // Delete Tasks
    const handleDelete = async (id) => {
        const { error } = await supabase.from('tasks').delete().eq("id", id)

        if (error) {
            console.error("Error deleting Task", error.message);
            return;
        }

        // Remove from state
        setTasks((prev) => prev.filter((task) => task.id !== id));
    }

    // Edit or Update Tasks
    const handleUpdate = async (id) => {
        const { error } = await supabase.from('tasks').update({description: newDescription}).eq("id", id)

        if (error) {
            console.error("Error updating Task", error.message);
            return;
        }

        // Update in state
        setTasks((prev) =>
          prev.map((task) =>
            task.id === id ? { ...task, description: newDescription } : task
          )
        );
        setNewDescription(""); // Clear textarea after update
    }

    // Subscribe On so it updates live at once
    useEffect(() => {
      const channel = supabase
        .channel("tasks-channel")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "tasks" },
          (payload) => {
            const newTask = payload.new;
            setTasks((prev) => [...prev, newTask]);
          }
        );
    
      // Subscribe
      const { subscription, error } = channel.subscribe((status) => {
        console.log("Subscription status:", status);
      });
    
      if (error) {
        console.error("Subscription error:", error.message);
      }
    
      // Cleanup
      return () => {
        supabase.removeChannel(channel);
      };
    }, []);

  return (
    <div className="flex flex-col items-center space-y-5 py-8">
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

        <input 
          accept="image/*"
          type="file"
          onChange={handleFileChange}
          className=" border-1 border-gray-300 mt-2 py-1 px-4 rounded-sm"
        />

        <button type="submit" className=" text-sm mt-4 bg-blue-950 py-1 px-2 rounded-sm hover:bg-green-300 hover:text-black">
          Add Task
        </button>
      </form>

      <ul className=" w-full mt-5">
        {
          tasks.map((task) => (
            <li key={task.id} className=" mb-2">
              <div className=" border-1 border-gray-500 rounded-xs p-4 flex flex-col items-center space-y-4">
                <h2 className=" font-bold">
                  {task.title}
                </h2>
                <p className=" text-gray-300 text-sm">
                  {task.description}
                </p>
                <img 
                  src={task.image_url} 
                  alt="image title" 
                  className=" h-48 w-72"
                />
                <div className=" flex flex-col items-center space-y-2 text-xs">
                  <textarea 
                    placeholder="Update description"
                    className=" border-1 border-gray-200 rounded-sm p-2 outline-0"
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                  <div className=" space-x-2">
                    <button onClick={() => handleUpdate(task.id)} className=" text-sm bg-blue-950 py-1 px-2 rounded-sm 
                    hover:bg-amber-300 hover:text-black">
                      Update
                    </button>
                    <button onClick={() => handleDelete(task.id)} className=" text-sm bg-blue-950 py-1 px-2 rounded-sm hover:bg-red-300 hover:text-black">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))
        }
      </ul>
    </div>
  )
}

export default TaskManager