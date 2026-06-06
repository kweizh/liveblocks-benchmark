"use client";

import { useState } from "react";
import { useStorage, useMutation } from "@liveblocks/react/suspense";
import { LiveObject } from "@liveblocks/client";

export default function Page() {
  const [text, setText] = useState("");
  
  const todos = useStorage((root) => root.todos);

  const addTodo = useMutation(({ storage }, text: string) => {
    if (!text.trim()) return;
    const todos = storage.get("todos");
    todos.push(new LiveObject({ id: crypto.randomUUID(), text: text.trim(), done: false }));
  }, []);

  const toggleTodo = useMutation(({ storage }, id: string) => {
    const todos = storage.get("todos");
    const index = todos.findIndex((t) => t.get("id") === id);
    if (index !== -1) {
      const todo = todos.get(index);
      if (todo) {
        todo.set("done", !todo.get("done"));
      }
    }
  }, []);

  const deleteTodo = useMutation(({ storage }, id: string) => {
    const todos = storage.get("todos");
    const index = todos.findIndex((t) => t.get("id") === id);
    if (index !== -1) {
      todos.delete(index);
    }
  }, []);

  const clearCompleted = useMutation(({ storage }) => {
    const todos = storage.get("todos");
    // Iterate backwards to safely delete items without shifting indexes of upcoming items
    for (let i = todos.length - 1; i >= 0; i--) {
      const todo = todos.get(i);
      if (todo?.get("done")) {
        todos.delete(i);
      }
    }
  }, []);

  return (
    <main>
      <h1>Collaborative Todo List</h1>

      <div>
        <input
          data-testid="new-todo-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              addTodo(text);
              setText("");
            }
          }}
          placeholder="Add a todo"
        />
        <button 
          data-testid="add-todo-button" 
          type="button" 
          onClick={() => {
            addTodo(text);
            setText("");
          }}
        >
          Add
        </button>
        <button 
          data-testid="clear-completed-button" 
          type="button"
          onClick={() => clearCompleted()}
        >
          Clear completed
        </button>
      </div>

      <ul data-testid="todo-list">
        {todos.map((todo) => (
          <li key={todo.id} data-testid="todo-item" data-todo-text={todo.text}>
            <input
              type="checkbox"
              data-testid="todo-checkbox"
              checked={todo.done}
              onChange={() => toggleTodo(todo.id)}
            />
            <span data-testid="todo-text">{todo.text}</span>
            <button
              data-testid="delete-todo-button"
              type="button"
              onClick={() => deleteTodo(todo.id)}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
