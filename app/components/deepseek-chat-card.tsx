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
  attachments?: {
    name: string;
    url: string;
    type: string;
  }[] // Array of attachment information
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

// Latest DeepSeek model versions - only include officially supported ones
const DEEPSEEK_MODELS = [
  { id: 'deepseek-chat', name: 'DeepSeek V3 (Default)' },
  { id: 'deepseek-reasoner', name: 'DeepSeek R1 (Reasoner)' }
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

  // Scroll to show the latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Auto-scroll when messages are added
  useEffect(() => {
    scrollToBottom()
  }, [messages, streamedResponse])

  // File upload handling
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    
    const attachments: {
      name: string;
      url: string;
      type: string;
    }[] = []

    for (const file of Array.from(files)) {
      try {
        // File size check (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large. Maximum size is 10MB.`)
        }

        // Processing for image files
        if (file.type.startsWith('image/')) {
          // Image compression and resizing
          const img = new Image()
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
            img.src = URL.createObjectURL(file)
          })

          // Limit maximum size to 2048px
          let width = img.width
          let height = img.height
          const maxSize = 2048
          
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = Math.round((height * maxSize) / width)
              width = maxSize
            } else {
              width = Math.round((width * maxSize) / height)
              height = maxSize
            }
          }

          canvas.width = width
          canvas.height = height
          ctx?.drawImage(img, 0, 0, width, height)
          
          // Get compressed image data
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8)
          
          attachments.push({
            name: file.name,
            url: compressedBase64,
            type: 'image'
          })
        } else {
          // Processing for other file types
          const reader = new FileReader()
          const base64 = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string)
            reader.readAsDataURL(file)
          })

          let fileType = 'other'
          if (file.type === 'application/pdf') {
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
        }
      } catch (error) {
        console.error('Error processing file:', error)
        // Display error message
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `An error occurred while processing file "${file.name}": ${error}`
        }])
        continue
      }
    }

    if (attachments.length > 0) {
      const newMessage: ChatMessage = {
        role: 'user',
        content: attachments.length === 1 
          ? `Attached file "${attachments[0].name}"` 
          : `Attached ${attachments.length} files`,
        attachments
      }
      setMessages(prev => [...prev, newMessage])
    }
  }

  // Message sending process
  const handleSendMessage = async () => {
    if (!input.trim() || !API_KEY) return

    setIsLoading(true)
    const newMessage: ChatMessage = {
      role: 'user',
      content: input
    }
    setMessages([...messages, newMessage])
    setInput('')

    try {
      // Get the last attachment from message history
      const lastAttachment = [...messages].reverse().find(msg => msg.attachments)?.attachments?.[0]
      
      const requestBody: any = {
        model: selectedModel,
        messages: [...messages, newMessage]
          .filter(msg => msg.role !== 'system' || msg === messages[0])
          .map(msg => {
            // Define DeepSeek API message type
            type ContentItem = {
              type: string;
              text?: string;
              image_url?: { url: string; detail: string };
            };
            
            type DeepSeekMessage = {
              role: string;
              content: string | ContentItem[];
            };
            
            // Comply with officially supported format
            let messageContent: DeepSeekMessage;
            
            // Send in array format if there are image attachments
            if (msg.attachments && msg.attachments.some(a => a.type === 'image')) {
              const contentItems: ContentItem[] = [{ type: 'text', text: msg.content }];
              
              msg.attachments.forEach(attachment => {
                if (attachment.type === 'image') {
                  contentItems.push({
                    type: 'image_url',
                    image_url: {
                      url: attachment.url,
                      detail: 'auto'
                    }
                  });
                }
              });
              
              messageContent = {
                role: msg.role,
                content: contentItems
              };
            } else {
              // Use regular string format if no images
              messageContent = {
                role: msg.role,
                content: msg.content
              };
            }

            return messageContent
          }),
        temperature: 0.7,
        max_tokens: 2000,
        stream: false
      }

      console.log('API URL:', API_URL);
      console.log('API KEY:', API_KEY ? 'API Key exists' : 'API Key missing');
      console.log('Request Body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'Origin': window.location.origin
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `API error: ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage += ` - ${JSON.stringify(errorData)}`;
        } catch (e) {
          errorMessage += ` - ${errorText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json()
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.choices[0].message.content
      }])
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
          content: `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
      }])
    } finally {
      setIsLoading(false)
    }
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
            <SelectContent>
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
        <ScrollArea className="h-[400px] mb-4 p-4 border rounded-lg">
          {/* Hide system message, display other messages */}
          {messages.filter(msg => msg.role !== 'system').map((message, index) => (
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
              {/* Add reference at the end of message */}
              {index === messages.length - 1 && !isStreaming && <div ref={messagesEndRef} />}
            </div>
          ))}
          {/* Display response during streaming */}
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
              placeholder="Type a message..."
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
