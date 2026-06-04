Complex nested collaborative state requires specialized data structures like `LiveList` and `LiveObject` to handle simultaneous edits without data corruption.

You need to implement a shared Todo list where multiple users can concurrently add, toggle the completion status of, and delete items. 

**Constraints:**
- The storage structure must be defined as a `LiveList` containing `LiveObject` items for each todo.
- Provide functions to push a new `LiveObject` to the list, update a specific object's `completed` property, and delete an item by index.
- All state modifications must be executed within the `useMutation` hook.