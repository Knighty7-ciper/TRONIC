import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Play, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';

const TerminalComponent = () => {
  const { commandUpdates } = useSocket();
  
  const [currentCommand, setCurrentCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [terminalOutput, setTerminalOutput] = useState([
    {
      type: 'system',
      content: 'Cyber-AI Terminal v2.1.0 - Secure Command Interface',
      timestamp: new Date().toISOString(),
    },
    {
      type: 'system',
      content: 'Connected to cyberpunk systems. Type "help" for available commands.',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  
  const terminalRef = useRef(null);
  const inputRef = useRef(null);

  // Load command history
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await apiService.commands.getHistory(50);
        setHistory(response.data.commands || []);
      } catch (error) {
        console.error('Failed to load command history:', error);
      }
    };
    loadHistory();
  }, []);

  // Process command updates from socket
  useEffect(() => {
    if (commandUpdates.length > 0) {
      const latestUpdate = commandUpdates[commandUpdates.length - 1];
      addOutput({
        type: latestUpdate.status === 'completed' ? 'success' : 'error',
        content: `$ ${latestUpdate.command}\n${latestUpdate.output}`,
        timestamp: new Date().toISOString(),
      });
    }
  }, [commandUpdates]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalOutput]);

  const addOutput = (output) => {
    setTerminalOutput(prev => [...prev, output]);
  };

  const executeCommand = async (command) => {
    if (!command.trim() || loading) return;

    const trimmedCommand = command.trim();
    
    // Add command to output
    addOutput({
      type: 'input',
      content: `$ ${trimmedCommand}`,
      timestamp: new Date().toISOString(),
    });

    // Add to history
    setCommandHistory(prev => [...prev, trimmedCommand]);
    setHistoryIndex(-1);

    try {
      setLoading(true);
      
      // Execute command via API
      const response = await apiService.commands.execute({
        command: trimmedCommand,
        cwd: process.cwd(),
      });

      if (response.data.success) {
        addOutput({
          type: 'system',
          content: 'Command submitted for execution...',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Command execution failed:', error);
      
      addOutput({
        type: 'error',
        content: `Error: ${error.response?.data?.error || 'Command execution failed'}`,
        timestamp: new Date().toISOString(),
      });
      
      toast.error('Command execution failed');
    } finally {
      setLoading(false);
      setCurrentCommand('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand(currentCommand);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCurrentCommand('');
        } else {
          setHistoryIndex(newIndex);
          setCurrentCommand(commandHistory[newIndex]);
        }
      }
    }
  };

  const handleClear = () => {
    setTerminalOutput([
      {
        type: 'system',
        content: 'Terminal cleared',
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const handleHelp = () => {
    const helpContent = `
Available Commands:
  ls          - List directory contents
  pwd         - Print working directory
  whoami      - Display current user
  date        - Show current date and time
  uptime      - Show system uptime
  ps          - Show running processes
  df          - Show disk usage
  free        - Show memory usage
  cat         - Display file contents
  head        - Show first lines of file
  tail        - Show last lines of file
  grep        - Search text patterns
  find        - Search for files
  echo        - Display text
  env         - Show environment variables
  clear       - Clear terminal
  help        - Show this help message

Security Notice: Only read-only commands are permitted for security.
    `;
    
    addOutput({
      type: 'help',
      content: helpContent.trim(),
      timestamp: new Date().toISOString(),
    });
  };

  const getOutputColor = (type) => {
    switch (type) {
      case 'error':
        return 'text-red-400';
      case 'success':
        return 'text-green-400';
      case 'warning':
        return 'text-yellow-400';
      case 'input':
        return 'text-cyber-red';
      case 'help':
        return 'text-blue-400';
      default:
        return 'text-gray-300';
    }
  };

  const getOutputIcon = (type) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'input':
        return <Terminal className="w-4 h-4 text-cyber-red" />;
      default:
        return null;
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Terminal Header */}
      <div className="cyber-panel mb-6">
        <div className="cyber-panel-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Terminal className="w-5 h-5 text-cyber-red" />
              <span className="font-semibold">CYBER TERMINAL</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-gray-400">SECURE</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleClear}
                className="text-xs text-gray-400 hover:text-cyber-red transition-colors"
              >
                Clear
              </button>
              <button
                onClick={handleHelp}
                className="text-xs text-gray-400 hover:text-cyber-red transition-colors"
              >
                Help
              </button>
              <div className="text-xs text-gray-400">
                {commandHistory.length} commands
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Output */}
      <div 
        ref={terminalRef}
        className="flex-1 cyber-terminal overflow-y-auto mb-4"
        style={{ height: 'calc(100vh - 16rem)' }}
      >
        <div className="space-y-2">
          {terminalOutput.map((output, index) => (
            <div key={index} className="flex items-start space-x-2">
              <div className="flex-shrink-0 mt-1">
                {getOutputIcon(output.type)}
              </div>
              <div className={`flex-1 font-cyber text-sm ${getOutputColor(output.type)}`}>
                <pre className="whitespace-pre-wrap break-words">
                  {output.content}
                </pre>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-cyber-red rounded-full animate-pulse" />
              <span className="text-cyber-red font-cyber text-sm">
                Executing command...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Terminal Input */}
      <div className="cyber-panel">
        <div className="p-4">
          <div className="flex items-center space-x-4">
            <span className="text-cyber-red font-cyber">cyber@terminal:~$</span>
            <input
              ref={inputRef}
              type="text"
              value={currentCommand}
              onChange={(e) => setCurrentCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-cyber-white font-cyber"
              placeholder="Enter command..."
              disabled={loading}
              autoFocus
            />
            <button
              onClick={() => executeCommand(currentCommand)}
              disabled={!currentCommand.trim() || loading}
              className={`
                px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2
                ${currentCommand.trim() && !loading
                  ? 'bg-cyber-red text-white hover:bg-red-700'
                  : 'bg-cyber-gray text-gray-500 cursor-not-allowed'
                }
              `}
            >
              <Play className="w-4 h-4" />
              <span>Execute</span>
            </button>
          </div>
          
          {/* Command History Navigation */}
          {commandHistory.length > 0 && (
            <div className="mt-2 text-xs text-gray-400">
              Use ↑↓ arrows to navigate command history ({commandHistory.length} commands)
            </div>
          )}
        </div>
      </div>

      {/* Security Notice */}
      <div className="mt-4 cyber-panel p-4">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-medium text-yellow-400">Security Notice</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Only read-only commands are permitted for security. All commands are logged and monitored.
        </p>
      </div>
    </div>
  );
};

export default TerminalComponent;