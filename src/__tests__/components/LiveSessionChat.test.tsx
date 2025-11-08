import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LiveSessionChat } from '../../components/LiveSessionChat';
import { useLiveSession } from '../../hooks/useSocket';

// Mock the useLiveSession hook
jest.mock('../../hooks/useSocket', () => ({
  useLiveSession: jest.fn(),
}));

const mockUseLiveSession = useLiveSession as jest.MockedFunction<typeof useLiveSession>;

describe('LiveSessionChat', () => {
  const mockProps = {
    sessionId: 'session-123',
    userRole: 'student' as const,
    userId: 'user-123',
    userName: 'John Doe',
  };

  const mockMessages = [
    {
      id: '1',
      userId: 'user-456',
      userName: 'Jane Smith',
      userRole: 'mentor',
      message: 'Welcome to the session!',
      messageType: 'text' as const,
      timestamp: new Date('2024-01-01T10:00:00Z'),
    },
    {
      id: '2',
      userId: 'user-123',
      userName: 'John Doe',
      userRole: 'student',
      message: 'Thank you!',
      messageType: 'text' as const,
      timestamp: new Date('2024-01-01T10:01:00Z'),
    },
  ];

  const mockQAs = [
    {
      id: '1',
      studentId: 'user-123',
      studentName: 'John Doe',
      question: 'What is the main topic?',
      answer: 'The main topic is React hooks',
      answeredBy: 'user-456',
      answeredAt: new Date('2024-01-01T10:05:00Z'),
      isAnonymous: false,
      timestamp: new Date('2024-01-01T10:03:00Z'),
    },
  ];

  const mockParticipants = [
    { userId: 'user-123', userRole: 'student' },
    { userId: 'user-456', userRole: 'mentor' },
  ];

  const mockSendMessage = jest.fn();
  const mockCreateQA = jest.fn();
  const mockAnswerQA = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLiveSession.mockReturnValue({
      messages: mockMessages,
      qas: mockQAs,
      polls: [],
      participants: mockParticipants,
      sessionStatus: 'live',
      sendMessage: mockSendMessage,
      createQA: mockCreateQA,
      answerQA: mockAnswerQA,
      createPoll: jest.fn(),
      submitPollResponse: jest.fn(),
      updateSessionStatus: jest.fn(),
      isConnected: true,
    });
  });

  it('renders chat interface with tabs', () => {
    render(<LiveSessionChat {...mockProps} />);
    
    expect(screen.getByText('Chat (2)')).toBeInTheDocument();
    expect(screen.getByText('Q&A (1)')).toBeInTheDocument();
    expect(screen.getByText('2 participants')).toBeInTheDocument();
  });

  it('displays connection status', () => {
    render(<LiveSessionChat {...mockProps} />);
    
    // Should show green dot for connected status
    const statusIndicator = document.querySelector('.bg-secondary-light');
    expect(statusIndicator).toBeInTheDocument();
  });

  it('shows disconnected status when not connected', () => {
    mockUseLiveSession.mockReturnValue({
      messages: [],
      qas: [],
      polls: [],
      participants: [],
      sessionStatus: 'live',
      sendMessage: mockSendMessage,
      createQA: mockCreateQA,
      answerQA: mockAnswerQA,
      createPoll: jest.fn(),
      submitPollResponse: jest.fn(),
      updateSessionStatus: jest.fn(),
      isConnected: false,
    });

    render(<LiveSessionChat {...mockProps} />);
    
    // Should show red dot for disconnected status
    const statusIndicator = document.querySelector('.bg-error');
    expect(statusIndicator).toBeInTheDocument();
  });

  it('displays chat messages correctly', () => {
    render(<LiveSessionChat {...mockProps} />);
    
    expect(screen.getByText('Welcome to the session!')).toBeInTheDocument();
    expect(screen.getByText('Thank you!')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('allows sending messages when connected', async () => {
    render(<LiveSessionChat {...mockProps} />);
    
    const messageInput = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByText('Send');
    
    fireEvent.change(messageInput, { target: { value: 'Hello everyone!' } });
    fireEvent.click(sendButton);
    
    expect(mockSendMessage).toHaveBeenCalledWith('Hello everyone!', 'text');
    
    // Input should be cleared after sending
    await waitFor(() => {
      expect(messageInput).toHaveValue('');
    });
  });

  it('disables message input when disconnected', () => {
    mockUseLiveSession.mockReturnValue({
      messages: [],
      qas: [],
      polls: [],
      participants: [],
      sessionStatus: 'live',
      sendMessage: mockSendMessage,
      createQA: mockCreateQA,
      answerQA: mockAnswerQA,
      createPoll: jest.fn(),
      submitPollResponse: jest.fn(),
      updateSessionStatus: jest.fn(),
      isConnected: false,
    });

    render(<LiveSessionChat {...mockProps} />);
    
    const messageInput = screen.getByPlaceholderText('Connecting...');
    const sendButton = screen.getByText('Send');
    
    expect(messageInput).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });

  it('switches to Q&A tab and displays questions', () => {
    render(<LiveSessionChat {...mockProps} />);
    
    const qaTab = screen.getByText('Q&A (1)');
    fireEvent.click(qaTab);
    
    expect(screen.getByText('What is the main topic?')).toBeInTheDocument();
    expect(screen.getByText('The main topic is React hooks')).toBeInTheDocument();
  });

  it('allows students to ask questions', async () => {
    render(<LiveSessionChat {...mockProps} />);
    
    const qaTab = screen.getByText('Q&A (1)');
    fireEvent.click(qaTab);
    
    const questionInput = screen.getByPlaceholderText('Ask your question...');
    const askButton = screen.getByText('Ask Question');
    
    fireEvent.change(questionInput, { target: { value: 'How do I use useState?' } });
    fireEvent.click(askButton);
    
    expect(mockCreateQA).toHaveBeenCalledWith('How do I use useState?', false);
    
    // Input should be cleared after asking
    await waitFor(() => {
      expect(questionInput).toHaveValue('');
    });
  });

  it('allows anonymous questions', async () => {
    render(<LiveSessionChat {...mockProps} />);
    
    const qaTab = screen.getByText('Q&A (1)');
    fireEvent.click(qaTab);
    
    const questionInput = screen.getByPlaceholderText('Ask your question...');
    const anonymousCheckbox = screen.getByLabelText('Ask anonymously');
    const askButton = screen.getByText('Ask Question');
    
    fireEvent.change(questionInput, { target: { value: 'Anonymous question' } });
    fireEvent.click(anonymousCheckbox);
    fireEvent.click(askButton);
    
    expect(mockCreateQA).toHaveBeenCalledWith('Anonymous question', true);
  });

  it('shows mentor-specific features for mentors', () => {
    const mentorProps = { ...mockProps, userRole: 'mentor' as const };
    render(<LiveSessionChat {...mentorProps} />);
    
    // Mentors should not see the question input form
    const qaTab = screen.getByText('Q&A (1)');
    fireEvent.click(qaTab);
    
    expect(screen.queryByPlaceholderText('Ask your question...')).not.toBeInTheDocument();
  });

  it('shows "Ask" button for quick question marking', () => {
    render(<LiveSessionChat {...mockProps} />);
    
    const askButton = screen.getByText('Ask');
    const messageInput = screen.getByPlaceholderText('Type your message...');
    
    fireEvent.click(askButton);
    
    expect(messageInput).toHaveValue(' [QUESTION]');
  });

  it('prevents sending empty messages', () => {
    render(<LiveSessionChat {...mockProps} />);
    
    const sendButton = screen.getByText('Send');
    
    // Send button should be disabled when input is empty
    expect(sendButton).toBeDisabled();
    
    const messageInput = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(messageInput, { target: { value: '   ' } }); // Only whitespace
    
    // Should still be disabled for whitespace-only input
    expect(sendButton).toBeDisabled();
  });

  it('prevents asking empty questions', () => {
    render(<LiveSessionChat {...mockProps} />);
    
    const qaTab = screen.getByText('Q&A (1)');
    fireEvent.click(qaTab);
    
    const askButton = screen.getByText('Ask Question');
    
    // Ask button should be disabled when input is empty
    expect(askButton).toBeDisabled();
    
    const questionInput = screen.getByPlaceholderText('Ask your question...');
    fireEvent.change(questionInput, { target: { value: '   ' } }); // Only whitespace
    
    // Should still be disabled for whitespace-only input
    expect(askButton).toBeDisabled();
  });

  it('displays "No messages yet" when there are no messages', () => {
    mockUseLiveSession.mockReturnValue({
      messages: [],
      qas: [],
      polls: [],
      participants: [],
      sessionStatus: 'live',
      sendMessage: mockSendMessage,
      createQA: mockCreateQA,
      answerQA: mockAnswerQA,
      createPoll: jest.fn(),
      submitPollResponse: jest.fn(),
      updateSessionStatus: jest.fn(),
      isConnected: true,
    });

    render(<LiveSessionChat {...mockProps} />);
    
    expect(screen.getByText('No messages yet. Start the conversation!')).toBeInTheDocument();
  });

  it('displays "No questions yet" when there are no Q&As', () => {
    mockUseLiveSession.mockReturnValue({
      messages: [],
      qas: [],
      polls: [],
      participants: [],
      sessionStatus: 'live',
      sendMessage: mockSendMessage,
      createQA: mockCreateQA,
      answerQA: mockAnswerQA,
      createPoll: jest.fn(),
      submitPollResponse: jest.fn(),
      updateSessionStatus: jest.fn(),
      isConnected: true,
    });

    render(<LiveSessionChat {...mockProps} />);
    
    const qaTab = screen.getByText('Q&A (0)');
    fireEvent.click(qaTab);
    
    expect(screen.getByText('No questions yet.')).toBeInTheDocument();
  });

  it('formats timestamps correctly', () => {
    render(<LiveSessionChat {...mockProps} />);
    
    // Should display time in HH:MM format
    expect(screen.getByText('10:00')).toBeInTheDocument();
    expect(screen.getByText('10:01')).toBeInTheDocument();
  });

  it('handles form submission with Enter key', () => {
    render(<LiveSessionChat {...mockProps} />);
    
    const messageInput = screen.getByPlaceholderText('Type your message...');
    
    fireEvent.change(messageInput, { target: { value: 'Test message' } });
    fireEvent.submit(messageInput.closest('form')!);
    
    expect(mockSendMessage).toHaveBeenCalledWith('Test message', 'text');
  });
});


