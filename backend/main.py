from langchain_community.document_loaders import PDFPlumberLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_ollama import OllamaEmbeddings
from langchain_core.prompts import ChatPromptTemplate, PromptTemplate
from langchain_ollama.llms import OllamaLLM
from flask import Flask, request, jsonify
from loguru import logger
from flask_cors import CORS
import os
from utils import *
import ollama
import json
from loguru import logger

with open('prompts.json', 'r') as prompt_file:
    # Load the JSON data from the file
    prompts = json.load(prompt_file)
    logger.info('prompts loaded')

# Flask constructor takes the name of
# current module (__name__) as argument.
app = Flask(__name__)
CORS(app)  # Allow all origins for testing; restrict in production

template = prompts.get("template", "")
deep_think_prompt = prompts.get("deep_think_prompt", "")
decision_prompt_template = prompts.get("decision_prompt_template", "")

decision_prompt = PromptTemplate(template=decision_prompt_template, input_variables=["query"])
embeddings = OllamaEmbeddings(model='deepseek-r1:1.5b')
vector_store = InMemoryVectorStore(embeddings)

model = OllamaLLM(model='deepseek-r1:1.5b')

def upload_pdf(file):
    with open(".\\"+file.name, "wb") as f:
        f.write(file.getbuffer())

def load_pdf(file_path):
    try:
        loader = PDFPlumberLoader(file_path)
        documents = loader.load()
        return documents
    except Exception as e:
        logger.exception(e)

def split_text(documents):
    try:
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            add_start_index=True
        )
        return text_splitter.split_documents(documents)
    except Exception as e:
        logger.exception(e)

def index_docs(documents):
    try:
        vector_store.add_documents(documents=documents)
    except Exception as e:
        logger.exception(e)

def retrieve_docs(query):
    try:
        return vector_store.similarity_search(query)
    except Exception as e:
        logger.exception(e)

def answer_question(question, documents):
    try:
        context = "\n\n".join([doc.page_content for doc in documents])
        prompt = ChatPromptTemplate.from_template(template)
        chain = prompt | model

        return chain.invoke({"question": question, "context": context})
    except Exception as e:
        logger.exception(e)

@app.route("/api/upload", methods=['POST'])
def get_pdf():
    logger.info("hit")
    try:
        file = request.files['file']
        if 'file' not in request.files:
            return jsonify({"response": "No file provided"}), 400

        if file.filename == '':
            return jsonify({"response": "No file selected"}), 400

        if not file.filename.lower().endswith('.pdf'):
            return jsonify({"response": "Only PDF files are allowed"}), 400


        # Get current script folder
        current_dir = os.path.dirname(os.path.abspath(__file__))
        pdf_path = os.path.join(current_dir, "uploaded_document.pdf")

        # Save the uploaded file
        file.save(pdf_path)

        # Process the PDF
        documents = load_pdf(pdf_path)
        chunked_documents = split_text(documents)
        # print(chunked_documents)
        index_docs(chunked_documents)
        # Generate a fileId (using filename or a unique identifier)
        file_id = os.path.basename(pdf_path)

        return jsonify({
            "response": f"PDF processed: {file.filename}",
            "fileId": 123
        }), 200

    except Exception as e:
        logger.exception(e)
        return jsonify({"response": f"Failed to process PDF: {str(e)}"}), 500

@app.route('/get_document', methods=['POST'])
def get_message():
    data = request.get_json()
    message = data['message']
    deep_think = data['isDeepThinking']
    if deep_think:
        models = ollama.list()
        # deep_think_model_name = models['models'][0]['name']
        deep_think_model = OllamaLLM(model='deepseek-r1:1.5b')

        documents = retrieve_docs(message)
        # Combine document content into context
        context = "\n\n".join([doc.page_content for doc in documents])
        logging.info(f"Processing question: {message} with {len(documents)} documents")

        # Model 1: Generate initial reasoning using the provided template
        initial_prompt = ChatPromptTemplate.from_template(template)
        chain1 = initial_prompt | model
        initial_response = chain1.invoke({"question": message, "context": context})
        logging.info("Model 1 generated initial response")

        # Model 2: Critique and refine using Chain of Thought
        cot_prompt_template = prompts.get("cot_prompt_template", "")

        cot_prompt = ChatPromptTemplate.from_template(cot_prompt_template)
        chain2 = cot_prompt | deep_think_model

        # First round of critique and refinement
        refined_response = chain2.invoke({
            "question": message,
            "context": context,
            "initial_response": initial_response
        })
        logging.info("Model 2 completed first critique and refinement")

        # Optional second round: Model 1 responds to critique
        feedback_prompt_template = prompts.get("feedback_prompt_template", "")
        feedback_prompt = ChatPromptTemplate.from_template(feedback_prompt_template)
        chain3 = feedback_prompt | model

        final_response = chain3.invoke({
            "question": message,
            "context": context,
            "refined_response": refined_response
        })
        logging.info("Model 1 generated final response after critique")
        logger.info(f"message:{final_response}")
        return {"message": final_response}

    elif message:
        # decide source i.e. internet or LLM

        source = decide_source(message, model, prompts.get("decision_prompt_template"))
        if source == "PDF":
            related_documents = retrieve_docs(message)
            answer = answer_question(message, related_documents)
            logger.info(f"answer:{answer}")
        else:
            answer = search_web(query=message, num_results=1)
        logger.info(f"message:{answer}")
        return {"message": answer, "currentModel":[]}
    else:
        return {"message": "No question to be answered"}


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=False)