import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";

export default defineConfig([
  {
    files: ["**/*.js"],
    ignores: [
      "tests/**",
      "comprehensive_audit.spec.js",
      "node_modules/**",
      "dist/**",
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        // Custom globals for the application
        UI: "readonly",
        StorageSystem: "readonly",
        PDFManager: "readonly",
        Dashboard: "readonly",
        NeonSnake: "readonly",
        DomatorApp: "readonly",
        html2canvas: "readonly",
        currentProfile: "writable",
        products: "writable",
        productImages: "writable",
        productIdCounter: "writable",
        draggedWindow: "writable",
        dragOffset: "writable",
        pastedImageData: "writable",
        zIndexCounter: "writable",
        draggedElement: "writable",
        ProductCommand: "readonly",
        DuplicateProductCommand: "readonly",
        UpdateProductImageCommand: "readonly",
        showNotification: "readonly",
        changeWallpaper: "readonly",
        updateProductView: "readonly",
        updateSummary: "readonly",
        updateProductImage: "readonly",
        dragStart: "readonly",
        dragOver: "readonly",
        drop: "readonly",
        removeProduct: "readonly",
        duplicateProduct: "readonly",
        uploadProductImage: "readonly",
      },
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": ["warn", { args: "none" }],
    },
  },
  {
    files: ["tests/**", "comprehensive_audit.spec.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      ecmaVersion: "latest",
      sourceType: "commonjs",
    },
    rules: {},
  },
]);
