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
      const cleanName = file.name.replace(/\s+/g, "_");
      const filePath = `${session.user.email}/${cleanName}-${Date.now()}`;
      console.log("Uploading filePath:", filePath);

      const { error } = await supabase.storage.from("tasks-images").upload(filePath, file);

      if (error) {
        console.log("Error uploading Image: ", error.message);
        return;
      }

      const { data } = await supabase.storage.from("tasks-images").getPublicUrl(filePath);
      return { publicUrl: data.publicUrl, filePath };
    }

    // Submit or add Task
    const handleSubmit = async (e) => {
        e.preventDefault()

        let imageUrl; // for image
        let imagePath;
        if (taskImage) {
          const { publicUrl, filePath } = await uploadImage(taskImage);
          imageUrl = publicUrl;
          imagePath = filePath;
        }

        const { error } = await supabase.from('tasks').insert({...newTask, email: session.user.email, image_url: imageUrl, image_path: imagePath}).single();

        if (error) {
            console.error("Error adding Task", error.message);
            return;
        }

        setNewTask({title: "", description: ""});
    }

    // Get all tasks
    const fetchTasks = async () => {
        // const {error, data} = await supabase.from("tasks").select('*').order("created_at", {ascending: false}) -> fetches all task
        const { error, data } = await supabase.from("tasks").select("*").eq("email", session.user.email).order("created_at", { ascending: false }); //fetch data based on user email

        if (error) {
            console.error("Error fetching Tasks", error.message);
            return;
        }

        setTasks(data);
    }

    useEffect(() => {
        fetchTasks();
    }, [])

    const handleDelete = async (id) => {
      // 1. Fetch the task to get image_path
      const { data: taskData, error: fetchError } = await supabase
        .from("tasks")
        .select("image_path")
        .eq("id", id)
        .single();
    
      if (fetchError) {
        console.error("Error fetching task:", fetchError.message);
        return;
      }
    
      if (taskData?.image_path) {
        console.log("Attempting to delete image path (exact):", taskData.image_path);
    
        const { error: storageError } = await supabase
          .storage
          .from("tasks-images")
          .remove([taskData.image_path]);
    
        if (storageError) {
          console.error("Storage deletion failed:", storageError.message);
          return;
        } else {
          console.log("Image deleted successfully.");
        }
      }
    
      // Delete the TASK RECORD
      const { error: deleteError } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id);
    
      if (deleteError) {
        console.error("Task deletion failed:", deleteError.message);
        return;
      }
      
      // Update UI
      setTasks((prev) => prev.filter((task) => task.id !== id));
    };
    

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
      .channel('tasks-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks',
        },
        (payload) => {
          const newTask = payload.new;
          setTasks((prev) => [...prev, newTask]);
        }
      );

  // Subscribe and log status
  channel.subscribe((status) => {
    console.log('Subscription status:', status);
    if (status === 'SUBSCRIBED') {
      console.log('Successfully subscribed to Realtime!');
    }
  });

  // Cleanup on unmount
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


   // Delete Tasks
    /* const handleDelete = async (id) => {

      // Get the task so we can get the image_url
      const { data: taskData, error: fetchError } = await supabase.from("tasks").select("image_path").eq("id", id).single();

      if (fetchError) {
        console.error("Error deleting Task", fetchError.message);
        return;
    }

      // Delete the task
      const { error: deleteError } = await supabase.from('tasks').delete().eq("id", id)

      // Delete from bucket
      if (taskData?.image_path) {
          const { error: storageError } = await supabase.storage.from("tasks-images").remove([taskData.image_path]);

          if (storageError) {
            console.error("Error deleting image from storage", storageError.message);
          }
      }

      // Remove from state
      setTasks((prev) => prev.filter((task) => task.id !== id));
    } */