import Auth from "./components/auth";
import TaskManager from "./components/taskManager";


export default function Home() {
  
  return (
    <main className=" max-w-2xl m-auto">
      <TaskManager />
      <Auth />
    </main>
  );
}
