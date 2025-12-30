import { useState, useRef, useEffect } from 'react';
import { Send, X, Minimize2, Maximize2, Sparkles } from 'lucide-react';
import { VarianceRow } from '../types';
import { formatCurrency, formatPercent, calculateSummary } from '../utils/helpers';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  data: VarianceRow[];
}

export default function AIChat({ data }: AIChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Set initial message
  useEffect(() => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: "Hi! I can help you analyze your variance data. Try asking:\n\n• What's the biggest variance?\n• Show me items over budget\n• Summarize the data\n• Which cost center has the most variance?",
        timestamp: new Date(),
      },
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  // Local keyword-based response
  const generateLocalResponse = (question: string): string => {
    const q = question.toLowerCase();
    const summary = calculateSummary(data);
    const overBudget = data.filter(r => r.dollarVariance > 0).sort((a, b) => b.dollarVariance - a.dollarVariance);
    const underBudget = data.filter(r => r.dollarVariance < 0).sort((a, b) => a.dollarVariance - b.dollarVariance);
    const significant = data.filter(r => r.isSignificant);
    
    const costCenterTotals = new Map<string, number>();
    data.forEach(r => {
      if (r.costCenter) {
        costCenterTotals.set(r.costCenter, (costCenterTotals.get(r.costCenter) || 0) + r.dollarVariance);
      }
    });
    const sortedCostCenters = Array.from(costCenterTotals.entries()).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));

    if (q.includes('biggest') || q.includes('largest') || q.includes('top') || q.includes('highest')) {
      if (overBudget.length > 0) {
        const top = overBudget[0];
        return `The biggest variance is **${top.category}** in ${top.costCenter || 'N/A'}, which is ${formatCurrency(top.dollarVariance)} over budget (${formatPercent(top.percentVariance)}).\n\nTop 3 overspends:\n1. ${overBudget[0]?.category}: +${formatCurrency(overBudget[0]?.dollarVariance)}\n2. ${overBudget[1]?.category || 'N/A'}: +${formatCurrency(overBudget[1]?.dollarVariance || 0)}\n3. ${overBudget[2]?.category || 'N/A'}: +${formatCurrency(overBudget[2]?.dollarVariance || 0)}`;
      }
      return "No items are currently over budget.";
    }

    if (q.includes('over budget') || q.includes('overspend')) {
      if (overBudget.length === 0) return "No items are over budget.";
      const topItems = overBudget.slice(0, 5);
      let response = `**${overBudget.length} items** are over budget, totaling ${formatCurrency(overBudget.reduce((sum, r) => sum + r.dollarVariance, 0))}.\n\nTop overspends:\n`;
      topItems.forEach((item, i) => {
        response += `${i + 1}. **${item.category}** (${item.costCenter}): +${formatCurrency(item.dollarVariance)}\n`;
      });
      return response;
    }

    if (q.includes('under budget') || q.includes('savings')) {
      if (underBudget.length === 0) return "No items are under budget.";
      let response = `**${underBudget.length} items** are under budget.\n\nTop savings:\n`;
      underBudget.slice(0, 5).forEach((item, i) => {
        response += `${i + 1}. **${item.category}**: ${formatCurrency(item.dollarVariance)}\n`;
      });
      return response;
    }

    if (q.includes('significant') || q.includes('attention') || q.includes('concern')) {
      if (significant.length === 0) return "No items flagged as significant.";
      let response = `**${significant.length} significant items:**\n\n`;
      significant.slice(0, 5).forEach((item, i) => {
        response += `${i + 1}. **${item.category}**: ${formatCurrency(item.dollarVariance)} (${formatPercent(item.percentVariance)})\n`;
      });
      return response;
    }

    if (q.includes('cost center') || q.includes('department')) {
      let response = `**Cost Center Breakdown:**\n\n`;
      sortedCostCenters.forEach(([cc, variance]) => {
        response += `• **${cc}**: ${formatCurrency(variance)} ${variance > 0 ? '(over)' : '(under)'}\n`;
      });
      return response;
    }

    if (q.includes('summary') || q.includes('overview') || q.includes('total')) {
      return `**Summary:**\n\n• Total Budget: ${formatCurrency(summary.totalBudget)}\n• Total Actual: ${formatCurrency(summary.totalActual)}\n• Net Variance: ${formatCurrency(summary.totalDollarVariance)} (${formatPercent(summary.totalPercentVariance)})\n• Over Budget: ${summary.overBudgetCount} items\n• Significant: ${summary.significantCount} items`;
    }

    return "I can help with:\n• Biggest variances\n• Over/under budget items\n• Significant items\n• Cost center breakdown\n• Summary\n\nTry rephrasing your question!";
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input.trim();
    setInput('');
    setIsTyping(true);

    // Small delay for natural feel
    await new Promise(resolve => setTimeout(resolve, 300));
    const response = generateLocalResponse(userInput);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, assistantMessage]);
    setIsTyping(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 flex items-center gap-2 px-5 py-3 bg-[#1e40af] text-white rounded-full shadow-lg hover:bg-[#1e3a8a] transition-all hover:scale-105 z-50"
      >
        <Sparkles className="w-5 h-5" />
        <span className="font-medium">Ask AI</span>
      </button>
    );
  }

  return (
    <>
      <div className={`fixed bottom-6 right-6 w-96 bg-white dark:bg-[#0F0F12] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#1F1F23] z-50 flex flex-col ${isMinimized ? 'h-14' : 'h-[500px]'} transition-all`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#1F1F23] bg-gradient-to-r from-[#1e40af] to-[#0d9488] rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-white" />
            <span className="font-semibold text-white">AI Assistant</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setIsMinimized(!isMinimized)} className="p-1.5 rounded-lg hover:bg-white/20 text-white">
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
            <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-white/20 text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(message => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-[#1e40af] text-white rounded-br-md'
                      : 'bg-gray-100 dark:bg-[#1F1F23] text-gray-900 dark:text-white rounded-bl-md'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content.replace(/\*\*(.*?)\*\*/g, '$1')}</p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-[#1F1F23] px-4 py-3 rounded-2xl rounded-bl-md">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-[#1F1F23]">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !isTyping && handleSend()}
                  placeholder="Ask anything about your data..."
                  className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-[#1F1F23] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  disabled={isTyping}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="p-2.5 bg-[#1e40af] text-white rounded-xl hover:bg-[#1e3a8a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
