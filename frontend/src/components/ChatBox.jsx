import React, { useState } from 'react';

function ChatBox() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputMessage.trim() !== '') {
      // TODO: Implement sending message to server
      setMessages([...messages, { user: 'You', text: inputMessage }]);
      setInputMessage('');
    }
  };

  return (
    <div className="chat-box">
      <div className="messages">
        {messages.map((message, index) => (
          <div key={index} className="message">
            <strong>{message.user}:</strong> {message.text}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your guess here..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default ChatBox;