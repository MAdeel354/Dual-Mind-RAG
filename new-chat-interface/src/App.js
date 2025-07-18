import { useState, useRef, useEffect } from "react";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [isDeepThinking, setIsDeepThinking] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pdfReference, setPdfReference] = useState(null); // Stores fileId or placeholder
  const fileInputRef = useRef(null);

  const uploadPdf = async (file) => {
    console.log("Uploading PDF:", file.name, file.size, file.type);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("message", "PDF upload");
      console.log("Upload payload: FormData with file", file.name);

      const response = await fetch("http://127.0.0.1:8000/api/upload", {
        method: "POST",
        body: formData,
      });

      console.log("Upload response status:", response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Upload response data:", data);

      return {
        response: data.response || "PDF processed",
        fileId: data.fileId || file.name, // Use fileId or file name
      };
    } catch (error) {
      console.error("Error uploading PDF:", error);
      throw error;
    }
  };

  const sendMessage = async (text, isDeepThinking, fileId) => {
    console.log("Sending message:", { text, isDeepThinking, fileId: fileId ? "File ID present" : "No file ID" });

    try {
      const payload = {
        message: text,
        isDeepThinking,
        fileId: fileId || pdfReference,
      };
      console.log("Message payload:", payload);

      const response = await fetch("http://127.0.0.1:8000/get_document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      // console.log("Message response status:", response.status);
      // if (!response.ok) {
      //   throw new Error(`HTTP error! Status: ${response.status}`);
      // }

      const data = await response.json();
      console.log("Message response data:", data);

      return {
        response: data.message || "No response from AI",
      };
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  };

  // Auto-send PDF on selection
  useEffect(() => {
    if (selectedFile && !pdfReference) {
      const handleAutoUpload = async () => {
        setIsLoading(true);
        const userMessage = {
          id: `msg-${Date.now()}`,
          text: `Uploading file: ${selectedFile.name}`,
          isUser: true,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMessage]);

        try {
          const { response, fileId } = await uploadPdf(selectedFile);
          setPdfReference(fileId);
          const aiMessage = {
            id: `msg-${Date.now() + 1}`,
            text: response,
            isUser: false,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, aiMessage]);
          alert("PDF uploaded and processed!");
        } catch (error) {
          const errorMessage = {
            id: `msg-${Date.now() + 1}`,
            text: `Error: Failed to upload PDF - ${error.message}`,
            isUser: false,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
          alert("Failed to upload PDF. Please try again.");
        } finally {
          setIsLoading(false);
          setSelectedFile(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      };
      handleAutoUpload();
    }
  }, [selectedFile, pdfReference]);

  const handleSendMessage = async () => {
    if (isLoading || !message.trim() || !pdfReference) return;

    const userMessage = {
      id: `msg-${Date.now()}`,
      text: message,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const { response } = await sendMessage(message, isDeepThinking, pdfReference);
      const aiMessage = {
        id: `msg-${Date.now() + 1}`,
        text: response,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      alert("Message sent!");
    } catch (error) {
      const errorMessage = {
        id: `msg-${Date.now() + 1}`,
        text: `Error: Failed to get AI response - ${error.message}`,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
      setMessage("");
      setIsDeepThinking(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setPdfReference(null);
    setSelectedFile(null);
    alert("Chat and PDF cleared!");
    setIsSidebarOpen(false);
  };

  const handleGetPdfs = () => {
    alert("Retrieving PDFs... (simulated action)");
    setIsSidebarOpen(false);
  };

  const handleSubmit = () => {
    handleSendMessage();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== "application/pdf") {
        alert("Please select a PDF file only.");
        if (fileInputRef.current) fileInputRef.current.value = "";
        setSelectedFile(null);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert("File size exceeds 10MB.");
        if (fileInputRef.current) fileInputRef.current.value = "";
        setSelectedFile(null);
        return;
      }
      console.log("File selected:", file.name, file.size, file.type);
      setSelectedFile(file);
      alert(`${file.name} selected for upload.`);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className="app">
      <div className="chat-container">
        {/* Sidebar */}
        <div className={`sidebar ${isSidebarOpen ? "sidebar-open" : ""}`}>
          <div className="sidebar-content">
            <div className="sidebar-menu">
              <button
                className="sidebar-button destructive"
                onClick={handleClearChat}
              >
                <svg className="icon" viewBox="0 0 24 24">
                  <path d="M3 6h18M5 6v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
                Clear Chat
              </button>
              {/* <button className="sidebar-button default" onClick={handleGetPdfs}>
                <svg className="icon" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                  <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                </svg>
                Get PDFs
              </button> */}
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="chat-interface">
          {/* Sidebar Toggle Button */}
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            <svg className="icon" viewBox="0 0 24 24">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* Header */}
          <div className="header">
            <div className="header-content">
              <h1 className="header-title">AI Chatbot Assistant</h1>
              <p className="header-subtitle">
                Upload a PDF and ask questions about it
              </p>
              {/* <button className="clear-button" onClick={handleClearChat}>
                Clear Chat
              </button> */}
            </div>
          </div>

          {/* Messages Area */}
          <div className="messages-area">
            <div className="messages-content">
              {messages.length === 0 && !pdfReference ? (
                <div className="empty-state">
                  <div className="empty-icon">📄</div>
                  <h3 className="empty-title">Upload a PDF to Start</h3>
                  <p className="empty-text">
                    Please upload a PDF file to begin asking questions.
                  </p>
                  <button
                    className="upload-prompt-button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <svg className="icon" viewBox="0 0 24 24">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                    Upload PDF
                  </button>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`message ${msg.isUser ? "user-message" : "ai-message"}`}
                  >
                    <div
                      className={`message-icon ${
                        msg.isUser ? "user-icon" : "ai-icon"
                      }`}
                    >
                      {msg.isUser ? (
                        <svg className="icon" viewBox="0 0 24 24">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      ) : (
                        <svg className="icon" viewBox="0 0 24 24">
                          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                          <line x1="12" y1="19" x2="12" y2="23" />
                          <line x1="8" y1="23" x2="16" y2="23" />
                        </svg>
                      )}
                    </div>
                    <div className="message-content">
                      <div className="message-header">
                        <span className="message-sender">
                          {msg.isUser ? "You" : "AI Assistant"}
                        </span>
                        <span className="message-timestamp">
                          {msg.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="message-text">{msg.text}</p>
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="loading-state">
                  <div className="loading-icon">
                    <div className="spinner"></div>
                  </div>
                  <div className="loading-text">AI is thinking...</div>
                </div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="input-area">
            <div className="input-content">
              <div className="controls">
                <div className="deep-thinking">
                  <input
                    type="checkbox"
                    id="deep-thinking"
                    checked={isDeepThinking}
                    onChange={(e) => setIsDeepThinking(e.target.checked)}
                    disabled={!pdfReference && !selectedFile}
                  />
                  <label htmlFor="deep-thinking">
                    <svg className="brain-icon icon" viewBox="0 0 24 24">
                      <path d="M9.5 3A6.5 6.5 0 0 1 16 9.5c0 2.5-1.5 4.5-3 6M14.5 21a6.5 6.5 0 0 1-6.5-6.5c0-2.5 1.5-4.5 3-6M3 14.5A6.5 6.5 0 0 1 9.5 8c2.5 0 4.5 1.5 6 3M21 9.5A6.5 6.5 0 0 1 14.5 16c-2.5 0-4.5-1.5-6-3" />
                    </svg>
                    Deep Thinking Mode
                  </label>
                </div>
                {selectedFile && (
                  <span className="file-info">📄 {selectedFile.name}</span>
                )}
              </div>
              <div className="input-group">
                <div className="message-input">
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={
                      pdfReference || selectedFile
                        ? "Ask a question about the PDF..."
                        : "Please upload a PDF first"
                    }
                    disabled={isLoading || (!pdfReference && !selectedFile)}
                    required
                  ></textarea>
                </div>
                <div className="buttons">
                  <input
                    type="file"
                    id="file-input"
                    className="file-input"
                    accept=".pdf"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                  />
                  <button
                    className="file-button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                  >
                    <svg className="icon" viewBox="0 0 24 24">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                  </button>
                  <button
                    className="send-button"
                    onClick={handleSubmit}
                    disabled={isLoading || !message.trim() || (!pdfReference && !selectedFile)}
                  >
                    <svg className="icon" viewBox="0 0 24 24">
                      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;