"use client";

import { useState } from "react";
import { useStorage, useMutation } from "@liveblocks/react/suspense";
import { LiveObject } from "@liveblocks/client";

export default function Page() {
  const [text, setText] = useState("");
  const todos = useStorage((root) => root.todos);

  const addTodo = useMutation(({ storage }, text: string) => {
    if (!text.trim()) return;
    storage.get("todos").push(
      new LiveObject({
        id: crypto.randomUUID(),
        text: text.trim(),
        done: false,
      })
    );
  }, []);

  const toggleTodo = useMutation(({ storage }, index: number) => {
    const todo = storage.get("todos").get(index);
    if (todo) {
      todo.set("done", !todo.get("done"));
    }
  }, []);

  const deleteTodo = useMutation(({ storage }, index: number) => {
    storage.get("todos").delete(index);
  }, []);

  const clearCompleted = useMutation(({ storage }) => {
    const todos = storage.get("todos");
    let i = todos.length;
    while (i--) {
      if (todos.get(i)?.get("done")) {
        todos.delete(i);
      }
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addTodo(text);
      setText("");
    }
  };

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
        <button
          data-testid="add-todo-button"
          onClick={() => {
            addTodo(text);
            setText("");
          }}
          type="button"
        >
          Add
        </button>
        <button
          data-testid="clear-completed-button"
          onClick={() => clearCompleted()}
          type="button"
        >
          Clear completed
        </button>
      </div>

      <ul data-testid="todo-list">
        {todos.map((todo, index) => (
          <li
            key={todo.id}
            data-testid="todo-item"
            data-todo-text={todo.text}
          >
            <input
              type="checkbox"
              data-testid="todo-checkbox"
              checked={todo.done}
              onChange={() => toggleTodo(index)}
            />
            <span data-testid="todo-text">{todo.text}</span>
            <button
              data-testid="delete-todo-button"
              onClick={() => deleteTodo(index)}
              type="button"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
