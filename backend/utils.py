from langchain.prompts import PromptTemplate
from langchain.docstore.document import Document
import logging
from bs4 import BeautifulSoup
import requests
import json
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')


def decide_source(query, llm, decision_prompt):
    response = llm.invoke(decision_prompt.format(query=query))
    return response.strip()

with open('prompts.json', 'r') as file:
    # Load the JSON data from the file
    prompts = json.load(file)

web_prompt_template = prompts.get("web_prompt_template", "")
web_prompt = PromptTemplate(template=web_prompt_template, input_variables=["context", "question"])

def search_web(query, num_results=3):
    try:
        # Use a search engine (e.g., Google via scraping or SerpAPI)
        search_url = f"https://www.google.com/search?q={query}"
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(search_url, headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        # Extract and clean text from search results
        web_content = []
        for result in soup.select("div.g")[:num_results]:
            # Extract main content, avoiding ads or irrelevant sections
            main_content = result.select_one("div.s")
            if main_content:
                text = main_content.get_text(separator=" ", strip=True)
                # Basic cleaning: remove excessive whitespace, boilerplate
                cleaned_text = " ".join(text.split())[:1000]  # Limit length
                if len(cleaned_text) > 50:  # Ignore very short snippets
                    web_content.append(Document(page_content=cleaned_text, metadata={"source": "web", "query": query}))
        logging.info(f"Retrieved {len(web_content)} web results for query: {query}")
        return web_content
    except Exception as e:
        logging.error(f"Web search failed: {e}")
        return []

