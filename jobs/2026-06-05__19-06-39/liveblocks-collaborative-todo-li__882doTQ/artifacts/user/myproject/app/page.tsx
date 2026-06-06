"use client";

import { useState } from "react";
import { useStorage, useMutation } from "@liveblocks/react/suspense";
import { LiveObject } from "@liveblocks/client";

export default function Page() {
  const [text, setText] = useState("");

  const todos = useStorage((root) => root.todos);

  const addTodo = useMutation(({ storage }, text: string) => {
    const cleanText = text.trim();
    if (!cleanText) return;
    const newTodo = new LiveObject({
      id: crypto.randomUUID(),
      text: cleanText,
      done: false,
    });
    storage.get("todos").push(newTodo);
  }, []);

  const toggleTodo = useMutation(({ storage }, id: string) => {
    const todosList = storage.get("todos");
    const index = todosList.findIndex((todo) => todo.get("id") === id);
    if (index !== -1) {
      const todo = todosList.get(index);
      if (todo) {
        todo.set("done", !todo.get("done"));
      }
    }
  }, []);

  const deleteTodo = useMutation(({ storage }, id: string) => {
    const todosList = storage.get("todos");
    const index = todosList.findIndex((todo) => todo.get("id") === id);
    if (index !== -1) {
      todosList.delete(index);
    }
  }, []);

  const clearCompleted = useMutation(({ storage }) => {
    const todosList = storage.get("todos");
    for (let i = todosList.length - 1; i >= 0; i--) {
      const todo = todosList.get(i);
      if (todo && todo.get("done")) {
        todosList.delete(i);
      }
    }
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = text.trim();
    if (!cleanText) return;
    addTodo(cleanText);
    setText("");
  };

  return (
    <main style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Collaborative Todo List</h1>

      <form onSubmit={handleAdd} style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <input
          data-testid="new-todo-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a todo"
          style={{ flex: 1, padding: "0.5rem" }}
        />
        <button data-testid="add-todo-button" type="submit" style={{ padding: "0.5rem 1rem" }}>
          Add
        </button>
        <button
          data-testid="clear-completed-button"
          type="button"
          onClick={() => clearCompleted()}
          style={{ padding: "0.5rem 1rem" }}
        >
          Clear completed
        </button>
      </form>

      <ul data-testid="todo-list" style={{ listStyle: "none", padding: 0 }}>
        {todos.map((todo) => (
          <li
            key={todo.id}
            data-testid="todo-item"
            data-todo-text={todo.text}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 0",
              borderBottom: "1px solid #eee",
            }}
          >
            <input
              type="checkbox"
              data-testid="todo-checkbox"
              checked={todo.done}
              onChange={() => toggleTodo(todo.id)}
            />
            <span
              data-testid="todo-text"
              style={{
                flex: 1,
                textDecoration: todo.done ? "line-through" : "none",
                color: todo.done ? "#888" : "inherit",
              }}
            >
              {todo.text}
            </span>
            <button
              type="button"
              data-testid="delete-todo-button"
              onClick={() => deleteTodo(todo.id)}
              style={{ padding: "0.25rem 0.5rem" }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
