// `import x from "./file.css" with { type: "text" }` — Bun inlines the file as a string.
declare module "*.css" {
  const text: string;
  export default text;
}
