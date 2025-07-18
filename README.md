# 🔍 DeepThink-RAG: Dynamic Retrieval-Augmented Generation with Source-Aware Reasoning

**DeepThink-RAG** is a modular Retrieval-Augmented Generation (RAG) framework designed to intelligently select between local PDF documents and web search as sources of truth. The system includes a unique **Deep Think** module that leverages a critic model to evaluate and refine generated responses, enabling multi-stage, self-reflective reasoning for higher accuracy and reliability.

---

## ✨ Features

- 📄 **Dual-Source Retrieval**  
  Automatically chooses between querying **local PDF documents** or **internet sources** based on the context of the question.

- 🧠 **Deep Think Module**  
  Refines initial responses through an internal critic that analyzes and improves the output, simulating human-like double-checking.

- 🧭 **Source-Aware Decision Making**  
  Dynamically routes questions to the most relevant source (PDF or web) using lightweight classification or prompt-based control logic.

- 🧰 **Modular Design**  
  Easily plug and play your own retrievers, LLMs, or refinement models.

- 📚 **PDF Parsing & Indexing**  
  Efficient semantic chunking and vector indexing for fast and accurate PDF-based retrieval.

- 🌐 **Web-Integrated Search**  
  Seamlessly fetches answers from the internet when local information is insufficient.

---

## 🛠 Use Cases

- Academic research assistants  
- Document-driven customer support bots  
- Legal, medical, or enterprise RAG systems with structured PDFs  
- Self-refining agents for knowledge-grounded responses

---

## 🚀 Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/deepthink-rag.git
   cd deepthink-rag
