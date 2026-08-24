const { defineConfig } = require("cypress");

module.exports = defineConfig({
  projectId: "pzgdmc",
  e2e: {
    // Aponta para um servidor estático local servindo a pasta tic-tac-toe/.
    // Veja o README.md desta pasta para como subir esse servidor antes de rodar os testes.
    baseUrl: "http://localhost:8080",
    supportFile: false,
  },
});
