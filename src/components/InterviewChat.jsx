import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { analyzeNeedForFollowUp, generateFollowUpQuestion, getMaxFollowUps } from '../engine/FollowUpEngine';
import { scoreAnswerAuthenticity } from '../engine/AuthenticityScorer';

/**
 * Interview Chat Component
 * AI-powered interview chat interface with Creda styling
 */
export default function InterviewChat({
  questions,
  onComplete,
  skillMapping,
  jobDescription,
  timePerAnswer = 180,
  aiSuggestedQuestions = []
}) {
  const [messages, setMessages] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(timePerAnswer);
  const [trustScore, setTrustScore] = useState(92);
  const [qaPairs, setQaPairs] = useState([]);
  const [followUpCount, setFollowUpCount] = useState({});
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [usedAISuggestions, setUsedAISuggestions] = useState(new Set());
  const [showSuggestions, setShowSuggestions] = useState(false);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const messageIdCounter = useRef(0);
  const isInitialized = useRef(false); // Prevent double initialization

  // Generate unique message ID
  const getUniqueId = () => {
    messageIdCounter.current += 1;
    return `msg-${Date.now()}-${messageIdCounter.current}`;
  };

  // Initialize with first question - only once
  useEffect(() => {
    if (questions.length > 0 && !isInitialized.current) {
      isInitialized.current = true;

      // Add date separator immediately
      setMessages([{
        id: getUniqueId(),
        type: 'system',
        text: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date(),
      }]);

      // Add intro message after short delay
      setTimeout(() => {
        addAIMessage(
          `Hello! I'm Creda AI conducting your ${jobDescription?.title || 'technical'} assessment. Let's begin.`,
          'intro'
        );

        // Add first question quickly
        setTimeout(() => {
          addQuestionMessage(questions[0]);
        }, 600);
      }, 300);
    }
  }, [questions.length]); // Only depend on length, not the array itself


  // Timer effect
  useEffect(() => {
    if (interviewComplete || isTyping) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleTimeUp();
          return timePerAnswer;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestionIndex, interviewComplete, isTyping]);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const _addSystemMessage = (text) => {
    setMessages(prev => [...prev, {
      id: getUniqueId(),
      type: 'system',
      text,
      timestamp: new Date(),
    }]);
  };

  const addAIMessage = (text, subtype = 'info') => {
    setMessages(prev => [...prev, {
      id: getUniqueId(),
      type: 'ai',
      subtype,
      text,
      timestamp: new Date(),
    }]);
  };

  const addQuestionMessage = (question) => {
    setMessages(prev => [...prev, {
      id: getUniqueId(),
      type: 'ai',
      subtype: 'question',
      text: question.text,
      question,
      timestamp: new Date(),
    }]);
    setTimeRemaining(timePerAnswer);
  };

  const addUserMessage = (text) => {
    setMessages(prev => [...prev, {
      id: getUniqueId(),
      type: 'user',
      text,
      timestamp: new Date(),
    }]);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping || interviewComplete) return;

    const answer = inputValue.trim();
    setInputValue('');
    addUserMessage(answer);
    processAnswer(answer);
  };

  const processAnswer = async (answer) => {
    setIsTyping(true);

    try {
      const currentQuestion = questions[currentQuestionIndex];

      if (!currentQuestion) {
        console.error('No current question found at index:', currentQuestionIndex);
        setIsTyping(false);
        return;
      }

      // Score authenticity
      const authScore = scoreAnswerAuthenticity(answer, currentQuestion);

      // Update trust score
      const newTrustScore = Math.round((trustScore * 0.7) + (authScore.score * 0.3));
      setTrustScore(Math.max(0, Math.min(100, newTrustScore)));

      // Store Q&A pair
      const qaPair = {
        question: currentQuestion,
        answer,
        authenticity: authScore,
        timeSpent: timePerAnswer - timeRemaining,
      };
      setQaPairs(prev => [...prev, qaPair]);

      // Brief AI thinking delay (fast response)
      await new Promise(resolve => setTimeout(resolve, 300));

      // Check for follow-up need
      const questionId = currentQuestion.id;
      const currentFollowUps = followUpCount[questionId] || 0;
      const maxFollowUps = getMaxFollowUps(currentQuestion);

      const followUpAnalysis = analyzeNeedForFollowUp(answer, currentQuestion);

      if (followUpAnalysis.needsFollowUp && currentFollowUps < maxFollowUps) {
        // Generate follow-up
        const followUp = generateFollowUpQuestion(followUpAnalysis, currentQuestion, answer);
        setFollowUpCount(prev => ({ ...prev, [questionId]: currentFollowUps + 1 }));

        // FIX: followUp.text not followUp.question.text
        addAIMessage(followUp.text, 'followup');
        setIsTyping(false);
        return;
      }

      // Move to next question
      const nextIndex = currentQuestionIndex + 1;
      console.log('Moving to question', nextIndex, 'of', questions.length);

      if (nextIndex >= questions.length) {
        // Interview complete
        addAIMessage(
          "Thank you! Assessment complete. Analyzing your results...",
          'closing'
        );
        setInterviewComplete(true);
        setIsTyping(false);

        // Pass the updated qaPairs including current answer
        const allQaPairs = [...qaPairs, qaPair];
        setTimeout(() => {
          onComplete(allQaPairs);
        }, 1000);
      } else {
        // Quick transition to next question
        setCurrentQuestionIndex(nextIndex);
        addQuestionMessage(questions[nextIndex]);
        setIsTyping(false);
      }
    } catch (error) {
      console.error('Error processing answer:', error);
      setIsTyping(false);
      // Try to continue to next question on error
      const nextIndex = currentQuestionIndex + 1;
      if (nextIndex < questions.length) {
        setCurrentQuestionIndex(nextIndex);
        addQuestionMessage(questions[nextIndex]);
      }
    }
  };

  const handleTimeUp = () => {
    if (inputValue.trim()) {
      addUserMessage(inputValue.trim());
      processAnswer(inputValue.trim());
      setInputValue('');
    } else {
      addUserMessage('[No response provided]');
      processAnswer('[No response provided]');
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    // Anti-paste protection
  };

  const handleEndInterview = () => {
    setInterviewComplete(true);
    onComplete(qaPairs);
  };

  const totalQuestions = questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[600px] -mx-4 md:-mx-8 lg:-mx-12 -mt-4 md:-mt-8 lg:-mt-12">
      {/* Header */}
      <header className="flex-shrink-0 h-20 px-6 lg:px-10 flex items-center justify-between border-b border-white/10 bg-background-dark/80 backdrop-blur-md z-10">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <span className="text-primary text-sm font-bold tracking-wider uppercase">
              Step {currentQuestionIndex + 1} of {totalQuestions}
            </span>
            <span className="w-1 h-1 rounded-full bg-gray-600" />
            <span className="text-text-muted text-sm">Technical Assessment</span>
          </div>
          <div className="w-64 h-1.5 bg-card-dark rounded-full mt-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-yellow-600 rounded-full"
              style={{ boxShadow: '0 0 10px rgba(234,179,8,0.5)' }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Trust Score Widget */}
          <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-full glass-panel border-primary/20 shadow-glow-primary">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">verified_user</span>
              <span className="text-xs text-text-muted uppercase tracking-wide">Trust Score</span>
            </div>
            <div className="w-px h-4 bg-gray-700" />
            <span className="text-white font-bold text-lg">{trustScore}%</span>
            <span className={`flex h-2 w-2 rounded-full ${trustScore >= 70 ? 'bg-verified' : trustScore >= 50 ? 'bg-primary' : 'bg-flagged'} animate-pulse`}
              style={{ boxShadow: `0 0 8px ${trustScore >= 70 ? 'rgba(34,197,94,0.6)' : trustScore >= 50 ? 'rgba(234,179,8,0.6)' : 'rgba(239,68,68,0.6)'}` }}
            />
          </div>

          {/* Timer */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${timeRemaining <= 30 ? 'bg-flagged/10 border border-flagged/20' : 'bg-white/5 border border-white/10'}`}>
            <span className={`material-symbols-outlined text-[20px] ${timeRemaining <= 30 ? 'text-flagged' : 'text-text-muted'}`}>timer</span>
            <span className={`font-mono font-bold ${timeRemaining <= 30 ? 'text-flagged' : 'text-white'}`}>
              {formatTime(timeRemaining)}
            </span>
          </div>

          <Button variant="danger" size="sm" onClick={handleEndInterview}>
            End Interview
          </Button>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-6 lg:px-20 py-8 space-y-6 scrollbar-thin">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {message.type === 'system' && (
                <div className="flex justify-center">
                  <span className="text-xs font-medium text-gray-600 bg-obsidian-light px-3 py-1 rounded-full border border-white/5">
                    {message.text}
                  </span>
                </div>
              )}

              {message.type === 'ai' && (
                <div className="flex gap-4 max-w-4xl">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-obsidian-light to-black border border-primary/40 flex items-center justify-center shadow-lg relative">
                      <span className="material-symbols-outlined text-primary">smart_toy</span>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-verified border-2 border-background-dark rounded-full" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-bold text-primary">Creda AI</span>
                      <span className="text-xs text-gray-500">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="chat-bubble-ai">
                      <p className="whitespace-pre-wrap">{message.text}</p>
                    </div>
                    {message.subtype === 'question' && (
                      <div className="flex items-center gap-2 mt-1 ml-1 animate-pulse">
                        <span className="material-symbols-outlined text-primary text-[16px]">hourglass_top</span>
                        <span className="text-xs text-primary font-mono font-medium">
                          {formatTime(timeRemaining)} remaining for this question
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {message.type === 'user' && (
                <div className="flex gap-4 flex-row-reverse max-w-4xl ml-auto">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-xs font-bold text-white border border-gray-600 shadow-lg">
                      You
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-gray-500">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-sm font-bold text-white">You</span>
                    </div>
                    <div className="chat-bubble-user">
                      <p className="whitespace-pre-wrap">{message.text}</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4 max-w-4xl"
          >
            <div className="flex-shrink-0 mt-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-obsidian-light to-black border border-primary/40 flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-primary">smart_toy</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-bold text-primary">Creda AI</span>
              </div>
              <div className="glass-panel px-5 py-4 rounded-2xl rounded-tl-none border border-primary/10 w-fit">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-primary rounded-full typing-dot" />
                  <div className="w-2 h-2 bg-primary rounded-full typing-dot" />
                  <div className="w-2 h-2 bg-primary rounded-full typing-dot" />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={chatEndRef} className="h-32" />
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 w-full px-6 lg:px-20 pb-8 pt-4 bg-gradient-to-t from-background-dark via-background-dark to-transparent z-20">
        <div className="max-w-4xl mx-auto relative">
          {/* AI Suggested Questions Panel */}
          {aiSuggestedQuestions.length > 0 && !interviewComplete && (
            <div className="mb-4">
              <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="flex items-center gap-2 text-xs text-primary/80 hover:text-primary transition-colors mb-2"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {showSuggestions ? 'expand_less' : 'psychology'}
                </span>
                <span>
                  {showSuggestions ? 'Hide AI Probes' : `AI Probes Available (${aiSuggestedQuestions.filter(q => !usedAISuggestions.has(q)).length})`}
                </span>
              </button>

              <AnimatePresence>
                {showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="glass-panel border border-primary/20 rounded-xl p-4 mb-3">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-primary text-[18px]">auto_awesome</span>
                        <span className="text-xs font-semibold text-white/90">AI-Suggested Probing Questions</span>
                        <Badge variant="ai" className="text-[10px] py-0.5">BETA</Badge>
                      </div>
                      <p className="text-[11px] text-gray-400 mb-3">
                        These questions target weak areas identified in the candidate's resume. Click to use as your next response.
                      </p>
                      <div className="space-y-2">
                        {aiSuggestedQuestions
                          .filter(q => !usedAISuggestions.has(q))
                          .slice(0, 3)
                          .map((question, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setInputValue(question);
                                setUsedAISuggestions(prev => new Set([...prev, question]));
                                setShowSuggestions(false);
                                inputRef.current?.focus();
                              }}
                              className="w-full text-left px-3 py-2.5 rounded-lg bg-obsidian-light/50 border border-gray-700/50 hover:border-primary/40 hover:bg-primary/5 transition-all group"
                            >
                              <div className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-primary/60 text-[16px] mt-0.5 group-hover:text-primary">arrow_forward</span>
                                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{question}</span>
                              </div>
                            </button>
                          ))}
                      </div>
                      {aiSuggestedQuestions.filter(q => !usedAISuggestions.has(q)).length === 0 && (
                        <p className="text-xs text-gray-500 italic">All suggested probes have been used.</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Anti-paste warning */}
          <div className="absolute -top-10 left-4 flex items-center gap-2 text-xs text-primary bg-primary/10 px-3 py-1.5 rounded-md border border-primary/20 opacity-80">
            <span className="material-symbols-outlined text-[14px]">content_paste_off</span>
            Anti-paste protection active
          </div>

          <form onSubmit={handleSubmit}>
            <div className="relative flex items-end gap-2 bg-obsidian-light border border-gray-700 rounded-2xl p-2 shadow-2xl transition-all duration-200 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30">

              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onPaste={handlePaste}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Type your answer here..."
                rows={1}
                disabled={isTyping || interviewComplete}
                className="w-full bg-transparent border-none text-white placeholder-gray-500 focus:ring-0 resize-none py-3 max-h-40 min-h-[56px] scrollbar-hide"
                style={{ height: 'auto' }}
                onInput={(e) => {
                  e.target.style.height = '';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
              />

              <button
                type="submit"
                disabled={!inputValue.trim() || isTyping || interviewComplete}
                className="p-3 bg-primary text-black rounded-xl hover:bg-yellow-500 transition-all flex-shrink-0 self-end mb-1 shadow-lg hover:shadow-yellow-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined font-bold">arrow_upward</span>
              </button>
            </div>
          </form>

          <div className="text-center mt-3">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest">
              Press Enter to send • Shift + Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
