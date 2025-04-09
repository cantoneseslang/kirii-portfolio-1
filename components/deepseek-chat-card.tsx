"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"

// Chat message type definition
interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: number;
  attachments?: {
    name: string;
    url: string;
    type: string;
  }[]
}

// Constants for displaying icons based on attachment type
const FILE_TYPE_ICONS: Record<string, string> = {
  'image': '🖼️',
  'pdf': '📄',
  'doc': '📝',
  'docx': '📝',
  'txt': '📃',
  'other': '📎'
}

// Supported DeepSeek models
// From API documentation: deepseek-chat (V3), deepseek-reasoner (R1)
const DEEPSEEK_MODELS = [
  { id: 'deepseek-chat', name: 'DeepSeek V3 (Default)' },
  { id: 'deepseek-reasoner', name: 'DeepSeek R1 (Reasoner)' },
]

// API configuration
const API_URL = process.env.NEXT_PUBLIC_DEEPSEEK_API_URL || 'https://api.deepseek.com'
const API_KEY = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY

export default function DeepSeekChatCard() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'system',
      content: 'You are a helpful AI assistant. Please answer the user\'s questions concisely and accurately.'
    }
  ])
  const [input, setInput] = useState('')
  const [selectedModel, setSelectedModel] = useState(DEEPSEEK_MODELS[0].id)
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamedResponse, setStreamedResponse] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Scroll to show the latest message
  const scrollToBottom = () => {
    try {
      // Method 1: Directly manipulate the ScrollArea's internal container
      if (scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer instanceof HTMLElement) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
      
      // Method 2: Use messagesEndRef to scroll
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ block: 'end', behavior: 'auto' });
      }
    } catch (e) {
      console.error("Scroll error:", e);
    }
  };

  // Scroll when messages are added or changed
  useEffect(() => {
    scrollToBottom();
    // Slightly delay scrolling again (after rendering completes)
    const timer = setTimeout(scrollToBottom, 300);
    return () => clearTimeout(timer);
  }, [messages, streamedResponse]);

  // File upload handling
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    
    const attachments: {
      name: string;
      url: string;
      type: string;
    }[] = []
    
    setIsLoading(true);
    
    for (const file of Array.from(files)) {
      try {
        // Base64 encoding
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })

        // Determine file type
        let fileType = 'other'
        if (file.type.startsWith('image/')) {
          fileType = 'image'
        } else if (file.type === 'application/pdf') {
          fileType = 'pdf'
        } else if (file.type === 'application/msword' || 
                  file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          fileType = 'doc'
        } else if (file.type === 'text/plain') {
          fileType = 'txt'
        }

        attachments.push({
          name: file.name,
          url: base64,
          type: fileType
        })
      } catch (error) {
        console.error('Error encoding file:', error)
      }
    }

    if (attachments.length > 0) {
      // Add file attachment message
      const attachmentMessage: ChatMessage = {
        role: 'user',
        content: attachments.length === 1 
          ? `Attachment: "${attachments[0].name}"` 
          : `Attached ${attachments.length} files`,
        attachments,
        timestamp: Date.now()
      }
      setMessages(prev => [...prev, attachmentMessage])
      
      // Automatically send API request
      if (attachments.length > 0) {
        sendToDeepSeekAPI(attachmentMessage);
      }
    }
    
    setIsLoading(false);
  }
  
  // Send request to DeepSeek API
  const sendToDeepSeekAPI = async (userMessage: ChatMessage) => {
    if (!API_KEY) return;
    
    try {
      let responseText = '';
      
      try {
        // Prepare messages to send
        const messagesToSend = [
          messages[0], // Always include system message
          ...messages
            .filter(msg => msg.role !== 'system' || msg.role === 'system' && msg !== messages[0])
            .slice(-4), // Only the latest 4 messages
          userMessage
        ];
        
        // Convert messages for API
        const apiMessages = messagesToSend.map(msg => {
          if (msg.attachments && msg.attachments.some(a => a.type === 'image')) {
            // Convert image attachments to text format
            const imageAttachments = msg.attachments.filter(a => a.type === 'image');
            const imageInfo = imageAttachments.map(img => 
              `[Attached image: ${img.name}]`
            ).join('\n');
            
            return {
              role: msg.role,
              content: `${msg.content}\n\n${imageInfo}`
            };
          } else {
            return {
              role: msg.role,
              content: msg.content
            };
          }
        });
        
        console.log("API Request using model:", selectedModel);
        
        // Enable streaming
        setIsStreaming(true);
        setStreamedResponse('');
        
        // Send request through proxy with streaming enabled
        const response = await fetch(`/api/deepseek-proxy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: apiMessages,
            temperature: 0.7,
            max_tokens: 1500,
            stream: true // Enable streaming
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Error:", response.status, errorText);
          throw new Error(`API error ${response.status}: ${errorText}`);
        }
        
        // Handle streaming response
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No reader available for streaming response');
        }
        
        const decoder = new TextDecoder();
        let accumulatedText = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                break;
              }
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices[0]?.delta?.content || '';
                if (content) {
                  accumulatedText += content;
                  setStreamedResponse(accumulatedText);
                }
              } catch (e) {
                console.error('Error parsing streaming chunk:', e);
              }
            }
          }
        }
        
        responseText = accumulatedText;
      } catch (error) {
        console.error("API error:", error);
        const errorMessage = error instanceof Error ? error.message : '不明なエラー';
        responseText = `An error occurred while communicating with the DeepSeek API.\n\nError: ${errorMessage}\n\nPlease check your API key and connection settings.`;
      } finally {
        setIsStreaming(false);
      }
      
      // Add response message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: responseText
      }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'An error occurred. Please try again later.'
      }]);
    } finally {
      setIsLoading(false);
    }
  }

  // Message sending process
  const handleSendMessage = async () => {
    if (!input.trim() || !API_KEY) return;

    setIsLoading(true);
    
    // Find recent image message
    const recentImageMessage = [...messages].reverse().find(
      msg => msg.attachments?.some(a => a.type === 'image')
    );
    
    // Create new message
    const newMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: Date.now()
    };
    
    // Attach recent image if available
    if (recentImageMessage?.attachments) {
      const thirtySecondsAgo = Date.now() - 30000;
      if (recentImageMessage.timestamp && recentImageMessage.timestamp > thirtySecondsAgo) {
        newMessage.attachments = recentImageMessage.attachments.filter(a => a.type === 'image');
      }
    }
    
    setMessages([...messages, newMessage]);
    setInput('');

    // Send API request
    await sendToDeepSeekAPI(newMessage);
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>AI Assistant (DeepSeek)</CardTitle>
          <img 
            src="/images/deepseek-logo.png" 
            alt="DeepSeek Logo" 
            className="h-6 w-auto"
          />
        </div>
        <div className="flex items-center gap-4 mt-2">
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent className="bg-white border shadow-md">
              {DEEPSEEK_MODELS.map(model => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt"
            onChange={(e) => handleFileUpload(e.target.files)}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            Attach File
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea ref={scrollAreaRef} className="h-[400px] mb-4 p-4 border rounded-lg">
          {/* Display all messages except the system message */}
          {messages.filter(msg => msg.role !== 'system' || msg.role === 'system' && msg !== messages[0]).map((message, index) => (
            <div
              key={index}
              className={`mb-4 ${
                message.role === 'assistant' ? 'pl-4 bg-muted/50 rounded p-2' : 'pl-0'
              }`}
            >
              <div className="font-semibold mb-1">
                {message.role === 'assistant' ? 'AI' : 'You'}:
              </div>
              <div className="whitespace-pre-wrap">{message.content}</div>
              {message.attachments && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {message.attachments.map((attachment, i) => (
                    attachment.type === 'image' ? (
                      <img
                        key={i}
                        src={attachment.url}
                        alt={attachment.name}
                        className="max-w-[200px] max-h-[200px] rounded"
                      />
                    ) : (
                      <div key={i} className="flex items-center p-2 bg-muted rounded">
                        <span className="mr-2">{FILE_TYPE_ICONS[attachment.type] || FILE_TYPE_ICONS.other}</span>
                        <span className="text-sm truncate max-w-[150px]">{attachment.name}</span>
                      </div>
                    )
                  ))}
                </div>
              )}
              {index === messages.length - 1 && !isStreaming && <div ref={messagesEndRef} />}
            </div>
          ))}
          {isStreaming && (
            <div className="mb-4 pl-4 bg-muted/50 rounded p-2">
              <div className="font-semibold mb-1">AI:</div>
              <div className="whitespace-pre-wrap">{streamedResponse}</div>
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={messages.some(msg => msg.attachments?.some(a => a.type === 'image')) 
                ? "Enter question (e.g., 'Extract text from this image')" 
                : "Type a message..."}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              disabled={isLoading || isStreaming}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || isStreaming || !input.trim()}
            >
              {isLoading || isStreaming ? 'Processing...' : 'Send'}
            </Button>
          </div>
          <div className="flex justify-end mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMessages([{
                  role: 'system',
                  content: 'You are a helpful AI assistant. Please answer the user\'s questions concisely and accurately.'
                }]);
                setStreamedResponse('');
              }}
            >
              Clear Chat
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
