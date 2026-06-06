"use client";

import { useState } from "react";
import { LiveObject } from "@liveblocks/client";
import { useStorage, useMutation } from "@liveblocks/react/suspense";

export default function Page() {
  const [text, setText] = useState("");

  // Read todos from Liveblocks Storage
  // useStorage resolves LiveList<LiveObject<T>> to plain readonly arrays of T
  const todos = useStorage((root) => root.todos);

  // Add a new todo
  const addTodo = useMutation(({ storage }, newText: string) => {
    if (!newText.trim()) return;
    const list = storage.get("todos");
    list.push(
      new LiveObject({
        id: crypto.randomUUID(),
        text: newText.trim(),
        done: false,
      })
    );
  }, []);

  // Toggle the done flag on a todo
  const toggleTodo = useMutation(({ storage }, todoId: string) => {
    const list = storage.get("todos");
    for (let i = 0; i < list.length; i++) {
      const item = list.get(i);
      if (item && item.get("id") === todoId) {
        item.set("done", !item.get("done"));
        break;
      }
    }
  }, []);

  // Delete a single todo
  const deleteTodo = useMutation(({ storage }, todoId: string) => {
    const list = storage.get("todos");
    for (let i = 0; i < list.length; i++) {
      const item = list.get(i);
      if (item && item.get("id") === todoId) {
        list.delete(i);
        break;
      }
    }
  }, []);

  // Clear all completed todos in a single batched mutation
  const clearCompleted = useMutation(({ storage }) => {
    const list = storage.get("todos");
    // Iterate backwards to avoid index shifting issues
    for (let i = list.length - 1; i >= 0; i--) {
      const item = list.get(i);
      if (item && item.get("done")) {
        list.delete(i);
      }
    }
  }, []);

  const handleAdd = () => {
    if (!text.trim()) return;
    addTodo(text);
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAdd();
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
        <button data-testid="add-todo-button" type="button" onClick={handleAdd}>
          Add
        </button>
        <button data-testid="clear-completed-button" type="button" onClick={clearCompleted}>
          Clear completed
        </button>
      </div>

      <ul data-testid="todo-list">
        {todos.map((todo) => (
          <li key={todo.id} data-testid="todo-item" data-todo-text={todo.text}>
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