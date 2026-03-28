1. Every time you see {2..5} sequential {const,let,var} declarations of the same time, supress the repetition of the keyword and use trailing commas to separate them;
2. Every time you see JSON manipulation OR HTTP requests OR event callbacks that might looks for unstable elements, wrap the procedures in try/catches with minimal error log;
3. Avoid redundant commenting, prefering only commenting for functions/method/classes signatures with technical clarification and JSDocs (no need to repeat data already defined by Typescript if used);
4. Strings used more than once in a file should be stored in a constant, so they more easily editable, preventing unsyncing errors when editing;
5. In contrast, any value used only once should not be saved into a variable, but rather used directly, so we don't waste heap/stack space with cacheing them into variables to give more work to the GC afterwards;
6. When adding listeners, always try using the help of DOMStringMaps such as datasets or DOMTokenLists such as classNames to ensure in a boolean way that we not reapplying unintentionally listeners and causing overhead;
7. Isolate interfaces, types and declares in dedicated {interfaces,types,declares}.d.ts modules to be imported into the concrete implementation modules;
8. Typescript decorators can be considered when procedural preparation of classes/methods/fields can be frequent in the system, but only if a balance of performance gains + code line counting + drying up of the system results in a positive gain;
9. If you see sequences of styles of assingments or methods invokations going in many close lines, consider converting the process into an interative for..of or traditional for loop (depending on the complexity, for performance gains) so we DRY the procedures better;
