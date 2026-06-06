"use client";

import { useState, useCallback } from "react";
import { useStorage, useMutation } from "@liveblocks/react/suspense";
import { LiveObject } from "@liveblocks/client";

export default function Page() {
  const [text, setText] = useState("");

  // Read todos from Liveblocks storage as a plain array
  const todos = useStorage((root) =>
    root.todos.map((todo) => ({
      id: todo.id,
      text: todo.text,
      done: todo.done,
    }))
  );

  // Add a new todo
  const addTodo = useMutation(({ storage }, todoText: string) => {
    const todos = storage.get("todos");
    todos.push(
      new LiveObject({
        id: crypto.randomUUID(),
        text: todoText,
        done: false,
      })
    );
  }, []);

  // Toggle done on a todo by id
  const toggleTodo = useMutation(({ storage }, id: string) => {
    const todos = storage.get("todos");
    for (let i = 0; i < todos.length; i++) {
      const todo = todos.get(i);
      if (todo && todo.get("id") === id) {
        todo.set("done", !todo.get("done"));
        break;
      }
    }
  }, []);

  // Delete a todo by id
  const deleteTodo = useMutation(({ storage }, id: string) => {
    const todos = storage.get("todos");
    for (let i = 0; i < todos.length; i++) {
      const todo = todos.get(i);
      if (todo && todo.get("id") === id) {
        todos.delete(i);
        break;
      }
    }
  }, []);

  // Clear all completed todos in a single batched mutation
  const clearCompleted = useMutation(({ storage }) => {
    const todos = storage.get("todos");
    // Iterate backwards so indices remain valid as we delete
    for (let i = todos.length - 1; i >= 0; i--) {
      const todo = todos.get(i);
      if (todo && todo.get("done") === true) {
        todos.delete(i);
      }
    }
  }, []);

  const handleAdd = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    addTodo(trimmed);
    setText("");
  }, [text, addTodo]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleAdd();
      }
    },
    [handleAdd]
  );

  return (
    <main>
      <h1>Collaborative Todo List</h1>

      <div>
        <input
          data-testid="new-todo-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a todo"
        />
        <button data-testid="add-todo-button" type="button" onClick={handleAdd}>
          Add
        </button>
        <button
          data-testid="clear-completed-button"
          type="button"
          onClick={clearCompleted}
        >
          Clear completed
        </button>
      </div>

      <ul data-testid="todo-list">
        {todos.map((todo) => (
          <li
            key={todo.id}
            data-testid="todo-item"
            data-todo-text={todo.text}
          >
            <input
              data-testid="todo-checkbox"
              type="checkbox"
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
