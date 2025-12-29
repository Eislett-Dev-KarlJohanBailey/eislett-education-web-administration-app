import { defineConfig } from "cypress";
// import envConfig from "./src/core/config/env";

export default defineConfig({
  e2e: {
    baseUrl: `http://localhost:${process.env.PORT || 3000}`,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },

  component: {
    devServer: {
      framework: "next",
      bundler: "webpack",
    },
  },
});
