"use client";

import { LiveList } from "@liveblocks/client";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
  useStorage,
  useMutation,
} from "@liveblocks/react/suspense";
import { useState, useEffect } from "react";

type Todo = {
  id: string;
  text: string;
  completed: boolean;
};

function TodoList() {
  const todos = useStorage((root: any) => root.todos) as Todo[] | undefined;
  const [newTodoText, setNewTodoText] = useState("");

  const addTodo = useMutation(({ storage }, text: string) => {
    const todosList = storage.get("todos") as LiveList<Todo>;
    if (todosList) {
      todosList.push({
        id: crypto.randomUUID(),
        text,
        completed: false,
      });
    }
  }, []);

  const toggleTodo = useMutation(({ storage }, id: string) => {
    const todosList = storage.get("todos") as LiveList<Todo>;
    if (todosList) {
      const index = todosList.findIndex((todo) => todo.id === id);
      if (index !== -1) {
        const todo = todosList.get(index);
        if (todo) {
          todosList.set(index, {
            ...todo,
            completed: !todo.completed,
          });
        }
      }
    }
  }, []);

  const deleteTodo = useMutation(({ storage }, id: string) => {
    const todosList = storage.get("todos") as LiveList<Todo>;
    if (todosList) {
      const index = todosList.findIndex((todo) => todo.id === id);
      if (index !== -1) {
        todosList.delete(index);
      }
    }
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;
    addTodo(newTodoText.trim());
    setNewTodoText("");
  };

  return (
    <div style={{ maxWidth: "500px", margin: "2rem auto", padding: "1rem" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Shared Todo List</h1>
      
      <form onSubmit={handleAdd} style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <input
          type="text"
          data-testid="new-todo-input"
          id="new-todo-input"
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          placeholder="Add a new todo..."
          style={{ flexGrow: 1, padding: "0.5rem", fontSize: "1rem" }}
        />
        <button
          type="submit"
          data-testid="add-todo-btn"
          style={{ padding: "0.5rem 1rem", fontSize: "1rem" }}
        >
          Add
        </button>
      </form>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {todos?.map((todo) => (
          <li
            key={todo.id}
            data-testid="todo-item"
            data-todo-text={todo.text}
            data-completed={todo.completed ? "true" : "false"}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.5rem",
              borderBottom: "1px solid #ccc",
              textDecoration: todo.completed ? "line-through" : "none",
            }}
          >
            <span style={{ flexGrow: 1 }}>{todo.text}</span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                data-testid="toggle-btn"
                onClick={() => toggleTodo(todo.id)}
                style={{ padding: "0.25rem 0.5rem" }}
              >
                {todo.completed ? "Undo" : "Complete"}
              </button>
              <button
                type="button"
                data-testid="delete-btn"
                onClick={() => deleteTodo(todo.id)}
                style={{ padding: "0.25rem 0.5rem", color: "red" }}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Page() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div style={{ maxWidth: "500px", margin: "2rem auto", padding: "1rem" }}>
        Loading collaborative session...
      </div>
    );
  }

  const publicApiKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY;
  const roomId = process.env.NEXT_PUBLIC_ZEALT_RUN_ID;

  if (!publicApiKey) {
    return (
      <div style={{ padding: "2rem", color: "red" }}>
        Error: NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY is not defined.
      </div>
    );
  }

  if (!roomId) {
    return (
      <div style={{ padding: "2rem", color: "red" }}>
        Error: NEXT_PUBLIC_ZEALT_RUN_ID is not defined.
      </div>
    );
  }

  return (
    <LiveblocksProvider publicApiKey={publicApiKey}>
      <RoomProvider
        id={roomId}
        initialStorage={{
          todos: new LiveList<Todo>([]),
        }}
      >
        <ClientSideSuspense fallback={<div>Loading collaborative session...</div>}>
          {() => <TodoList />}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
