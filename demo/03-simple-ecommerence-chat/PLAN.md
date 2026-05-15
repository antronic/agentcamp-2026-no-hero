In this sample for handson lab, we demonstrate a simple e-commerce (ZStore) chatbot that can answer questions about products, place orders, sales report, and inventory report. The chatbot uses a language model to understand user queries and interact with a mock product database.

- Chatbot name is "Agent Smith", a friendly and knowledgeable assistant for ZStore customers.
- The chatbot can handle various types of queries, including product information, order placement, sales reports, and inventory reports.

## Prepared content in this demo
- Sample product data for ZStore, including product names, descriptions, prices, sales data, and inventory data.
- Web Interface for back office users to interact with the chatbot, ask questions, and receive responses.
- API endpoints for handling chatbot interactions and processing user queries.


## Tech Stack
| Tool | Purpose |
|---|---|
| **TypeScript** | Language |
| **Bun** | Runtime & package manager |
| **Azure OpenAI** | LLM provider for chatbot responses |
| **MongoDB Atlas** | Database for storing product information, sales data, and inventory data, Vector Search |
| **Microsoft Foundry Agent Services** | Agent orchestration, tool management, and LLM interactions |
| **React** | Frontend library for building the web interface |
| **Shadcn UI** | Component library for building the user interface |
| **Vite + Rolldown** | Build tools for the frontend application |

## UI
- A simple web interface that allows users to interact with the chatbot, ask questions about products, place orders, and view sales and inventory reports.
- All component must be built using Shadcn UI components, ensuring a consistent and modern design.
- Theme should be set to "dark" mode to provide a sleek and visually appealing user experience. With orange and white as the primary colors for accents and highlights.
- The interface should be responsive and user-friendly, allowing users to easily navigate and interact with the chatbot on various devices.
- There should have mocked Dashboard, Product List, Order Placement, Sales Report, and Inventory Report pages to demonstrate the chatbot's capabilities in handling different types of queries and interactions.

## Code Structure
- The codebase is organized into two main directories: `api/` for backend API endpoints and `ui/` for the frontend React application.
- All code must provided detailed comments explaining the purpose and functionality of each section, making it easy for developers to understand and modify the code as needed.
  - Easy to follow comments will guide developers through the logic of handling user queries, interacting with the database, and generating responses using the language model.

## Readme Content
- The README file should provide a clear and concise overview of the project, including the purpose of the chatbot, the technologies used, and instructions for setting up and running the application.
- It should also include examples of how to interact with the chatbot and demonstrate its capabilities in handling various types of queries related to products, orders, sales, and inventory.
- Clearly explain the code structure and provide guidance on how to modify and extend the chatbot's functionality, allowing developers to easily customize it for their own use cases. Which files to edit for adding new features, how to register new tools, and how to integrate with different LLM providers if needed.
- Step-by-step instructions for setting up the development environment, installing dependencies, and running the application should be included to ensure that developers can quickly get started with the project.